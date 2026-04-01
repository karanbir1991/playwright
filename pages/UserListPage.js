
export class UserListPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.IdSearch = page.locator('#idSearch');  
  }

  async searchById(id) {                               // ← capital B, matches caller
    await this.IdSearch.fill(String(id));              // ← convert id to string

    // Wait for the filtered row to appear in the table
    await this.page.waitForSelector(`#name-cell-${id}`);

    // Build locators here, where id is available
    const name = await this.page
      .locator(`//td[@id="name-cell-${id}"]`)
      .textContent();

    const job = await this.page
      .locator(`//td[@id="job-cell-${id}"]/span`)
      .textContent();
    return { uiname: name?.trim(), uijob: job?.trim() };
  }
}
