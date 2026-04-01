# Playwright E2E Testing Framework
### API + Web UI + Database Integration Tests

---

## Project Structure

```
playwright-tests/
├── playwright.config.js         # Playwright config (projects, reporters, timeouts)
├── .env                         # Environment variables
├── package.json
│
├── helpers/
│   ├── apiHelper.js             # Reusable API call wrappers (fetch via APIRequestContext)
│   └── dbHelper.js              # Direct MySQL connection helpers for DB assertions
│
├── pages/
│   └── UserPage.js              # Page Object Model for the User Management UI
│
├── fixtures/
│   └── fixtures.js              # Custom Playwright fixtures (userPage, trackUser)
│
└── tests/
    ├── api/
    │   └── users.api.test.js    # REST API tests (POST, GET, GET by ID, DELETE)
    ├── web/
    │   └── users.web.test.js    # Browser UI tests (form, toast, table)
    ├── db/
    │   └── users.db.test.js     # Direct DB tests (insert, fetch, delete, counts)
    └── integration/
        └── users.integration.test.js  # Cross-layer: API↔DB, UI↔API↔DB
```

---

## Prerequisites

- Node.js 18+
- The `playwright-backend` app running on `http://localhost:3000`
- MySQL running with `playwright_db` database

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Ensure your .env matches the backend's .env
# BASE_URL=http://localhost:3000
# DB_HOST=127.0.0.1 / DB_USER=root / DB_PASSWORD=root / DB_NAME=playwright_db
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run a specific layer
npm run test:api          # API tests only
npm run test:web          # Web UI tests only
npm run test:db           # DB tests only
npm run test:integration  # Integration tests only

# Run with visible browser
npm run test:headed

# Run in debug mode (step through)
npm run test:debug

# Open HTML report after a run
npm run report
```

---

## Test Coverage

### API Tests (`tests/api/`)
| Test | Description |
|------|-------------|
| POST creates user | 201 status, returns id/name/job |
| POST IDs are unique | Two users get different IDs |
| POST missing name | Returns 400/500 |
| POST content-type | Returns application/json |
| GET lists users | 200 + array response |
| GET includes created user | New user visible in list |
| GET schema check | All rows have id/name/job |
| GET by ID returns correct user | id/name/job match |
| GET by ID 404 | Non-existent ID returns 404 |
| DELETE returns success | message contains "deleted" |
| DELETE removed from list | No longer in GET all |
| DELETE returns 404 after | GET by ID returns 404 |

### Web UI Tests (`tests/web/`)
| Test | Description |
|------|-------------|
| Page load | Title, inputs, buttons visible |
| Headings | "Create User" and "Users List" visible |
| Toast on create | Shows "User Created with ID: N" |
| Toast dismiss | × button hides the toast |
| Form reuse | Second user after clearing inputs |
| Table headers | ID / Name / Job columns present |
| New user in table | Appears after Load Users |
| Multiple users | Table lists all created users |
| Numeric IDs | Each row has a valid integer ID |

### DB Tests (`tests/db/`)
| Test | Description |
|------|-------------|
| DB connection | Returns array from users table |
| Row schema | id/name/job fields present |
| Insert + fetch by ID | Correct data retrieved |
| Fetch by name | Correct user found |
| insertId is integer | Positive numeric ID |
| Incremental IDs | Second insert > first |
| Delete removes row | getUserById returns null |
| userExistsInDB true | Returns true for existing |
| userExistsInDB false | Returns false after delete |
| Count +1 after insert | countUsers increases |
| Count -1 after delete | countUsers decreases |
| Non-existent ID | Returns null |

### Integration Tests (`tests/integration/`)
| Test | Description |
|------|-------------|
| API create → DB persisted | DB row exists after POST |
| API id matches DB id | Same insertId in both |
| API list + DB both have user | GET all and DB consistent |
| DB count +1 after API create | Count increments |
| API delete → DB removed | DB row gone after DELETE |
| userExistsInDB false after API delete | DB confirms deletion |
| UI create → DB saved | DB has user after UI form submit |
| UI create → API fetchable | GET by ID returns UI-created user |
| UI create → table + DB consistent | UI table and DB agree |
| Full-stack consistency | name/job/id identical in API, DB, and UI |

---

## Architecture Decisions

- **`workers: 1`** — Tests run sequentially to avoid race conditions on shared DB state
- **`trackUser` fixture** — Automatically cleans up test-created users from DB after each test
- **Page Object Model** — All UI selectors live in `UserPage.js`; tests stay readable
- **DB helper** — Bypasses the API for direct assertions; verifies persistence independently
- **Retries: 1** — One automatic retry on transient failures (network blips, timing)

## Db cases

INSERT Cases
1.  Insert a user → should get back a numeric ID
2.  Insert a user → ID should be greater than 0
3.  Insert a user → fetch by ID → should exist in DB
4.  Insert a user → name and job should match exactly what was inserted
5.  Insert two users → both should get different IDs
6.  Insert two users → second ID should be greater than first ID (auto-increment)

SELECT Cases
7.  Insert user → fetch by ID → should return that user
8.  Insert user → fetch by name → should return that user
9.  Fetch by ID that does not exist → should return null
10. Fetch by name that does not exist → should return null
11. Fetch all users → should return an array
12. Insert user → fetch all → newly inserted user should appear in the list
13. Fetch all users → every row should have id, name, job, created_at fields

UPDATE Cases
14. Insert user → update name → fetch by ID → name should be changed
15. Insert user → update job → fetch by ID → job should be changed
16. Insert user → update name → job should remain unchanged
17. Insert user → update job → name should remain unchanged
18. Insert two users → update user1 → user2 should not be affected
19. Insert user → update → count should stay the same

DELETE Cases
20. Insert user → delete by ID → fetch by ID → should return null
21. Insert user → delete → fetch all → should not appear in list
22. Insert two users → delete user1 → user2 should still exist
23. Insert user → delete → count should decrease by 1
24. Delete ID that does not exist → should not throw error

created_at Cases
25. Insert user → created_at should not be null
26. Insert user → created_at should be a valid date
27. Insert user → created_at should be within last 5 seconds (set by DB automatically)
28. Insert user → created_at should not be a future date
29. Update user → created_at should not change

Count / Record Tracking Cases
30. Insert user → count should increase by 1
31. Delete user → count should decrease by 1
32. Update user → count should stay the same
33. Insert 3 users → count should increase by 3
34. Insert user → delete same user → count should return to original number

Data Integrity Cases
35. Insert name with apostrophe (O'Brien) → should store correctly
36. Insert name with hyphen (Smith-Jones) → should store correctly
37. Insert name with accented characters (José) → should store correctly
38. Insert name with spaces in middle → should store with spaces intact
39. Insert maximum length name (100 chars) → should store fully
40. Insert maximum length job (100 chars) → should store fully
41. DB should not add extra spaces to name or job
42. DB should not change uppercase/lowercase of name or job

Uniqueness / Isolation Cases
43. Insert same name twice → should create two separate records with different IDs
44. Insert user → delete → insert same name again → should get a new ID (not reuse old)
45. Two users with same job title → both should be stored separately

Summary — grouped by what they catch
INSERT (1-6)        → DB connection works, auto-increment works
SELECT (7-13)       → Queries return correct data, null for missing
UPDATE (14-19)      → Only target field changes, others untouched
DELETE (20-24)      → Record actually removed, others safe
created_at (25-29)  → DB sets timestamp automatically, stays unchanged
Count (30-34)       → No phantom records, no missing records
Data Integrity(35-45)→ Special characters, encoding, no data modification#   p l a y w r i g h t  
 