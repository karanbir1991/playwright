// pages/UserPage.js
// Page Object Model for the User Management web interface

export class UserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Form inputs
    this.nameInput = page.locator('#name');
    this.jobInput  = page.locator('#job');

    // Buttons
    this.createUserBtn = page.locator('button', { hasText: 'Create User' });
    this.loadUsersBtn  = page.locator('button', { hasText: 'Load Users' });

    // Table
    this.userTable = page.locator('#userTable');
    this.tableRows = page.locator('#userTable tr');

    // Toast
    this.toast      = page.locator('#toast');
    this.toastMsg   = page.locator('#toast-msg');
    this.toastClose = page.locator('#toast-close');
  }

  /** Navigate to the app home page */
  async goto() {
    await this.page.goto('/');
  }

  /** Fill the create-user form and click Create */
  async createUser(name, job) {
    await this.nameInput.fill(name);
    await this.jobInput.fill(job);
    await this.createUserBtn.click();
  }

  /** Click Load Users button */
  async loadUsers() {
    await this.loadUsersBtn.click();
  }

  /** Wait for toast to appear and return its message text */
  async getToastMessage() {
    await this.toast.waitFor({ state: 'visible', timeout: 5000 });
    return this.toastMsg.textContent();
  }

  /** Dismiss the toast by clicking × */
  async dismissToast() {
    await this.toastClose.click();
    await this.toast.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /** Return all data rows (excluding header) as array of { id, name, job } */
  async getTableData() {
    await this.userTable.waitFor({ state: 'visible' });
    const rows = await this.tableRows.all();
    const data = [];
    // skip header row at index 0
    for (let i = 1; i < rows.length; i++) {
      const cells = await rows[i].locator('td').allTextContents();
      if (cells.length === 3) {
        data.push({ id: cells[0], name: cells[1], job: cells[2] });
      }
    }
    return data;
  }

  /** Return the count of data rows (excluding header) */
  async getRowCount() {
    const data = await this.getTableData();
    return data.length;
  }

  /** Find a row by name, returns row data or null */
  async findRowByName(name) {
    const rows = await this.getTableData();
    return rows.find(r => r.name === name) || null;
  }

  /** Wait until the table contains at least one row with the given name */
  async waitForUserInTable(name, timeout = 5000) {
    await this.page.waitForFunction(
      (n) => {
        const rows = document.querySelectorAll('#userTable tr');
        return [...rows].some(r => r.innerText.includes(n));
      },
      name,
      { timeout }
    );
  }
}
