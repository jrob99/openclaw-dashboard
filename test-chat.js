const { chromium } = require('playwright'); (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:7000');
  await page.waitForTimeout(3000);
  // Verify all original tabs still work
  const origTabs = ['overview','sessions','costs','limits','memory','logs','feed'];
  for (const tab of origTabs) {
    await page.click('[data-page="' + tab + '"]');
    await page.waitForTimeout(500);
  }
  console.log('Original tabs:', errors.length === 0 ? 'ALL WORK ✅' : 'BROKEN ❌ ' + errors.join(';'));
  // Test chat tab
  errors.length = 0;
  const chatNav = await page.$('[data-page="chat"]');
  console.log('Chat nav item:', chatNav ? 'EXISTS ✅' : 'MISSING ❌');
  if (chatNav) {
    await chatNav.click();
    await page.waitForTimeout(2000);
    const chatInput = await page.$('#chat-input');
    const chatSend = await page.$('#chat-send');
    const chatMessages = await page.$('#chat-messages');
    console.log('Chat input:', chatInput ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('Chat send button:', chatSend ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('Chat messages area:', chatMessages ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('Chat JS errors:', errors.length === 0 ? 'NONE ✅' : errors.join(';'));
    await page.screenshot({ path: '/tmp/dashboard-chat.png' });
  }
  await browser.close();
})();
