// test-dashboard.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:7000');
  await page.waitForTimeout(3000);
  
  // Check for JS errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.reload();
  await page.waitForTimeout(3000);
  
  // Check if sessions loaded (not zero)
  const sessionCards = await page.$$('.session-card, .card, [class*="session"]');
  console.log('Session elements found:', sessionCards.length);
  
  // Check console errors
  console.log('JS Errors:', errors.length ? errors : 'None');
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/dashboard-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/dashboard-test.png');
  
  // Click Office tab and screenshot
  const officeTab = await page.$('[data-page="office"]');
  if (officeTab) {
    await officeTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/dashboard-office.png', fullPage: true });
    console.log('Office screenshot saved to /tmp/dashboard-office.png');
  }
  
  await browser.close();
})();
