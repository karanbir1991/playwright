// tests/web/users.web.test.js
// Web UI tests using Playwright's browser automation + Page Object Model
// Covers: form interactions, toast notifications, table rendering, validation

import { test, expect } from '../../fixtures/fixtures.js';
import { deleteUserByNameFromDB } from '../../helpers/dbHelper.js';


test.describe('Web UI - Page Load', () => {

  test.only('verify user details', async ({ createUserPage }) => {
    await createUserPage.goto();
    await createUserPage.redirectToUserList();
  });
  test('should load the home page with correct title and elements', async ({ userPage }) => {
    await userPage.goto();

    await expect(userPage.page).toHaveTitle(/User Management/i);
    await expect(userPage.nameInput).toBeVisible();
    await expect(userPage.jobInput).toBeVisible();
    await expect(userPage.createUserBtn).toBeVisible();
    await expect(userPage.loadUsersBtn).toBeVisible();
  });

  test('should display the Create User heading', async ({ userPage }) => {
    await userPage.goto();
    const heading = userPage.page.locator('h2', { hasText: 'Create User' });
    await expect(heading).toBeVisible();
  });

  test('should display the Users List heading', async ({ userPage }) => {
    await userPage.goto();
    const heading = userPage.page.locator('h2', { hasText: 'Users List' });
    await expect(heading).toBeVisible();
  });
});


test.describe('Web UI - Create User Form', () => {

  test('should show toast with user ID after creating a user', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'WebUser_Toast';
    trackUser(name);

    await userPage.createUser(name, 'Frontend Dev');

    const toastText = await userPage.getToastMessage();
    expect(toastText).toContain('User Created with ID:');
    expect(toastText).toMatch(/\d+/); // contains a numeric ID
  });

  test('toast should be dismissable with the × button', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'WebUser_Dismiss';
    trackUser(name);

    await userPage.createUser(name, 'Backend Dev');
    await userPage.getToastMessage(); // wait for it to appear
    await userPage.dismissToast();

    await expect(userPage.toast).toBeHidden();
  });

  test('inputs should be clearable and reusable for second user', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name1 = 'WebUser_First';
    const name2 = 'WebUser_Second';
    trackUser(name1);
    trackUser(name2);

    await userPage.createUser(name1, 'QA');
    await userPage.getToastMessage();

    await userPage.nameInput.fill('');
    await userPage.jobInput.fill('');
    await userPage.createUser(name2, 'Designer');

    const toast2 = await userPage.getToastMessage();
    expect(toast2).toContain('User Created with ID:');
  });
});


test.describe('Web UI - Load Users Table', () => {

  test('should render user table with header row on load', async ({ userPage }) => {
    await userPage.goto();
    await userPage.loadUsers();

    const headers = await userPage.userTable.locator('th').allTextContents();
    expect(headers).toContain('ID');
    expect(headers).toContain('Name');
    expect(headers).toContain('Job');
  });

  test('newly created user should appear in table after Load Users', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'TableVisible_User';
    trackUser(name);

    await userPage.createUser(name, 'Architect');
    await userPage.getToastMessage(); // wait for creation to complete

    await userPage.loadUsers();
    await userPage.waitForUserInTable(name);

    const row = await userPage.findRowByName(name);
    expect(row).not.toBeNull();
    expect(row.job).toBe('Architect');
  });

  test('table should list multiple users', async ({ userPage, trackUser }) => {
    await userPage.goto();

    const users = [
      { name: 'MultiUser_A', job: 'Dev' },
      { name: 'MultiUser_B', job: 'PM' },
    ];

    for (const u of users) {
      trackUser(u.name);
      await userPage.createUser(u.name, u.job);
      await userPage.getToastMessage();
    }

    await userPage.loadUsers();

    const rowCount = await userPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    for (const u of users) {
      await userPage.waitForUserInTable(u.name);
      const row = await userPage.findRowByName(u.name);
      expect(row).not.toBeNull();
    }
  });

  test('each table row should have a numeric ID', async ({ userPage, trackUser }) => {
    await userPage.goto();
    const name = 'NumericID_User';
    trackUser(name);

    await userPage.createUser(name, 'Tester');
    await userPage.getToastMessage();
    await userPage.loadUsers();
    await userPage.waitForUserInTable(name);

    const row = await userPage.findRowByName(name);
    expect(row).not.toBeNull();
    expect(Number(row.id)).toBeGreaterThan(0);
  });
});
