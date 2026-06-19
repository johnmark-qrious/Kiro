// Log in to engage.local via CDP
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/T828819/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/package.json');
const { chromium } = require('playwright-core');

const screenshotPath = process.argv[2] || 'C:/Users/T828819/proof.png';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
let page = context.pages().find(p => !p.url().startsWith('chrome'));
if (!page) page = await context.newPage();

// Navigate to login if not already there
if (!page.url().includes('engage.local')) {
  await page.goto('https://engage.local', { waitUntil: 'networkidle', timeout: 30000 });
}

// Step 1: Fill email and click Continue
await page.fill('input[type="text"], input[type="email"], input[name*="email"], input[name*="Email"]', 't000000@spark.co.nz');
await page.click('button:has-text("Continue"), input[type="submit"][value="Continue"]');
await page.waitForLoadState('networkidle');

// Step 2: Fill password and submit
await page.waitForSelector('input[type="password"]', { timeout: 10000 });
await page.fill('input[type="password"]', '570RGan1cn3!');
await page.click('button:has-text("Log"), input[type="submit"]');
await page.waitForLoadState('networkidle');

// Wait for redirect after login
await page.waitForTimeout(3000);

console.log(`Title: ${await page.title()}`);
console.log(`URL: ${page.url()}`);
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`Screenshot saved: ${screenshotPath}`);
await browser.close();
