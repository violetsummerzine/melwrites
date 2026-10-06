// Renders private/resume.html to private/resume.pdf with headless Chromium.
// Usage (Playwright is not a project dependency, so the site deploy stays lean):
//   npm install --no-save playwright && npx playwright install chromium
//   node scripts/build-resume.cjs
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const opts = {};
  if (process.env.PW_CHROMIUM) opts.executablePath = process.env.PW_CHROMIUM;
  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  await page.goto("file://" + path.resolve(__dirname, "../private/resume.html"), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.resolve(__dirname, "../private/resume.pdf"), format: "Letter", preferCSSPageSize: true, printBackground: true });
  await browser.close();
})();
