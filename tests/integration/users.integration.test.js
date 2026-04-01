// tests/integration/users.integration.test.js
// Cross-layer integration tests: validates that API actions are reflected
// correctly in the DB, and that UI actions produce matching DB + API state.
// When to use each direction

// | Direction | Use when |
// |---|---|
// | API → DB | Testing that writes actually persist |
// | DB → API | Testing that reads return correct data |
// | UI → API → DB | Testing full create/submit user flow |
// | API-> DB → UI | Testing full display/render flow |

import { test, expect } from '../../fixtures/fixtures.js';
import {
  createUserApi,
  getUsersApi,
  getUserByIdApi,
  deleteUserApi,
  createUserAndGetBody,
} from '../../helpers/apiHelper.js';
import {
  getUserByIdFromDB,
  getUserByNameFromDB,
  userExistsInDB,
  countUsers,
  deleteUserByNameFromDB,
} from '../../helpers/dbHelper.js';


// ─────────────────────────────────────────────
// API ↔ DB Integration
// ─────────────────────────────────────────────
test.describe('Integration - API creates record in DB', () => {

  test('POST /api/users should persist data to DB', async ({ request }) => {
    const { body } = await createUserAndGetBody(request, 'INT_ApiToDB', 'SRE');

    // Verify DB has the record
    const dbUser = await getUserByIdFromDB(body.id);
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe('INT_ApiToDB');
    expect(dbUser.job).toBe('SRE');

    await deleteUserByNameFromDB('INT_ApiToDB');
  });

  test('API response id should match DB insertId', async ({ request }) => {
    const { body } = await createUserAndGetBody(request, 'INT_IdMatch', 'DevOps');

    const dbUser = await getUserByIdFromDB(body.id);
    expect(dbUser.id).toBe(body.id);

    await deleteUserByNameFromDB('INT_IdMatch');
  });

  test('API-created user should appear in GET /api/users list AND in DB', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'INT_ListAndDB', 'PM');

    // Check API list
    const listResponse = await getUsersApi(request);
    const users = await listResponse.json();
    const fromApi = users.find(u => u.id === created.id);
    expect(fromApi).toBeDefined();

    // Check DB
    const fromDb = await getUserByIdFromDB(created.id);
    expect(fromDb).not.toBeNull();

    // Data consistency: API and DB agree
    expect(fromApi.name).toBe(fromDb.name);
    expect(fromApi.job).toBe(fromDb.job);

    await deleteUserByNameFromDB('INT_ListAndDB');
  });

  test('DB count should increase by 1 after API create', async ({ request }) => {
    const before = await countUsers();
    const { body } = await createUserAndGetBody(request, 'INT_CountCheck', 'Tester');
    const after = await countUsers();

    expect(Number(after)).toBe(Number(before) + 1);
    await deleteUserByNameFromDB('INT_CountCheck');
  });
});


// ─────────────────────────────────────────────
// DELETE API ↔ DB Integration
// ─────────────────────────────────────────────
test.describe('Integration - API delete removes record from DB', () => {

  test('DELETE /api/users/:id should remove user from DB', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'INT_DelFromDB', 'Temp');
    await deleteUserApi(request, created.id);

    const dbUser = await getUserByIdFromDB(created.id);
    expect(dbUser).toBeNull();
  });

  test('userExistsInDB should be false after API delete', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'INT_ExistAfterDel', 'Temp');
    await deleteUserApi(request, created.id);

    const exists = await userExistsInDB('INT_ExistAfterDel', 'Temp');
    expect(exists).toBe(false);
  });
});


// ─────────────────────────────────────────────
// Web UI ↔ API ↔ DB Integration
// ─────────────────────────────────────────────
test.describe('Integration - UI action persists through API to DB', () => {

  test('creating user via UI should save to DB', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'INT_UIToDB';
    trackUser(name);

    await userPage.createUser(name, 'Full Stack');
    const toastText = await userPage.getToastMessage();

    // Extract ID from toast message "User Created with ID: 42"
    const match = toastText.match(/(\d+)/);
    expect(match).not.toBeNull();
    const id = parseInt(match[1]);

    // Verify in DB
    const dbUser = await getUserByIdFromDB(id);
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe(name);
    expect(dbUser.job).toBe('Full Stack');
  });

  test('user created via UI should be fetchable by API', async ({ userPage, request, trackUser }) => {
    await userPage.goto();
    const name = 'INT_UIToApi';
    trackUser(name);

    await userPage.createUser(name, 'Cloud Architect');
    const toastText = await userPage.getToastMessage();
    const id = parseInt(toastText.match(/(\d+)/)[1]);

    // Verify via API GET by ID
    const apiResponse = await getUserByIdApi(request, id);
    expect(apiResponse.status()).toBe(200);
    const apiUser = await apiResponse.json();
    expect(apiUser.name).toBe(name);
  });

  test('UI created user should appear in Load Users table AND DB', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'INT_UITableDB';
    trackUser(name);

    await userPage.createUser(name, 'Data Engineer');
    await userPage.getToastMessage();

    // Check UI table
    await userPage.loadUsers();
    await userPage.waitForUserInTable(name);
    const tableRow = await userPage.findRowByName(name);
    expect(tableRow).not.toBeNull();

    // Check DB
    const dbUser = await getUserByNameFromDB(name);
    expect(dbUser).not.toBeNull();

    // UI and DB are consistent
    expect(tableRow.job).toBe(dbUser.job);
    expect(Number(tableRow.id)).toBe(dbUser.id);
  });
});


// ─────────────────────────────────────────────
// Data Consistency across all 3 layers
// ─────────────────────────────────────────────
test.describe('Integration - Full stack data consistency', () => {

  test('name and job should be identical in API response, DB row, and UI table', async ({
    userPage, request, trackUser
  }) => {
    const name = 'INT_FullStack';
    const job  = 'Solutions Architect';
    trackUser(name);

    // 1. Create via API
    const { body: created } = await createUserAndGetBody(request, name, job);

    // 2. Verify API GET by ID
    const apiGet = await getUserByIdApi(request, created.id);
    const apiUser = await apiGet.json();

    // 3. Verify DB
    const dbUser = await getUserByIdFromDB(created.id);

    // 4. Verify UI
    await userPage.goto();
    await userPage.loadUsers();
    await userPage.waitForUserInTable(name);
    const uiRow = await userPage.findRowByName(name);

    // All three layers agree
    expect(apiUser.name).toBe(name);
    expect(dbUser.name).toBe(name);
    expect(uiRow.name).toBe(name);

    expect(apiUser.job).toBe(job);
    expect(dbUser.job).toBe(job);
    expect(uiRow.job).toBe(job);

    expect(Number(uiRow.id)).toBe(created.id);
    expect(dbUser.id).toBe(created.id);
  });
});
