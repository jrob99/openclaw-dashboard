const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:7000');
  await page.waitForTimeout(3000);
  
  // Test all previous tabs still work
  for (const tab of ['overview','sessions','chat']) {
    await page.click('[data-page="' + tab + '"]');
    await page.waitForTimeout(500);
  }
  console.log('Existing tabs:', errors.length === 0 ? 'ALL WORK ✅' : 'BROKEN ❌');
  
  // Test kanban
  errors.length = 0;
  const tasksNav = await page.$('[data-page="tasks"]');
  console.log('Tasks nav:', tasksNav ? 'EXISTS ✅' : 'MISSING ❌');
  if (tasksNav) {
    await tasksNav.click();
    await page.waitForTimeout(2000);
    const kanbanCols = await page.$('#kanban-columns');
    console.log('Kanban columns:', kanbanCols ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('Kanban errors:', errors.length === 0 ? 'NONE ✅' : errors.join(';'));
    await page.screenshot({ path: '/tmp/dashboard-tasks.png' });
  }
  
  await browser.close();
})();
