// helpers/browserHelper.js

export async function withHeadedPage(browser, fn, options = {}) {
  const {
    slowMo = 600,
  } = options;

  // ← Detect CI environment — if running in CI, force headless
  const isCI      = process.env.CI === 'true';
  const headless  = isCI ? true : false;

  const headedBrowser = await browser.browserType().launch({
    headless,
    slowMo: isCI ? 0 : slowMo,   // no slowMo in CI — just run fast
  });

  const context = await headedBrowser.newContext();
  const page    = await context.newPage();

  try {
    await fn(page);
  } finally {
    await context.close();
    await headedBrowser.close();
  }
}