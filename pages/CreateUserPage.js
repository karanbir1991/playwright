const BASE = process.env.BASE_URL || 'http://localhost:3000';
export class CreateUserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  
  constructor(page) {
    this.page = page;
    this.BASE = BASE;
    this.vieUsersBtn  = page.locator('#viewBtn');
  }

   /** Navigate to the app home page */
  async goto() {
    await this.page.goto(this.BASE+'/index.html');
  }
  async redirectToUserList() {
    await this.vieUsersBtn.click();
    await this.page.waitForURL(this.BASE+'/users.html');
}
}