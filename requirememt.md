# KutumbSetu — Beneficiary Management & Scheme Discovery System

**Version:** 1.0
**Type:** Hackathon MVP
**Primary Users:** Citizens and Government Officers
**Target:** Gujarat Government Scheme Beneficiary Management

---

## 1. Project Overview

### 1.1 Problem Statement

Citizens may be eligible for multiple government welfare schemes based on factors such as:

* Family income
* Age
* Education
* Occupation
* Family composition
* Location
* Social/economic circumstances
* Other scheme-specific criteria

However, citizens may not know:

* Which schemes are relevant to their family
* Whether they may qualify
* What documents are required
* How to request a benefit
* The current status of their applications

At the same time, government officers need a reliable way to:

* Verify family information
* Manage families in their jurisdiction
* Review benefit requests
* Approve or reject requests
* Maintain a consistent family-level record

### 1.2 Proposed Solution

Build a **Family ID-based beneficiary management platform** where:

1. A citizen creates a family profile.
2. The system assigns a unique Family ID.
3. The family enters a pending verification state.
4. A government officer reviews and verifies the family.
5. Once verified, the system evaluates the family against configured scheme rules.
6. The citizen sees potentially applicable schemes.
7. The citizen can request a benefit.
8. The government officer reviews and approves/rejects the request.
9. Citizens can ask questions about scheme documents using an AI/RAG assistant.

---

# 2. Goals

## 2.1 Primary Goals

The MVP should demonstrate:

* Citizen registration
* Role-based login
* Family creation
* Family member management
* Family verification
* Unique Family ID generation
* Scheme eligibility evaluation
* Benefit discovery
* Benefit request
* Officer approval/rejection
* Scheme document Q&A

## 2.2 Secondary Goals

The system should also demonstrate:

* Family-level welfare visibility
* AI-assisted scheme information retrieval

---

# 3. Non-Goals for the Hackathon

Because this is an **8-hour solo implementation**, the following are explicitly outside the MVP:

* Real Aadhaar API integration
* Real government employee database integration
* Real government scheme API integration
* Real payment/disbursement
* Production-grade authentication
* Actual government deployment
* Mobile application
* Advanced machine learning eligibility prediction
* Complex multi-agent architecture
* MCP
* Microservices
* Blockchain
* Real-time notification infrastructure

These can be listed under **Future Scope**.

---

# 4. User Roles

The system has three primary roles.

## 4.1 Citizen

A citizen can:

* Create an account
* Create a family
* Add family members
* Submit the family for verification
* View Family ID
* View family verification status
* View potentially applicable schemes
* View scheme requirements
* Request benefits
* Track benefit requests
* Ask questions about scheme documents

---

## 4.2 Government Officer

A government officer can:

* Create an officer account
* Log in
* View families belonging to their jurisdiction
* Review family information
* Approve/reject family registrations
* View potential benefits
* Review citizen benefit requests
* Approve/reject benefit requests
* View family and benefit statistics

---

## 4.3 Admin

An administrator can:

* Log in securely
* Add new government schemes to the system
* Update existing scheme rules and criteria
* Manage global settings
* Oversee all officers and citizens

---

# 5. Authentication & Authorization

## 5.1 Login

Both users use the same login interface.

### Inputs

* Email/mobile
* Password
* Role

### System behavior

The backend authenticates the user and determines their role.

```text
Login
  ↓
Authentication
  ↓
User
  ├── CITIZEN → Citizen Dashboard
  ├── OFFICER → Officer Dashboard
  └── ADMIN   → Admin Dashboard
```

### Security requirement

The frontend must **not be trusted to determine authorization**.

The backend must verify:

```text
authenticated_user.role
```

before allowing protected operations.

---

# 6. Citizen Registration

## 6.1 Registration Fields

```text
Name
Mobile
Email
Password
Address
Village
Taluka
District
```

### Identity Verification

For the hackathon:

> Identity verification will be simulated.

The system may use a mock identity verification mechanism instead of collecting real Aadhaar numbers.

Example:

```text
Identity Verification
Status: ✓ Verified
```

### Future implementation

A production system could integrate an authorized identity-verification mechanism rather than storing raw Aadhaar information.

---

# 7. Government Officer Registration

## 7.1 Fields

```text
Name
Employee ID
Department
Designation
Village
Taluka
District
Email
Password
```

### Verification

For the hackathon:

```text
Employee ID
      ↓
Mock Government Employee Registry
      ↓
Verified / Rejected
```

Example mock record:

```text
Employee ID: GJ-REV-10231
Name: Amit Patel
Department: Revenue
District: Ahmedabad
Status: VERIFIED
```

The officer's role should be assigned by the backend after successful verification.

---

# 8. Family Management

## 8.1 Family Creation

A citizen can create a family only after successful authentication.

### Family Information

```text
Head of Family
Address
Village
Taluka
District
Annual Income
Caste
Number of Members
```

### Family Members

Each member should contain:

```text
Name
Age
Gender
Relationship
Occupation
Student Status
Is Parent Alive (if student)
```

Optional demo fields:

```text
Disability Status
Employment Status
```

---

# 9. Family ID Generation

After family creation, the system generates a unique Family ID.

Example:

```text
GJ-FAM-2026-001024
```

Requirements:

* Must be unique
* Must not change after creation
* Must be associated with exactly one family record

Example:

```text
Family ID: GJ-FAM-2026-001024
Status: PENDING_VERIFICATION
```

---

# 10. Family Verification Workflow

This is one of the core features.

### State machine

```text
                ┌───────────┐
                │   DRAFT   │
                └─────┬─────┘
                      │ Submit
                      ▼
             ┌──────────────────┐
             │ PENDING_VERIFICATION │
             └────────┬─────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
        ┌──────────┐      ┌──────────┐
        │ VERIFIED │      │ REJECTED │
        └──────────┘      └──────────┘
```

## 10.1 Pending

Citizen submits the family.

```text
Status = PENDING_VERIFICATION
```

The family appears in the relevant officer's dashboard.

---

## 10.2 Officer Review

Officer can see:

* Family ID
* Family head
* Members
* Income
* Caste
* Address
* Village
* District
* Other submitted information

---

## 10.3 Approve

Officer clicks:

**Approve Family**

System:

```text
family.status = VERIFIED
```

And records:

```text
verified_by
verified_at
```

---

## 10.4 Reject

Officer can reject the family.

The officer must provide:

```text
Rejection Reason
```

Example:

> Address information could not be verified.

Status:

```text
REJECTED
```

Citizen can view the reason.

---

# 11. Jurisdiction Management

An officer should not see every family in Gujarat.

For the MVP:

```text
Officer
   ↓
Village / District Area
   ↓
Families belonging to that village/area
```

Example:

```text
Officer Village = Ranip (Ahmedabad)

Officer sees:

GJ-FAM-001 → Ranip
GJ-FAM-002 → Ranip
GJ-FAM-003 → Ranip
```

But not:

```text
GJ-FAM-004 → Vastrapur
```

This demonstrates basic authorization and realistic government workflow based on the officer's assigned village or area.

---

# 12. Scheme Management

The system contains a predefined set of government schemes for the hackathon.

Each scheme contains:

```text
Scheme ID
Scheme Name
Description
Eligibility Criteria
Required Documents
Benefits
Official Source
```

Example:

```text
Scheme:
Education Support

Criteria:
- Student age between X and Y
- Family income below configured threshold

Documents:
- Income certificate
- Student enrollment proof
- Identity proof
```

For the hackathon, use **real publicly documented scheme information where possible**, but clearly label the demo data and avoid presenting simulated rules as official eligibility determinations.

---

# 13. Eligibility / Scheme Recommendation Engine

This is the main intelligence behind benefit discovery.

## Important design principle

The eligibility engine should be **deterministic/rule-based**, not LLM-based.

Example:

```text
Family Data
     ↓
Rule Engine
     ↓
Scheme Criteria
     ↓
Potentially Applicable Schemes
```

Example:

```python
if family.income <= scheme.max_income:
    income_condition = True
```

And:

```python
if member.age >= scheme.min_age:
    age_condition = True
```

The engine evaluates all configured rules.

---

# 14. Potentially Applicable vs Eligible

The system should preferably display:

> **Potentially Applicable**

rather than making a legal/administrative claim that someone is definitively eligible.

Example:

```text
Education Support

✓ Potentially Applicable

Why?
• Family income meets configured threshold
• Family contains a student in the relevant age group

Final eligibility is subject to official verification.
```

This is important because the hackathon's rule engine is only a prototype.

---

# 15. Citizen Dashboard

The citizen dashboard contains four major sections.

## 15.1 Family Overview

```text
Family ID
Family Head
Number of Members
District
Annual Income
Verification Status
```

Example:

```text
Family ID: GJ-FAM-2026-001024

Status: 🟢 VERIFIED

Members: 5
District: Ahmedabad
```

---

## 15.2 Benefits

Display potentially applicable schemes.

Example:

```text
Potentially Applicable Benefits

┌─────────────────────────────┐
│ Education Support           │
│                             │
│ ✓ Potentially applicable    │
│                             │
│ [View Details] [Request]    │
└─────────────────────────────┘
```

---

## 15.3 My Requests

Example:

```text
Education Support    🟡 Pending
Health Assistance    🟢 Approved
Housing Assistance   🔴 Rejected
```

Statuses:

```text
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
```

---

## 15.4 Scheme Assistant

Citizen can ask:

```text
"What documents do I need?"

"How does this scheme work?"

"Why was this scheme suggested?"

"What is the application process?"
```

The system uses RAG to retrieve relevant scheme documentation.

---

# 16. Benefit Request Workflow

```text
Potentially Applicable Scheme
            ↓
        Citizen
            ↓
     Click "Request"
            ↓
     Required documents
            ↓
      Submit Request
            ↓
     UNDER_REVIEW
            ↓
        Officer
       /       \
   Approve     Reject
```

---

# 17. Required Documents

For every scheme, define required documents.

Example:

```text
Education Support

Required:
✓ Identity proof
✓ Income certificate
✓ Student enrollment proof
```

The system can show:

```text
Documents

✓ Income certificate
✓ Identity proof
⚠ Student enrollment proof
```

If something is missing:

```text
⚠ Missing document

Student enrollment proof

[Upload / Add Document]
```

For the 8-hour MVP, document upload can be optional or simulated.

---

# 18. Officer Dashboard

## 18.1 Summary Cards

```text
Pending Families       12
Verified Families      145
Benefit Requests        23
Pending Requests         8
```

---

## 18.2 Family Verification Table

```text
Family ID | Head | Members | District | Status | Action
---------------------------------------------------------
GJ-001    | Raj  | 5       | Ahmedabad| Pending| Review
GJ-002    | Amit | 4       | Ahmedabad| Pending| Review
```

---

## 18.3 Family Details

Officer can view:

```text
Family information
Family members
Income
Address
Documents
Potential benefits
```

Actions:

```text
Approve Family
Reject Family
```

---

# 19. Benefit Request Review

Officer sees:

```text
Family: GJ-FAM-001
Scheme: Education Support

Eligibility checks:
✓ Income
✓ Student
✓ Age

Documents:
✓ Income Certificate
✓ Identity
⚠ Enrollment Certificate
```

Actions:

```text
Approve
Reject
```

If rejected:

```text
Rejection Reason
```

---

# 20. RAG / AI Requirement

The AI component should answer questions based on scheme documents.

### Pipeline

```text
Scheme Documents
       ↓
Document Loader
       ↓
Text Extraction
       ↓
Chunking
       ↓
Embeddings
       ↓
Vector Store
       ↓
Retriever
       ↓
LLM
       ↓
Answer + Source
```

### Example

User:

> What documents are required for Education Support?

Retriever finds relevant scheme content.

LLM generates:

> Based on the scheme guidelines, the required documents include...

Then display:

```text
Source:
Education Support Guidelines
Section: Required Documents
```

---

# 21. AI Guardrails

The AI should:

1. Answer only from retrieved scheme information.
2. Avoid inventing requirements.
3. Clearly state when information isn't found.
4. Avoid making final eligibility decisions.
5. Provide the source/document used.

Example fallback:

> "I couldn't find this information in the available scheme documents."

---

# 22. Notifications

For the MVP, notifications can be simple dashboard alerts.

### Citizen

```text
🔔 Family verification completed.

🔔 Education Support request approved.
```

### Officer

```text
🔔 New family registration requires verification.

🔔 New benefit request requires review.
```

No real-time notification infrastructure is required.

---

# 23. Data Model

A simple relational database is sufficient.

### users

```text
id
name
email
mobile
password_hash
role
created_at
```

Role:

```text
CITIZEN
OFFICER
ADMIN
```

### officers

```text
id
user_id
employee_id
department
designation
village
taluka
district
verification_status
```

### families

```text
id
family_id
head_member_id
annual_income
caste
address
village
taluka
district
status
created_by
verified_by
verified_at
rejection_reason
created_at
```

### family_members

```text
id
family_id
name
age
gender
relationship
occupation
is_student
is_parent_alive
```

### schemes

```text
id
name
description
criteria
required_documents
source
created_by
```

### benefit_requests

```text
id
family_id
scheme_id
status
requested_at
reviewed_by
reviewed_at
rejection_reason
```

### documents

```text
id
family_id
document_type
file_path
status
```

For the MVP, you can simplify this further if necessary.

---

# 24. API Requirements

### Authentication

```http
POST /auth/signup/citizen
POST /auth/signup/officer
POST /auth/login
```

### Family

```http
POST /families
GET /families/:id
POST /families/:id/members
GET /families/:id/members
```

### Officer

```http
GET /officer/families
GET /officer/families/:id
PATCH /officer/families/:id/approve
PATCH /officer/families/:id/reject
```

### Schemes

```http
GET /families/:id/schemes
GET /schemes/:id
```

### Benefit Requests

```http
POST /benefit-requests
GET /benefit-requests
GET /officer/benefit-requests
PATCH /benefit-requests/:id/approve
PATCH /benefit-requests/:id/reject
```

### AI

```http
POST /assistant/ask
```

---

# 25. Authorization Matrix

| Action                     | Citizen |  Officer |    Admin |
| -------------------------- | ------: | -------: | -------: |
| Create account             |       ✅ |        ✅ |        ❌ |
| Login                      |       ✅ |        ✅ |        ✅ |
| Create family              |       ✅ |        ❌ |        ❌ |
| Add members                |       ✅ |        ❌ |        ❌ |
| View own family            |       ✅ |        ❌ |        ❌ |
| View jurisdiction families |       ❌ |        ✅ |        ✅ |
| Approve family             |       ❌ |        ✅ |        ❌ |
| Reject family              |       ❌ |        ✅ |        ❌ |
| View potential benefits    |       ✅ |        ✅ |        ✅ |
| Request benefit            |       ✅ |        ❌ |        ❌ |
| Approve benefit            |       ❌ |        ✅ |        ❌ |
| Reject benefit             |       ❌ |        ✅ |        ❌ |
| Ask scheme assistant       |       ✅ | Optional | Optional |
| Manage schemes             |       ❌ |        ❌ |        ✅ |

---

# 26. Security Requirements

For the prototype:

### Authentication

* Passwords must be hashed.
* Never store plain-text passwords.
* Protected APIs require authentication.

### Authorization

Backend must enforce:

```text
CITIZEN ≠ OFFICER
```

A citizen must not be able to call:

```http
PATCH /officer/families/:id/approve
```

simply by changing frontend code.

### Data isolation

Citizen:

> Can access their own family.

Officer:

> Can access families in their assigned jurisdiction.

---

# 27. UI Structure

You can maintain your four major pages:

```text
/login
/signup
/officer/dashboard
/citizen/dashboard
```

And use modals/drawers rather than creating many additional pages.

### Citizen Dashboard

```text
┌───────────────────────────────────────────────┐
│ Family ID                     Notifications   │
├───────────────────────────────────────────────┤
│                                               │
│ Family Status: VERIFIED                       │
│                                               │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Family     │ │ Benefits   │ │ Requests   │ │
│ │ 5 Members  │ │     4      │ │     2      │ │
│ └────────────┘ └────────────┘ └────────────┘ │
│                                               │
│ Potentially Applicable Benefits               │
│                                               │
│ [Education] [Health] [Housing]               │
│                                               │
│ ────────────────────────────────────────────  │
│                                               │
│ Ask Scheme Assistant                          │
│ [ What documents do I need?       ] [Ask]    │
└───────────────────────────────────────────────┘
```

### Officer Dashboard

```text
┌───────────────────────────────────────────────┐
│ Officer Dashboard             Ranip Village  │
├───────────────────────────────────────────────┤
│                                               │
│ Pending     Verified     Requests             │
│    12          145          23                │
│                                               │
│ Family Verification                           │
│                                               │
│ GJ-001  Rajesh   5   Pending   [Review]      │
│ GJ-002  Amit     4   Pending   [Review]      │
│                                               │
│ Benefit Requests                              │
│                                               │
│ GJ-003  Education     Pending   [Review]     │
└───────────────────────────────────────────────┘
```

---

# 28. End-to-End Demo Scenario

This should be your **main hackathon demo**.

### Step 1 — Citizen registers

```text
Citizen → Signup
```

### Step 2 — Creates family

```text
5 family members
Income: ₹1.8L
District: Ahmedabad
```

System generates:

```text
GJ-FAM-2026-001024
```

Status:

```text
PENDING_VERIFICATION
```

### Step 3 — Officer logs in

Officer sees:

```text
1 new family awaiting verification
```

### Step 4 — Officer reviews

Officer checks:

* Family members
* Income
* Address
* Documents

Then:

```text
APPROVE
```

### Step 5 — System evaluates schemes

```text
Family
  ↓
Eligibility Rules
  ↓
Education Support
Health Assistance
Housing Assistance
```

### Step 6 — Citizen sees recommendations

```text
🎓 Education Support
Potentially applicable

🏥 Health Assistance
Potentially applicable
```

### Step 7 — Citizen requests benefit

```text
Education Support
[Request Benefit]
```

### Step 8 — Officer reviews

```text
Education Support Request

✓ Income criteria
✓ Student criteria
✓ Required documents

[Approve]
```

### Step 9 — Citizen receives result

```text
Education Support

🟢 APPROVED
```

### Step 10 — AI interaction

Citizen asks:

> "What documents are required for this scheme?"

RAG retrieves the official/demo scheme document and answers with the source.

---

# 29. 8-Hour Implementation Priority

Because you're alone, use this priority order:

### 🔴 P0 — Absolutely required

```text
Login
Signup
Citizen family creation
Family ID
Officer dashboard
Family approval
Scheme rules
Benefit suggestions
Benefit request
Officer approval
```

### 🟡 P1 — Important

```text
RAG assistant
Request status
Rejection reasons
Officer jurisdiction
```

### 🟢 P2 — If time remains

```text
Document upload
Notifications
Analytics
Better animations
Advanced filtering
```

If you're at hour 6 and the RAG isn't working, **don't sacrifice the core workflow to finish RAG**. A complete rule-based workflow is more valuable than a broken AI feature.

---

# 30. Future Scope

After the hackathon, the system could evolve toward:

### Identity

* Authorized Aadhaar/e-KYC integration
* Government identity systems
* Digital signatures

### Family verification

* Cross-verification with government databases
* Address verification
* Duplicate-family detection
* Family relationship verification

### Scheme discovery

* More government schemes
* Dynamic scheme rules
* Multilingual support
* Personalized notifications

### AI

* Multilingual scheme assistant
* Voice assistant
* Document extraction
* Explainable eligibility
* Automated document checklist

### Government integration

```text
Family ID
    ↓
Government Databases
    ↓
Scheme Systems
    ↓
Application Tracking
    ↓
Benefit Delivery
```

---

# 31. Key Value Proposition

Your project should ultimately communicate this:

> **A verified Family ID creates a unified family-level view that helps government officers manage beneficiaries while automatically helping citizens discover potentially applicable welfare schemes and understand how to access them.**

And your strongest technical story is:

```text
Identity
   +
Family Verification
   +
Rule-based Eligibility
   +
Benefit Workflow
   +
RAG Scheme Assistant
```

That is a **realistic MVP for your 8-hour constraint** without turning the project into an unnecessarily large government platform.
