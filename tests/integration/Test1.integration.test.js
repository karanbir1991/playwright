import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { z } from 'zod';
import mysql from 'mysql2/promise';

test.describe('validation cases for API-UI-DB', () => {

  test('smoke API is present in DB and UI', async ({ request, browser }) => {

    // ── API ────────────────────────────────────────────────
    const name = faker.person.fullName();
    const job  = faker.person.jobTitle();

    const response = await request.post('http://localhost:3000/api/users', {
      data: { name, job }
    });
    const body   = await response.json();
    const userId = body.id;

    console.log('API response body:', body);
    expect(response.status()).toBe(201);
    expect(response.statusText()).toBe('Created');
    expect(response.headers()['content-type']).toContain('application/json');
    expect(body.name).toBe(name);
    expect(body.job).toBe(job);
    expect(typeof userId).toBe('number');
    expect(userId).toBeGreaterThan(0);

    // Schema validation
    const UserSchema = z.object({
    id: z.number().positive(),
    name: z.string().min(2),
    job: z.string().min(2),
    createdAt: z.string().optional(),
    });
    const result = UserSchema.safeParse(body);
    console.log('Schema validation result:', result);
    expect(result.success).toBe(true);

    // ── DB ─────────────────────────────────────────────────
    const connection = await mysql.createConnection({
      host:     '127.0.0.1',
      user:     'root',
      password: 'root',
      database: 'playwright_db'
    });

    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?', [userId]
    );
    const dbBody = rows[0];
    console.log('User fetched from DB:', dbBody);
    expect(dbBody).not.toBeNull();
    expect(dbBody.name).toBe(name);
    expect(dbBody.job).toBe(job);
    console.log('DB matches API:', dbBody.id === userId && dbBody.name === name);
    await connection.end();

    // ── UI — headed browser opens only here ───────────────
    const headedBrowser = await browser.browserType().launch({
      headless: false,
      slowMo:   600,
    });

    const context = await headedBrowser.newContext();  // ← added context
    const page    = await context.newPage();

    try {
      await page.goto('http://localhost:3000/index.html');
      await page.locator('#viewBtn').click();
      await page.waitForURL('http://localhost:3000/users.html');

      // Fill ID search and wait for row to appear
      await page.locator('#idSearch').fill(userId.toString());
      await page.waitForSelector(`#name-cell-${userId}`);  // ← wait for filter

      // Read from correct table cell IDs
      const uiname = await page.locator(`#name-cell-${userId}`).textContent();
      const uijob  = await page.locator(`#job-cell-${userId} span`).textContent();

      expect(uiname?.trim()).toBe(name);
      expect(uijob?.trim()).toBe(job);
      console.log('UI matches API:', uiname?.trim() === name && uijob?.trim() === job);

    } finally {
      await context.close();
      await headedBrowser.close();   // ← always closes even if test fails
    }
  });
 test.only('Smoke test for UI-API-DB integration', async ({ request, browser }) => {
  //create user via Web UI
  const name = faker.person.fullName();
  const job  = faker.person.jobTitle();
  const headedBrowser = await browser.browserType().launch({
    headless: false,
    slowMo:600,
  });
  const context= await headedBrowser.newContext();
  const page = await context.newPage();
  try{
    await page.goto('http://localhost:3000/index.html');
    await page.locator('#name').fill(name);
    await page.locator('#job').fill(job);
    await page.locator('#createBtn').click();
    const successmsg= await page.locator('#toast-msg').textContent();
    expect(successmsg).toContain('User created with ID:')
    console.log(successmsg);
    await page.locator('#viewBtn').click();
    await page.locator('#th-id .sort-icon').click();
    const UIid = await page.locator('.id-cell').first().textContent(); 
  }
  finally{
    await context.close();
    await headedBrowser.close();
  }
  });


});