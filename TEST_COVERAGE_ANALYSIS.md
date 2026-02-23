# Test Coverage Analysis

## Current State

The incubator repository currently contains **no source code and no tests**. It is a documentation-only repository used for spawning and discussing ideas before they are built. All content is Markdown documentation.

| Metric | Value |
|--------|-------|
| Source files | 0 |
| Test files | 0 |
| Test frameworks configured | None |
| CI/CD pipelines | None |
| Code coverage | N/A |

## Incubated Project: "Hey Doc, this is me normally"

The primary idea in the repository is a healthcare application where patients create short video profiles so medical staff can see what they are like when well. The MVP feature list includes:

1. Video upload/playback (30-60 seconds)
2. Secure account creation and management
3. Password-based profile sharing with medical staff
4. Patient text information (NHS number, contacts, allergies, medications, etc.)
5. Doctor shortcuts to patient profiles

This application handles **sensitive personal health data** and is subject to strict regulatory requirements (GDPR, NHS data standards). Thorough testing is critical before any deployment.

## Recommended Test Coverage Areas

The following sections outline the testing that should be established as the project moves from incubation to implementation. They are ordered by priority.

### 1. Authentication and Authorization (Critical)

The system involves patients creating secure accounts and doctors accessing profiles via passwords. This is the highest-risk area.

**What to test:**
- Account registration (valid/invalid inputs, duplicate emails, password strength)
- Login flows (correct credentials, incorrect credentials, lockout after failed attempts)
- Password-based profile sharing (token generation, expiration, revocation)
- Session management (timeout, invalidation, concurrent sessions)
- Role separation (patient vs. doctor access controls)
- Authorization checks on every API endpoint (ensure a doctor cannot edit a patient's data, etc.)

**Suggested approach:**
- Unit tests for auth logic (hashing, token generation, validation)
- Integration tests for full login/registration flows
- Security-focused tests: brute force protection, injection in auth fields, CSRF

### 2. Patient Data CRUD Operations (Critical)

Patients manage sensitive personal information. Incorrect data handling could have medical consequences.

**What to test:**
- Create, read, update, and delete for each data type: NHS number, contact details, next of kin, allergies, medications, list of other medics
- Input validation (NHS number format, required fields, field length limits)
- Data integrity (concurrent edits, partial failures, transaction rollback)
- Data deletion (full erasure to comply with GDPR right-to-be-forgotten)
- Edge cases: empty fields, special characters in names, international phone numbers

**Suggested approach:**
- Unit tests for validation logic and data models
- Integration tests against the database layer
- API-level tests for each CRUD endpoint

### 3. Video Upload and Playback (High)

The core feature of the application is a 30-60 second video profile. Video handling has many failure modes.

**What to test:**
- Upload success with valid video formats (MP4, MOV, WebM)
- Rejection of invalid/corrupt files, oversized files, non-video files
- Duration enforcement (reject videos shorter than 30s or longer than 60s)
- Playback across supported platforms (web, iOS, Android)
- Storage and retrieval (video is retrievable after upload, survives restarts)
- Transcoding/compression if applicable
- Streaming vs. download behavior

**Suggested approach:**
- Unit tests for file validation logic
- Integration tests for the upload pipeline (mock storage in unit tests, real storage in integration)
- End-to-end tests for upload-then-playback flow
- Performance tests for concurrent uploads

### 4. Doctor Profile Access (High)

Doctors view patient profiles via password-based access. This is the primary cross-role interaction.

**What to test:**
- Accessing a profile with a valid password
- Rejection with an invalid or expired password
- Save/delete shortcuts to patient profiles
- Doctor cannot modify patient data
- Profile view logging/auditing (who accessed what, when)
- Concurrent access by multiple doctors

**Suggested approach:**
- Integration tests for the access flow
- Authorization tests ensuring read-only access for doctors
- Audit log tests verifying access events are recorded

### 5. Cross-Platform Compatibility (Medium)

The tech spec calls for web, iPhone, and Android support.

**What to test:**
- API contract tests to ensure all clients receive consistent responses
- Platform-specific video playback behavior
- Responsive/adaptive UI on different screen sizes
- Offline behavior and network error handling on mobile

**Suggested approach:**
- Shared API contract tests (e.g., using OpenAPI schema validation)
- Platform-specific UI tests (XCUITest for iOS, Espresso for Android, Playwright/Cypress for web)
- Manual or automated device matrix testing

### 6. Data Privacy and Compliance (Medium)

The app handles NHS numbers, medical information, and personal video. Regulatory compliance is non-negotiable.

**What to test:**
- Data encryption at rest and in transit
- GDPR data export (patient can download all their data)
- GDPR data deletion (full erasure on account deletion)
- Consent management (explicit consent before data collection)
- Data retention policies
- Audit trail completeness

**Suggested approach:**
- Automated compliance checks as part of CI
- Integration tests that verify encryption, export, and deletion flows
- Penetration testing (external, periodic)

### 7. Error Handling and Resilience (Medium)

Healthcare applications must fail gracefully. Showing incorrect data is worse than showing an error.

**What to test:**
- API error responses (4xx and 5xx codes with appropriate messages)
- Database connection failures
- Storage service unavailability (video upload/retrieval when storage is down)
- Malformed request handling
- Rate limiting

**Suggested approach:**
- Unit tests for error handling paths
- Chaos/fault-injection integration tests (simulate service failures)
- Load tests to find breaking points

## Recommended Test Infrastructure

When implementation begins, the following infrastructure should be set up **before writing feature code**:

| Component | Recommendation |
|-----------|---------------|
| Test framework | Jest (JS/TS), pytest (Python), or XCTest/JUnit depending on stack |
| API testing | Supertest, httpx, or equivalent for integration tests |
| E2E testing | Playwright (web), XCUITest (iOS), Espresso (Android) |
| CI/CD | GitHub Actions running tests on every PR |
| Code coverage | Enforce a minimum threshold (suggest 80% line coverage) |
| Security scanning | Dependabot + SAST tool (e.g., Semgrep, CodeQL) |
| Linting | ESLint, Ruff, or equivalent to catch issues before tests run |

## Summary of Priorities

| Priority | Area | Reason |
|----------|------|--------|
| Critical | Authentication & Authorization | Protects patient data; security failure = data breach |
| Critical | Patient Data CRUD | Incorrect medical data can cause harm |
| High | Video Upload & Playback | Core feature; complex failure modes |
| High | Doctor Profile Access | Cross-role interaction; must enforce read-only |
| Medium | Cross-Platform Compatibility | Three platforms must behave consistently |
| Medium | Data Privacy & Compliance | Regulatory requirement (GDPR, NHS) |
| Medium | Error Handling & Resilience | Healthcare apps must fail safely |
