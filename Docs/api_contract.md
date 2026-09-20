# API Contract

## 1. Request / Response Shape

**Standard Success Response (2xx):**
```json
{
  "status": "success",
  "data": { ... } 
}
```

**Standard Error Response (4xx, 5xx):**
```json
{
  "status": "error",
  "message": "Human readable error description",
  "code": "ERROR_CODE"
}
```

## 2. JWT Payload Shape

```json
{
  "userId": 123,
  "role": "CITIZEN | OFFICER | ADMIN",
  "village": "Ranip",      // Only present if role = OFFICER
  "district": "Ahmedabad", // Only present if role = OFFICER
  "iat": 1700000000,
  "exp": 1700043200
}
```

## 3. Scheme Criteria JSON Shape

Used in `schemes.criteria`:
```json
{
  "max_income": 250000,
  "min_income": 0,
  "member_rules": [
    {
      "min_age": 6,
      "max_age": 25,
      "is_student": true,
      "is_parent_alive": false  // For specific orphan benefits etc.
    }
  ]
}
```

## 4. Status Enums

- **Family Verification Status:** `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`
- **Benefit Request Status:** `UNDER_REVIEW`, `APPROVED`, `REJECTED` (Note: skip `REQUESTED` to simplify workflow).
- **Officer Verification Status:** `PENDING`, `VERIFIED`, `REJECTED`

## 5. RAG Storage Strategy
For the 8-hour MVP, we will use **In-Memory** storage (e.g., extracting embeddings into a simple Node array) or a lightweight local JSON store if we need to mock it. If time permits, we can spin up `pgvector` on Supabase.

## 6. Endpoints Outline

### Auth
- `POST /api/auth/signup/citizen`
- `POST /api/auth/signup/officer`
- `POST /api/auth/login`

### Families
- `POST /api/families` -> Create DRAFT
- `POST /api/families/:id/members` -> Add members, submit to PENDING
- `GET /api/families/:id`
- `GET /api/families/:id/members`

### Officers
- `GET /api/officer/families` -> Jurisdiction filtered
- `GET /api/officer/families/:id`
- `PATCH /api/officer/families/:id/approve`
- `PATCH /api/officer/families/:id/reject`
- `GET /api/officer/stats` -> Summary stats

### Schemes & Requests
- `GET /api/families/:id/schemes` -> Potentially applicable
- `POST /api/benefit-requests`
- `GET /api/benefit-requests`
- `GET /api/officer/benefit-requests`
- `PATCH /api/benefit-requests/:id/approve`
- `PATCH /api/benefit-requests/:id/reject`
