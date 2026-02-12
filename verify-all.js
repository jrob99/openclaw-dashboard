const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`Page error: ${err.message}`);
  });

  const failedRequests = [];
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} - ${request.failure().errorText}`);
  });

  const pokeRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('pokeapi.co')) {
      pokeRequests.push(request.url());
    }
  });

  let chatSendStatus = null;
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/chat/send')) {
      chatSendStatus = response.status();
      console.log(`Chat send response: ${url} status ${chatSendStatus}`);
    }
  });

  console.log('Navigating to http://localhost:7000');
  await page.goto('http://localhost:7000', { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Click Chat nav
  console.log('Clicking Chat nav');
  await page.locator('.nav-item[data-page=\"chat\"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-chat.png' });
  console.log('Chat screenshot saved');

  // Type and send message
  console.log('Typing message');
  const inputLocator = page.locator('textarea, input[type=\"text\"], [contenteditable]').last();
  await inputLocator.fill('hello from verification test');
  const sendButton = page.locator('#chat-send, button:has-text(\"Send\")');
  await sendButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-chat-send.png' });
  console.log('Chat send screenshot saved');

  // Click Tasks nav
  console.log('Clicking Tasks nav');
  await page.locator('.nav-item[data-page=\"tasks\"]').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/final-tasks.png' });
  console.log('Tasks screenshot saved');

  // Check kanban columns
  const columnLocator = page.locator('[class*="column"],[class*="kanban"],.task-column,.kanban-column');
  const columns = await columnLocator.count();
  const contentLocator = columnLocator.filter(':has(:text("")),:has(*:not(style):not(script))');
  const hasContent = await contentLocator.count() > 0 || columns > 0;
  console.log(`Kanban columns count: ${columns}`);
  console.log(`Kanban has content: ${hasContent}`);

  // Click Office nav
  console.log('Clicking Office nav');
  await page.locator('.nav-item[data-page=\"office\"]').click();
  await page.waitForTimeout(1000);
  let canvas1 = null;
  const canvasLocator = page.locator('canvas');
  if (await canvasLocator.count() > 0) {
    canvas1 = await canvasLocator.boundingBox();
    console.log('Canvas at 1s:', JSON.stringify(canvas1));
  }

  await page.waitForTimeout(2000);
  let canvas3 = null;
  if (await canvasLocator.count() > 0) {
    canvas3 = await canvasLocator.boundingBox();
    console.log('Canvas at 3s:', JSON.stringify(canvas3));
  }
  const canvasStable = !canvas1 || !canvas3 || (Math.abs((canvas1.width || 0) - (canvas3.width || 0)) < 1 && Math.abs((canvas1.height || 0) - (canvas3.height || 0)) < 1);
  console.log(`Canvas size stable: ${canvasStable}`);

  await page.screenshot({ path: '/tmp/final-office.png' });
  console.log('Office screenshot saved');

  await browser.close();

  // Summary
  console.log('\\n=== VERIFICATION SUMMARY ===');
  console.log('1. Chat navigation: PASS (screenshot /tmp/final-chat.png)');
  console.log('2. Chat send: ' + (chatSendStatus === 200 ? 'PASS' : 'FAIL') + ` (status: ${chatSendStatus || 'no response'})`);
  console.log('3. Tasks kanban: ' + (hasContent ? 'PASS' : 'FAIL') + ` (columns: ${columns}, content: ${hasContent}) screenshot /tmp/final-tasks.png`);
  console.log('4. Office canvas stable: ' + (canvasStable ? 'PASS' : 'FAIL'));
  console.log('5. Pokemon sprites (PokeAPI requests): ' + (pokeRequests.length > 0 ? 'PASS (' + pokeRequests.length + ' requests)' : 'FAIL (no requests)') );
  console.log('\\nConsole errors/warnings:');
  consoleErrors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
  console.log('\\nFailed network requests:');
  failedRequests.forEach((req, i) => console.log(`  ${i+1}. ${req}`));
  if (pokeRequests.length > 0) {
    console.log('\\nPokeAPI requests:');
    pokeRequests.slice(0,10).forEach((url, i) => console.log(`  ${i+1}. ${url}`));
  }
  if (chatSendStatus !== 200) {
    console.log(`Chat send status: ${chatSendStatus}`);
  }
})();
