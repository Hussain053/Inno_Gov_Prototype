# BACKEND_API_GUIDE.md

## Overview
This guide lists all public REST endpoints exposed by the InnoGov FastAPI backend, grouped by feature. Each table shows HTTP method, path, required role, brief request/response schema, and common error codes.

### Authentication
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /auth/register | STARTUP (public) | `{name,email,password,organization}` | `201 Created` – user profile | 409 Conflict (email exists) |
| POST | /auth/register/government | GOVERNMENT (public, verification) | `{name,email,password,organization,department,government_service_id}` | `201 Created` – user profile | 400 Bad Request (verification failed), 409 Conflict |
| POST | /auth/register/evaluator | EVALUATOR (public, verification) | `{name,email,password,organization,evaluator_service_id}` | `201 Created` – user profile | 400 Bad Request, 409 Conflict |
| POST | /auth/login | Any | `{email,password}` | `{access_token, token_type}` | 401 Unauthorized |
| GET | /auth/me | Authenticated | – | User profile | 401 Unauthorized |

### Challenges
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /challenges | GOVERNMENT | `{title,description,deadline}` | `201 Created` – challenge object | 400 Validation |
| GET | /challenges | Any (public) | – | List of challenges | – |
| GET | /challenges/{id} | Any | – | Challenge detail | 404 Not found |
| PATCH | /challenges/{id} | GOVERNMENT (owner) | Partial fields | `200 OK` – updated challenge | 403 Forbidden, 404 Not found |

### Applications
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /applications | STARTUP | `{challenge_id, proposal, budget}` | `201 Created` – application | 400 Validation, 403 Forbidden |
| GET | /applications/{id} | GOVERNMENT (owner of challenge) | – | Application detail | 404 Not found |
| POST | /applications/{id}/shortlist | GOVERNMENT | – | `200 OK` – status = SHORTLISTED | 403 Forbidden, 400 Invalid transition |

### Pilots
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /pilots | GOVERNMENT | `{challenge_id, startup_id, start_date, end_date}` | `201 Created` – pilot | 400 Validation, 409 Conflict (duplicate) |
| PATCH | /pilots/{id}/status | GOVERNMENT | `{status}` | `200 OK` – updated pilot | 403 Forbidden, 400 Invalid transition |

### Pilot Submissions
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /pilot_submissions | STARTUP | `{pilot_id, report, metrics}` | `201 Created` – submission | 403 Forbidden, 400 Validation |

### Evaluator Assignments & Evaluations
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /evaluator_assignments | ADMIN | `{pilot_submission_id, evaluator_id}` | `201 Created` – assignment | 403 Forbidden |
| POST | /evaluations | EVALUATOR | `{assignment_id, score, feedback}` | `201 Created` – evaluation | 403 Forbidden, 400 Invalid state |

### Contracts
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /contracts | GOVERNMENT | `{evaluation_id, terms}` | `201 Created` – contract | 403 Forbidden, 400 Validation |

### Notifications
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /notifications | Authenticated | – | List of unread notifications | 401 Unauthorized |
| POST | /notifications/mark-read | Authenticated | `{notification_ids}` | `200 OK` – marked read | 400 Bad request |

### Admin
| Method | Path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /admin/users | ADMIN | – | List of all users | 403 Forbidden |
| PATCH | /admin/users/{id} | ADMIN | `{is_active, role}` | `200 OK` – updated user | 403 Forbidden |

All endpoints require the `Authorization: Bearer <JWT>` header except the public registration and login routes. Detailed request/response schemas are defined in `app/schemas/*` and appear in the generated OpenAPI spec (`/docs`).
