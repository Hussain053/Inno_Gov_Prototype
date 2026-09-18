// Strictly typed interfaces matching FastAPI Pydantic schemas and SQLAlchemy models

export type UserRole = 'STARTUP' | 'GOVERNMENT' | 'EVALUATOR' | 'ADMIN';

export type ChallengeStatus = 
  | 'DRAFT' 
  | 'OPEN' 
  | 'CLOSED' 
  | 'IN_REVIEW' 
  | 'AWARDED' 
  | 'COMPLETED';

export type ApplicationStatus = 
  | 'DRAFT' 
  | 'INVITED'
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'SHORTLISTED' 
  | 'REJECTED' 
  | 'WITHDRAWN';

export type PilotStatus = 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'FAILED';

export type PilotSubmissionStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_EVALUATION' 
  | 'ACCEPTED' 
  | 'REJECTED';

export type AssignmentStatus = 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

export type EvaluationStatus = 
  | 'PENDING' 
  | 'COMPLETED';

export type EvaluationRecommendation = 
  | 'RECOMMEND' 
  | 'DO_NOT_RECOMMEND';

export type ContractStatus = 
  | 'DRAFT' 
  | 'AWARDED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'TERMINATED';

export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_UNDER_REVIEW'
  | 'APPLICATION_SHORTLISTED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WITHDRAWN'
  | 'PILOT_ASSIGNED'
  | 'PILOT_STARTED'
  | 'PILOT_COMPLETED'
  | 'PILOT_FAILED'
  | 'SUBMISSION_SUBMITTED'
  | 'SUBMISSION_UNDER_EVALUATION'
  | 'SUBMISSION_ACCEPTED'
  | 'SUBMISSION_REJECTED'
  | 'EVALUATION_COMPLETED'
  | 'CONTRACT_AWARDED'
  | 'CONTRACT_ACTIVE'
  | 'CONTRACT_COMPLETED'
  | 'CONTRACT_TERMINATED'
  | 'CHALLENGE_CREATED'
  | 'CHALLENGE_CLOSED';

export interface User {
  id: number;
  name: str;
  email: str;
  role: UserRole;
  organization?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type str = string;

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface StartupProfile {
  id: number;
  user_id: number;
  company_name: string;
  description?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  team_size?: number | null;
  experience?: string | null;
  kpi_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: number;
  government_user_id: number;
  title: string;
  description: string;
  problem_statement: string;
  category?: string | null;
  location?: string | null;
  budget?: number | null;
  application_deadline?: string | null;
  status: ChallengeStatus;
  requirements?: Record<string, any> | null;
  kpis?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  challenge_id: number;
  startup_id: number;
  status: ApplicationStatus;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  startup_name?: string | null;
  challenge_title?: string | null;
  startup_industry?: string | null;
  challenge?: Challenge;
  startup?: User;
}

export interface Pilot {
  id: number;
  challenge_id: number;
  startup_id: number;
  title: string;
  task_description: string;
  requirements?: Record<string, any> | null;
  success_criteria?: Record<string, any> | null;
  kpis?: Record<string, any> | null;
  start_date?: string | null;
  end_date?: string | null;
  status: PilotStatus;
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
  startup?: User;
  submission?: PilotSubmission;
}

export interface PilotSubmission {
  id: number;
  pilot_id: number;
  startup_id: number;
  results?: string | null;
  kpi_results?: Record<string, any> | null;
  evidence?: Record<string, any> | null;
  status: PilotSubmissionStatus;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  pilot?: Pilot;
  startup?: User | null;
  startup_name?: string | null;
}

export interface EvaluatorAssignment {
  id: number;
  pilot_submission_id: number;
  evaluator_id: number;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  pilot_submission?: PilotSubmission;
  evaluator?: User;
}

export interface Evaluation {
  id: number;
  pilot_submission_id: number;
  evaluator_id: number;
  technical_score?: number | null;
  kpi_score?: number | null;
  innovation_score?: number | null;
  feasibility_score?: number | null;
  impact_score?: number | null;
  overall_score?: number | null;
  comments?: string | null;
  recommendation?: EvaluationRecommendation | null;
  status: EvaluationStatus;
  created_at: string;
  updated_at: string;
  pilot_submission?: PilotSubmission;
  evaluator?: User;
}

export interface EvaluationSummary {
  pilot_submission_id: number;
  completed_evaluations_count: number;
  avg_overall_score?: number | null;
  avg_technical_score?: number | null;
  avg_kpi_score?: number | null;
  avg_innovation_score?: number | null;
  avg_feasibility_score?: number | null;
  avg_impact_score?: number | null;
  recommendations_breakdown: Record<string, number>;
}

export interface Contract {
  id: number;
  challenge_id: number;
  startup_id: number;
  pilot_id: number;
  government_user_id: number;
  contract_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
  startup?: User;
  pilot?: Pilot;
}

export interface MatchResponse {
  challenge_id: number;
  startup_id: number;
  match_score: number;
  matched_domains?: string[];
  matched_skills?: string[];
  matched_technologies?: string[];
  matched_kpis: string[];
  explanation: string[];
  breakdown: Record<string, number>;
  // UI enrichment
  startup_name?: string;
  industry?: string;
}

export interface Notification {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  resource_type?: string | null;
  resource_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface ActivityLog {
  id: number;
  actor_user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number | null;
  description: string;
  extra_metadata?: Record<string, any> | null;
  created_at: string;
}

// Dashboards
export interface StartupDashboardResponse {
  profile_completed: boolean;
  total_applications: number;
  submitted_applications: number;
  shortlisted_applications: number;
  rejected_applications: number;
  withdrawn_applications: number;
  active_pilots: number;
  completed_pilots: number;
  total_submissions: number;
  total_contracts: number;
  total_contract_value: number;
}

export interface GovernmentDashboardResponse {
  total_challenges: number;
  open_challenges: number;
  closed_challenges: number;
  draft_challenges: number;
  total_applications_received: number;
  applications_under_review: number;
  shortlisted_applications: number;
  active_pilots: number;
  completed_pilots: number;
  contracts_awarded: number;
  total_contract_value: number;
}

export interface EvaluatorDashboardResponse {
  evaluations_completed: number;
  evaluations_pending: number;
  submissions_available_for_evaluation: number;
  average_overall_score?: number | null;
  recommendations_breakdown: Record<string, number>;
}

export interface AdminDashboardResponse {
  total_users: number;
  users_by_role: Record<string, number>;
  total_startups: number;
  total_challenges: number;
  open_challenges: number;
  total_applications: number;
  active_pilots: number;
  completed_pilots: number;
  total_evaluations: number;
  contracts_awarded: number;
  total_contract_value: number;
}

export interface MilestonePayment {
  id: string;
  title: string;
  amount: number;
  status: 'PAID' | 'APPROVED' | 'IN_REVIEW' | 'UPCOMING';
  target_date: string;
  deliverables: string;
  transaction_ref?: string;
  is_demo: boolean;
}
