// fixtures/fixtures.js
import { test as base } from '@playwright/test';
import { UserPage }       from '../pages/UserPage.js';
import { CreateUserPage } from '../pages/CreateUserPage.js';
import { UserListPage }   from '../pages/UserListPage.js';
import { deleteUserByNameFromDB } from '../helpers/dbHelper.js'; // ← uncommented

export const test = base.extend({

  // UserPage fixture (original single-page POM)
  userPage: async ({ page }, use) => {
    const userPage = new UserPage(page);
    await use(userPage);
  },

  // CreateUserPage fixture
  createUserPage: async ({ page }, use) => {
    const createUserPage = new CreateUserPage(page);
    await use(createUserPage);
  },

  // UserListPage fixture
  userListPage: async ({ page }, use) => {
    const userListPage = new UserListPage(page);
    await use(userListPage);
  },

  // Tracks user names created during a test → auto-cleans from DB after
  trackUser: async ({}, use) => {
    const tracked = [];
    const tracker = (name) => tracked.push(name);

    await use(tracker);

    // Teardown — runs after test finishes (pass or fail)
    for (const name of tracked) {
      await deleteUserByNameFromDB(name).catch(() => {});
    }
  },
});

export { expect } from '@playwright/test';