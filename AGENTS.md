# AGENTS.md

## Purpose

This file is the operating contract for all coding agents working on this Node.js backend.

The goal is to keep the backend:

- Simple and easy for junior developers to understand.
- Structured using clear separation of concerns.
- Maintainable and predictable.
- DRY without introducing unnecessary abstractions.
- Designed and reviewed with senior backend engineering standards.
- Safe around configuration and secrets.
- Easy for the next agent to continue without reconstructing previous decisions.

---

## 1. Mandatory Rule: Read This File Before Every Change

**Before making ANY change to the codebase, the agent MUST read and follow this `AGENTS.md` file.**

This applies to:

- Creating files.
- Editing files.
- Deleting files.
- Refactoring.
- Installing dependencies.
- Changing configuration.
- Changing database code.
- Changing routes/controllers/services.
- Fixing bugs.
- Adding tests.
- Changing server behaviour.

Do not start implementation until the current contents of `AGENTS.md` have been reviewed.

If the instructions in this file conflict with a user request, follow the user's explicit request where it is safe and technically appropriate, then update this file if the architectural rule should become permanent.

---

## 2. Mandatory Rule: Never Read Environment Files

### Absolute restriction

**Under no circumstances may an agent read, open, print, inspect, parse, cat, grep, search, load, or otherwise access `.env` files or secret-bearing environment files.**

Examples include:

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`
- Any other secret/configuration file containing credentials or private values.

Do not use commands such as:

```bash
cat .env
less .env
grep ... .env
sed ... .env
source .env
```

Do not write code or scripts whose purpose is to extract values from these files.

### Configuration values

The user will explicitly provide required variables/values when they are needed for implementation or debugging.

Agents may work with:

```text
DATABASE_URL=<provided by user>
PORT=<provided by user>
API_KEY=<provided by user>
```

only when the user has explicitly supplied the value in the current working context.

Never attempt to discover missing secrets independently.

### Safe configuration handling

Code should access configuration through `process.env` at runtime where appropriate, but agents must not inspect the underlying secret values.

Prefer a dedicated configuration module such as:

```text
src/config/env.js
```

for validating required environment variable names and exposing configuration to the application.

The configuration module must never log secrets.

---

## 3. Backend Architecture

The server must use a straightforward Express architecture.

Preferred structure:

```text
project/
├── AGENTS.md
├── package.json
├── README.md
├── .gitignore
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   └── env.js
│   │
│   ├── controllers/
│   │   └── <resource>.controller.js
│   │
│   ├── routes/
│   │   └── <resource>.routes.js
│   │
│   ├── services/
│   │   └── <resource>.service.js
│   │
│   ├── middleware/
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   │
│   ├── utils/
│   │   └── <utility>.js
│   │
│   └── database/
│       └── <database files>
│
└── tests/
    └── ...
```

Do not create directories merely because they appear in the example.

**Only create a layer when the application actually needs it.**

The structure should remain small.

---

## 4. Controller Approach

Routes should define HTTP endpoints.

Controllers should handle HTTP concerns:

- Reading request parameters.
- Reading request body.
- Validating request-level input.
- Calling the appropriate service.
- Returning the HTTP response.
- Passing errors to error middleware.

Example:

```js
const userService = require('../services/user.service');

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUser,
};
```

Controllers should **not** contain large business rules or database implementations.

---

## 5. Service Layer

Services contain business logic.

A service should answer questions such as:

- What should happen?
- What business rules apply?
- Which repository/database operation is required?
- How should multiple operations be coordinated?

Example:

```js
async function getUserById(id) {
  // Business logic and data access orchestration.
}
```

Do not create a service layer for trivial logic simply because it is theoretically possible.

Use it when it provides meaningful separation.

---

## 6. Routes

Routes should remain thin.

Example:

```js
const express = require('express');
const controller = require('../controllers/user.controller');

const router = express.Router();

router.get('/:id', controller.getUser);

module.exports = router;
```

Routes should not contain:

- Database queries.
- Complex business logic.
- Large validation blocks.
- Authentication logic that belongs in middleware.
- Response transformation logic that belongs elsewhere.

---

## 7. DRY Principle

Follow **DRY: Don't Repeat Yourself**.

However:

> Do not abstract code merely because two pieces of code look similar.

Prefer duplication over a confusing abstraction when the duplicated code represents different business concepts.

Good candidates for shared utilities:

- Common response formatting.
- Date handling.
- Pagination.
- Validation helpers.
- Authentication helpers.
- Reusable database helpers.
- Common error creation.

Avoid generic "helper" files containing unrelated functions.

Prefer focused utilities:

```text
utils/date.js
utils/pagination.js
utils/errors.js
```

over:

```text
utils/helpers.js
```

containing dozens of unrelated functions.

---

## 8. Senior Backend Development Standards

Before implementing a feature, the agent should reason about:

1. What is the business requirement?
2. What is the API contract?
3. What data enters the system?
4. What validation is required?
5. What business rules apply?
6. What dependencies are involved?
7. What can fail?
8. How should errors be represented?
9. What should be logged?
10. What security implications exist?
11. What happens under repeated requests?
12. How can this be tested?
13. Will a junior developer understand the implementation six months from now?

Prefer boring, explicit, maintainable code over clever code.

---

## 9. Error Handling

Use centralized error handling.

Expected architecture:

```text
Request
  ↓
Route
  ↓
Controller
  ↓
Service
  ↓
Database / External API
  ↓
Controller
  ↓
Response
```

Errors should flow to centralized middleware where practical:

```text
error
  ↓
next(error)
  ↓
error.middleware.js
  ↓
HTTP response
```

Do not expose:

- Secrets.
- Stack traces in production responses.
- Database credentials.
- Internal infrastructure details.
- Sensitive request information.

---

## 10. Validation

Validate external input at the application boundary.

Validate:

- Request body.
- Query parameters.
- Route parameters.
- Headers where relevant.

Do not assume clients send valid data.

Validation should produce clear errors that allow API consumers to understand what was wrong.

Do not duplicate identical validation logic throughout controllers.

---

## 11. Security

Security is part of implementation, not an afterthought.

Agents should consider:

- Input validation.
- Authentication.
- Authorization.
- Rate limiting where appropriate.
- Secure HTTP headers.
- CORS configuration.
- SQL injection prevention.
- Proper parameterized queries.
- Safe error responses.
- Secret handling.
- Dependency vulnerabilities.
- Request size limits.

Never hard-code credentials, API keys, passwords, tokens, or private keys.

---

## 12. Logging

Logs should be useful for diagnosing production problems.

Never log:

- Passwords.
- API keys.
- Access tokens.
- Database credentials.
- Full authorization headers.
- Secret environment variable values.

Prefer structured, meaningful messages.

Bad:

```js
console.log('everything', req);
```

Better:

```js
logger.info('Vehicle created', {
  vehicleId: vehicle.id,
});
```

---

## 13. Naming

Use predictable names.

Prefer:

```text
vehicle.controller.js
vehicle.service.js
vehicle.routes.js
```

Avoid unclear names such as:

```text
vc.js
logic.js
stuff.js
misc.js
helpers2.js
```

Functions should describe what they do:

```js
getVehicleById()
createVehicle()
updateVehicle()
deleteVehicle()
```

Avoid vague names:

```js
process()
handle()
doThing()
run()
```

unless the context genuinely makes the meaning clear.

---

## 14. File Size and Complexity

Keep files focused.

If a file becomes difficult to understand, consider splitting it by responsibility.

Do not split code into dozens of tiny files just to satisfy an architectural pattern.

The target is:

> Small enough to understand, large enough to remain practical.

Avoid unnecessary abstractions, factories, classes, wrappers, and design patterns.

---

## 15. Database Access

Database access must be separated from HTTP concerns.

Never put large database queries directly inside route definitions.

Prefer:

```text
controller
   ↓
service
   ↓
database/repository
```

Use parameterized queries.

Never construct SQL using untrusted input through string concatenation.

---

## 16. API Design

Use predictable REST-style endpoints where REST is appropriate.

Example:

```text
GET    /api/v1/vehicles
GET    /api/v1/vehicles/:id
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id
DELETE /api/v1/vehicles/:id
```

Use consistent response structures.

Example:

```json
{
  "data": {}
}
```

For errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

Do not introduce versioning or complex API conventions unless the project actually needs them.

---

## 17. Dependencies

Before adding a dependency, ask:

- Is it genuinely needed?
- Can the requirement be solved clearly with existing dependencies?
- Is the dependency maintained?
- Does it significantly increase complexity?
- Will a junior developer understand why it exists?

Avoid dependency bloat.

---

## 18. Testing

New meaningful functionality should have tests where practical.

Prioritize tests around:

- Business rules.
- Services.
- Controllers/API behaviour.
- Validation.
- Error handling.
- Important integrations.

Do not create tests that merely duplicate implementation details.

Tests should protect behaviour.

---

## 19. Change Workflow

Every agent must follow this sequence.

### Before changing code

1. Read `AGENTS.md`.
2. Inspect the relevant existing code.
3. Understand the current architecture.
4. Identify the smallest safe change.
5. Check whether an existing utility/service/controller can be reused.
6. Plan the change before editing.

### During the change

1. Keep the change focused.
2. Follow the controller/service architecture.
3. Avoid unnecessary refactoring.
4. Do not inspect `.env` or secret files.
5. Do not expose secrets in logs, code, commits, or documentation.
6. Keep the code understandable to junior developers.

### After the change

1. Run appropriate tests.
2. Run linting/formatting if configured.
3. Check for obvious regressions.
4. Review the final diff.
5. Update documentation if behaviour or architecture changed.
6. **Compact and save a handoff summary for the next agent.**

---

## 20. Mandatory Agent Handoff / Continuation Record

After every meaningful change, update this section with a concise handoff.

The purpose is to allow the next agent to continue without repeating investigation.

### Current State

```text
Last updated: 2026-08-18
Agent: opencode
Task: SFTP Invoice Export Service - Sequence-Based Exports
Status: Complete - Ready for Supabase table setup
```

### What Changed

```text
- Refactored from date-based to sequence-based invoice exports
- Added invoice_export_log table tracking in Supabase
- Queries invoices WHERE invoice_number >= lastExported + 1
- Logs each export with max invoice number and filename
- Cron job now runs sequence-based exports weekly
```

### Important Decisions

```text
- Combined sequence for both account_invoices and invoices tables
- Supabase table: invoice_export_log tracks last_invoice_number
- User must run supabase-setup.sql to create tracking table
- User must set initial last_invoice_number in the table
- SFTP upload path: /DebtorDocs
- File naming: invoice_YYYY-MM-DD_HHMM_batch.xlsx
- Cron schedule: Every Monday at 08:00 SAST
- API key auth via x-api-key header
- Rate limit: 10 requests per 15 minute window
```

### Files Changed

```text
- package.json
- .gitignore
- supabase-setup.sql (NEW - run in Supabase SQL Editor)
- src/app.js
- src/server.js
- src/config/env.js
- src/controllers/invoice.controller.js
- src/routes/invoice.routes.js
- src/services/supabase.service.js
- src/services/excel.service.js
- src/services/sftp.service.js
- src/services/invoice.service.js
- src/middleware/error.middleware.js
- src/middleware/auth.middleware.js
- src/utils/date.js
- src/utils/logger.js
```

### Tests / Verification

```text
- Manual testing required with real Supabase credentials
- SFTP connection test needed with Fusion server
- Verify Excel output matches Xero import format
```

### Remaining Work

```text
- Run supabase-setup.sql in Supabase SQL Editor
- Set initial last_invoice_number in invoice_export_log table
- Test Supabase RPC function availability
- Test SFTP connection to Fusion server
- Verify Excel column mapping matches Xero expectations
```

### Known Issues / Risks

```text
- Supabase query uses exec_sql RPC function - must exist in Supabase project
- SFTP credentials must be valid for Fusion server
- User must provide last invoice number to set initial state
```

### Next Recommended Action

```text
- Run supabase-setup.sql in Supabase SQL Editor
- Set last_invoice_number to the last invoice you sent (e.g., 1)
- Test with: curl -X POST http://localhost:3000/api/v1/invoices/export -H "x-api-key: YOUR_KEY"
```

**Keep this handoff concise.**

Do not dump large logs, source files, credentials, environment values, or unnecessary implementation details into this section.

---

## 21. Continuation Rule

The next agent must read:

1. `AGENTS.md`
2. The current-state handoff section.
3. Relevant source files.
4. Relevant tests.

The next agent must continue from the recorded state rather than assuming the project is starting from scratch.

If the handoff is stale or incorrect, update it after verifying the actual state.

---

## 22. Documentation Standard

Documentation should explain:

- What the server does.
- How to install dependencies.
- How to start development mode.
- How to run tests.
- Required environment variable **names**.
- API endpoints.
- Important architectural decisions.

Never put secret values into documentation.

Example:

```text
DATABASE_URL=<provided separately>
PORT=<provided separately>
```

not:

```text
DATABASE_URL=actual-secret-value
```

---

## 23. Definition of Done

A change is not considered complete until:

- [ ] `AGENTS.md` was reviewed before implementation.
- [ ] The change follows the existing architecture.
- [ ] Routes remain thin.
- [ ] Controllers handle HTTP concerns.
- [ ] Services contain business logic where appropriate.
- [ ] Database access is separated from HTTP concerns.
- [ ] Code follows DRY without unnecessary abstraction.
- [ ] No secrets were read or exposed.
- [ ] Input is validated where required.
- [ ] Errors are handled consistently.
- [ ] Relevant tests pass.
- [ ] Relevant documentation is updated.
- [ ] The final diff has been reviewed.
- [ ] The handoff section has been compacted and updated for the next agent.

---

## 24. Core Principle

When uncertain, choose the implementation that is:

**Simple → Explicit → Secure → Testable → Maintainable**

Do not optimize for architectural sophistication.

Optimize for a backend that a competent junior developer can open six months from now and understand quickly.
