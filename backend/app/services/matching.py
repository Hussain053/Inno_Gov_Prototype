import re
from datetime import datetime
from typing import Any, List, Optional, Set

from app.models.challenge import Challenge
from app.models.startup import StartupProfile
from app.schemas.matching import MatchResponse

STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "have", "are", "was",
    "were", "been", "being", "has", "had", "does", "did", "doing", "would",
    "should", "could", "ought", "you", "your", "them", "their", "what", "which",
    "who", "whom", "these", "those", "am", "is", "be", "having", "do", "a", "an",
    "but", "if", "or", "because", "as", "until", "while", "of", "at", "by",
    "about", "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "to", "up", "down", "in", "out", "on", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "can", "will", "just", "now", "need", "needs", "solution",
    "solutions", "project", "system", "platform", "must", "require", "required",
    "requirements", "seeking", "looking", "provide", "provides", "work", "build"
}


def _extract_keys(data: Any) -> Set[str]:
    """
    Safely extract string key identifiers from a JSONB field (dict, list, or string).
    """
    keys: Set[str] = set()
    if not data:
        return keys

    if isinstance(data, dict):
        for k in data.keys():
            keys.add(str(k).strip().lower())
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                keys.add(item.strip().lower())
            elif isinstance(item, dict):
                for k in item.keys():
                    keys.add(str(k).strip().lower())
    elif isinstance(data, str):
        keys.add(data.strip().lower())

    return keys


def _extract_text_tokens(data: Any) -> Set[str]:
    """
    Extract lowercased word tokens (alphanumeric, length >= 3) from text or nested data.
    """
    tokens: Set[str] = set()
    if not data:
        return tokens

    if isinstance(data, str):
        words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", data.lower())
        tokens.update(words)
    elif isinstance(data, dict):
        for k, v in data.items():
            tokens.update(_extract_text_tokens(k))
            tokens.update(_extract_text_tokens(v))
    elif isinstance(data, list):
        for item in data:
            tokens.update(_extract_text_tokens(item))

    return tokens


def _extract_required_team_size(requirements: Any) -> Optional[int]:
    """
    Deterministically extract a numeric team size requirement from challenge requirements JSONB.
    """
    if not requirements:
        return None

    if isinstance(requirements, (int, float)):
        return int(requirements) if requirements > 0 else None

    target_keys = {
        "minteamsize",
        "teamsize",
        "requiredteamsize",
        "minteam",
        "teamsizemin",
        "teamcapacity",
        "minteamcapacity",
        "minimumteamsize",
        "team",
        "capacity",
    }

    if isinstance(requirements, dict):
        for k, v in requirements.items():
            k_norm = str(k).lower().replace("_", "").replace("-", "").replace(" ", "")
            if k_norm in target_keys:
                if isinstance(v, (int, float)) and v > 0:
                    return int(v)
                elif isinstance(v, str) and v.strip().isdigit() and int(v.strip()) > 0:
                    return int(v.strip())
                elif isinstance(v, dict):
                    for nk, nv in v.items():
                        if str(nk).lower() in {"min", "value", "size", "required", "count"}:
                            if isinstance(nv, (int, float)) and nv > 0:
                                return int(nv)
                            elif isinstance(nv, str) and nv.strip().isdigit() and int(nv.strip()) > 0:
                                return int(nv.strip())

        for v in requirements.values():
            if isinstance(v, (dict, list)):
                res = _extract_required_team_size(v)
                if res is not None:
                    return res

    elif isinstance(requirements, list):
        for item in requirements:
            res = _extract_required_team_size(item)
            if res is not None:
                return res

    return None


def calculate_match(
    startup_profile: StartupProfile,
    challenge: Challenge,
) -> MatchResponse:
    """
    Calculate a deterministic, transparent 100-point match score between a startup and a challenge.

    Scoring dimensions:
    - Problem Fit (25)
    - Technology / Skills Fit (20)
    - Experience Relevance (15)
    - Startup Maturity (10)
    - Reputation / Performance Readiness (10)
    - Team Capability (10)
    - KPI Fit (5)
    - Scalability (5)
    """
    explanation: List[str] = []
    breakdown: dict[str, float] = {}

    challenge_text = (
        (challenge.title or "")
        + " "
        + (challenge.description or "")
        + " "
        + (challenge.problem_statement or "")
        + " "
        + (challenge.category or "")
    )
    challenge_tokens = _extract_text_tokens(challenge_text) - STOP_WORDS
    challenge_problem_tokens = _extract_text_tokens(
        (challenge.problem_statement or "") + " " + (challenge.description or "")
    ) - STOP_WORDS
    challenge_keys = _extract_keys(challenge.requirements) | _extract_keys(challenge.kpis)
    challenge_keywords = challenge_tokens | challenge_keys

    startup_description = (startup_profile.description or "")
    startup_experience = (startup_profile.experience or "")
    startup_company = (startup_profile.company_name or "")
    startup_location = (startup_profile.location or "")
    startup_industry = (startup_profile.industry or "")

    startup_tokens = (
        _extract_text_tokens(startup_company)
        | _extract_text_tokens(startup_description)
        | _extract_text_tokens(startup_experience)
        | _extract_text_tokens(startup_location)
        | _extract_text_tokens(startup_industry)
    ) - STOP_WORDS
    startup_capability_tokens = startup_tokens | _extract_keys(startup_profile.kpi_data)

    # 1. Problem Fit (25 points)
    problem_overlap = sorted(startup_tokens & challenge_problem_tokens)
    if challenge_problem_tokens:
        problem_ratio = len(problem_overlap) / len(challenge_problem_tokens)
        problem_score = round(min(25.0, problem_ratio * 25.0), 1)
        if problem_overlap:
            explanation.append(
                f"Problem fit ({problem_score}/25 pts): Startup profile aligns with challenge problem framing (matched terms: {', '.join(problem_overlap[:5])})."
            )
        else:
            explanation.append(
                f"Problem fit ({problem_score}/25 pts): Startup profile shows limited overlap with the challenge problem statement."
            )
    else:
        problem_score = 0.0
        explanation.append("Problem fit (0/25 pts): Challenge problem statement is missing or too sparse for reliable alignment.")
    breakdown["problem_fit"] = problem_score

    # 2. Technology / Skills Fit (20 points)
    tech_overlap = sorted(startup_capability_tokens & challenge_keywords)
    if challenge_keywords:
        tech_ratio = len(tech_overlap) / len(challenge_keywords)
        tech_score = round(min(20.0, tech_ratio * 20.0), 1)
        if tech_overlap:
            explanation.append(
                f"Technology/skills fit ({tech_score}/20 pts): Startup capabilities overlap with challenge technology/skill requirements ({', '.join(tech_overlap[:5])})."
            )
        else:
            explanation.append(
                f"Technology/skills fit ({tech_score}/20 pts): Startup capability signals do not strongly align with challenge requirements."
            )
    else:
        tech_score = 10.0 if startup_capability_tokens else 0.0
        explanation.append(
            f"Technology/skills fit ({tech_score}/20 pts): Challenge has limited structured capability data, so only partial credit was awarded."
        )
    breakdown["technology_skills_fit"] = tech_score

    # 3. Experience Relevance (15 points)
    exp_tokens = _extract_text_tokens(startup_experience) - STOP_WORDS
    matched_experience = sorted(exp_tokens & challenge_tokens)
    if challenge_tokens:
        if matched_experience:
            exp_score = 15.0
            explanation.append(
                f"Experience relevance (15/15 pts): Startup experience directly matches challenge domain and implementation needs ({', '.join(matched_experience[:5])})."
            )
        else:
            exp_score = 0.0
            explanation.append(
                "Experience relevance (0/15 pts): Startup experience does not clearly map to the challenge domain."
            )
    else:
        exp_score = 0.0
        explanation.append("Experience relevance (0/15 pts): Challenge domain data is too sparse for experience matching.")
    breakdown["experience_relevance"] = exp_score

    # 4. Startup Maturity (10 points)
    profile_age_days = 0
    if startup_profile.created_at:
        profile_age_days = max(0, (datetime.utcnow() - startup_profile.created_at).days)

    maturity_score = 0.0
    if profile_age_days > 365:
        maturity_score += 4.0
    elif profile_age_days > 180:
        maturity_score += 2.0

    if startup_profile.team_size and startup_profile.team_size >= 4:
        maturity_score += 2.0
    if startup_profile.experience and len(startup_profile.experience.strip()) > 40:
        maturity_score += 2.0
    if startup_profile.website:
        maturity_score += 1.0
    if startup_profile.kpi_data:
        maturity_score += 1.0

    maturity_score = round(min(10.0, maturity_score), 1)
    explanation.append(
        f"Startup maturity ({maturity_score}/10 pts): Based on profile age, team depth, KPI readiness, and evidence completeness."
    )
    breakdown["startup_maturity"] = maturity_score

    # 5. Reputation / Performance Readiness (10 points)
    reputation_score = 0.0
    if startup_profile.description and len(startup_profile.description.strip()) > 120:
        reputation_score += 3.0
    if startup_profile.website:
        reputation_score += 2.0
    if startup_profile.location:
        reputation_score += 1.0
    if startup_profile.kpi_data and len(startup_profile.kpi_data) >= 2:
        reputation_score += 2.0
    if startup_profile.experience and len(startup_profile.experience.strip()) > 40:
        reputation_score += 2.0
    reputation_score = round(min(10.0, reputation_score), 1)
    explanation.append(
        f"Reputation/performance readiness ({reputation_score}/10 pts): Score reflects profile quality, evidence richness, and operational readiness indicators."
    )
    breakdown["reputation_performance"] = reputation_score

    # 6. Team Capability (10 points)
    team_score = 0.0
    req_team_size = _extract_required_team_size(challenge.requirements)

    if req_team_size is None:
        team_score = 5.0 if (startup_profile.team_size and startup_profile.team_size >= 3) else 0.0
        explanation.append(
            f"Team capability ({team_score}/10 pts): No explicit team-size requirement was present, so partial credit was awarded based on available team depth."
        )
    elif startup_profile.team_size is None or startup_profile.team_size <= 0:
        team_score = 0.0
        explanation.append(
            f"Team capability ({team_score}/10 pts): Startup team size is missing, so the challenge's required team capacity cannot be validated."
        )
    else:
        ratio = startup_profile.team_size / req_team_size
        team_score = round(min(10.0, ratio * 10.0), 1)
        explanation.append(
            f"Team capability ({team_score}/10 pts): Startup team size of {startup_profile.team_size} meets {team_score/10:.0%} of the required capacity benchmark."
        )
    breakdown["team_capability"] = team_score

    # 7. KPI Fit (5 points)
    c_kpis = _extract_keys(challenge.kpis)
    s_kpis = _extract_keys(startup_profile.kpi_data)
    matched_kpi_names: List[str] = sorted(list(c_kpis & s_kpis))

    if c_kpis:
        kpi_ratio = len(matched_kpi_names) / len(c_kpis)
        kpi_score = round(min(5.0, kpi_ratio * 5.0), 1)
        if matched_kpi_names:
            explanation.append(
                f"KPI fit ({kpi_score}/5 pts): Startup KPI dataset matches challenge KPI expectations ({', '.join(matched_kpi_names[:5])})."
            )
        else:
            explanation.append(
                "KPI fit (0/5 pts): Structured KPI data does not overlap with the challenge KPI framework."
            )
    elif s_kpis:
        kpi_score = 2.5
        explanation.append(
            "KPI fit (2.5/5 pts): Challenge defines no explicit KPI schema, but startup has KPI data ready for future reporting."
        )
    else:
        kpi_score = 0.0
        explanation.append("KPI fit (0/5 pts): Neither the challenge nor the startup provides actionable KPI structure.")
    breakdown["kpi_fit"] = kpi_score

    # 8. Scalability (5 points)
    scalability_score = 0.0
    if startup_profile.team_size and startup_profile.team_size >= 6:
        scalability_score += 2.0
    if startup_profile.kpi_data and len(startup_profile.kpi_data) >= 3:
        scalability_score += 1.5
    if challenge.budget and challenge.budget >= 250000:
        scalability_score += 1.5
    scalability_score = round(min(5.0, scalability_score), 1)
    explanation.append(
        f"Scalability ({scalability_score}/5 pts): Based on readiness for growth-stage execution, KPI depth, and challenge scale."
    )
    breakdown["scalability"] = scalability_score

    total_score = round(min(100.0, max(0.0, sum(breakdown.values()))), 1)

    matched_domains = sorted(list(
        (_extract_text_tokens(startup_profile.industry or "") | _extract_text_tokens(startup_profile.description or ""))
        & _extract_text_tokens((challenge.category or "") + " " + (challenge.title or ""))
    ))
    matched_skills = sorted(list(problem_overlap + matched_experience))[:6]
    matched_technologies = sorted(list(tech_overlap))[:6]

    return MatchResponse(
        challenge_id=challenge.id,
        startup_id=startup_profile.user_id,
        match_score=total_score,
        matched_domains=matched_domains,
        matched_skills=matched_skills,
        matched_technologies=matched_technologies,
        matched_kpis=matched_kpi_names,
        explanation=explanation,
        breakdown=breakdown,
    )
