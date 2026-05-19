// Connect to Chrome via CDP, navigate to a URL, take a screenshot
// Usage: node cdp-connect.mjs [url] [screenshot-path]
import { chromium } from 'file:///C:/Users/T828819/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'https://engage.local';
const screenshotPath = process.argv[3] || 'C:/Users/T828819/proof.png';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
let page = context.pages().find(p => !p.url().startsWith('chrome'));
if (!page) page = await context.newPage();

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
console.log(`Title: ${await page.title()}`);
console.log(`URL: ${page.url()}`);
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`Screenshot saved: ${screenshotPath}`);
