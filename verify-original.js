const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await page.goto('http://localhost:7000');
  await page.waitForTimeout(4000);
  
  console.log('=== ORIGINAL DASHBOARD TEST ===');
  console.log('JS Errors:', errors.length ? errors.join('; ') : 'NONE');
  
  // Test each nav button
  const navItems = await page.$$('[data-page]');
  console.log('Nav items found:', navItems.length);
  
  for (const item of navItems) {
    const pageName = await item.getAttribute('data-page');
    await item.click();
    await page.waitForTimeout(1000);
    const visible = await page.$('.page.active, .page[style*="block"]');
    console.log('Tab ' + pageName + ':', visible ? 'WORKS' : 'BROKEN');
  }
  
  // Check data loaded
  const bodyText = await page.textContent('body');
  const hasData = !bodyText.includes('0 total · 0 active') || bodyText.includes('total ·');
  console.log('Sessions data:', bodyText.includes('agent:main') || bodyText.match(/\d+ total/) ? 'LOADED' : 'CHECK MANUALLY');
  
  await page.screenshot({ path: '/tmp/dashboard-original.png', fullPage: true });
  console.log('Screenshot: /tmp/dashboard-original.png');
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n!!! ORIGINAL HAS ERRORS - DO NOT PROCEED !!!');
    process.exit(1);
  } else {
    console.log('\n✅ Original dashboard is clean. Safe to add office feature.');
  }
})();
