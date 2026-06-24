import { createRequire } from 'node:module';
const require = createRequire('C:/Users/T828819/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/package.json');
const { chromium } = require('playwright-core');

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Navigate directly to connectors page
await page.goto('https://engage.local/database/connectors', { waitUntil: 'load', timeout: 30000 }).catch(e => console.log('Nav:', e.message));
await page.waitForTimeout(8000);
console.log('URL:', page.url());
await page.screenshot({ path: 'C:/Users/T828819/connection-list.png', timeout: 10000 }).catch(async () => {
  // Fallback: use CDP directly for screenshot
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const fs = await import('fs');
  fs.writeFileSync('C:/Users/T828819/connection-list.png', Buffer.from(data, 'base64'));
  console.log('Used CDP fallback for screenshot');
});
console.log('Done');
