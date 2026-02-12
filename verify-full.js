const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://localhost:7000');
  await page.waitForTimeout(4000);
  
  console.log('=== FULL DASHBOARD VERIFICATION ===');
  console.log('JS Errors on load:', errors.length ? errors.join('; ') : 'NONE ✅');
  
  // Test EVERY tab
  const tabs = ['overview', 'sessions', 'costs', 'limits', 'memory', 'logs', 'feed', 'office'];
  for (const tab of tabs) {
    errors.length = 0;
    const navItem = await page.$('[data-page="' + tab + '"]');
    if (!navItem) { console.log('Tab ' + tab + ': NOT FOUND ❌'); continue; }
    await navItem.click();
    await page.waitForTimeout(1500);
    const errAfter = errors.length;
    console.log('Tab ' + tab + ':', errAfter === 0 ? 'WORKS ✅' : 'ERRORS ❌ ' + errors.join('; '));
    await page.screenshot({ path: '/tmp/dashboard-' + tab + '.png' });
  }
  
  // Verify data is loading (go back to overview)
  await page.click('[data-page="overview"]');
  await page.waitForTimeout(2000);
  const runningText = await page.textContent('body');
  const hasAgents = runningText.match(/(\d+) total/);
  console.log('\nAgent data:', hasAgents ? hasAgents[0] + ' ✅' : 'Check /tmp/dashboard-overview.png');
  
  // Check office specifically
  await page.click('[data-page="office"]');
  await page.waitForTimeout(3000);
  const canvas = await page.$('canvas');
  console.log('Phaser canvas:', canvas ? 'RENDERED ✅' : 'MISSING ❌');
  await page.screenshot({ path: '/tmp/dashboard-office-final.png' });
  
  console.log('\nTotal JS errors across all tabs:', errors.length);
  console.log('Screenshots saved to /tmp/dashboard-*.png');
  
  await browser.close();
})();
