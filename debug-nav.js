const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:7000', { waitUntil: 'domcontentloaded' });

  await page.screenshot({ path: '/tmp/home.png', fullPage: true });
  console.log('Home screenshot saved to /tmp/home.png');

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const links = await page.$$eval('a, button', els => els.map(el => ({
    tag: el.tagName.toLowerCase(),
    text: el.textContent.trim().slice(0,20),
    class: el.className.toString().slice(0,30),
    href: el.href || '',
    'aria-label': el.getAttribute('aria-label') || '',
    id: el.id || ''
  })).filter(el => el.text));

  console.log('Potential nav items (a, button with text):');
  links.forEach((l, i) => console.log(`${i+1}. tag:${l.tag} text:"${l.text}" class:"${l.class}" href:"${l.href}" id:"${l.id}" aria:"${l['aria-label']}"`));

  const titles = await page.title();
  console.log('Page title:', titles);

  console.log('Console errors:', consoleErrors);

  await browser.close();
})();
