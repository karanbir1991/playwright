// helpers/browserHelper.js

export async function withHeadedPage(browser, fn) {
  // Launch a brand new headed browser instance
  const headedBrowser = await browser.browserType().launch({
    headless: false,    // ← always headed
    slowMo: 600,        // ← slow enough to watch
  });

  const context = await headedBrowser.newContext();
  const page    = await context.newPage();

  try {
    await fn(page);
  } finally {
    await context.close();
    await headedBrowser.close();   // ← close the headed browser too
  }
}