const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:7000');

  await page.screenshot({ path: '/tmp/home-debug.png', fullPage: true });

  // Find sidebar/nav
  const sidebar = page.locator('nav, .sidebar, .nav, .app-nav, aside, [class*=\"side\"], [class*=\"nav\"]');
  await sidebar.screenshot({ path: '/tmp/sidebar.png' });
  console.log('Sidebar screenshot /tmp/sidebar.png');

  const navButtons = await page.$$eval('nav button, .sidebar button, .nav button, aside button, [class*=\"nav\"] button, header button', els => els.map(el => ({
    text: el.textContent.trim(),
    class: el.className,
    title: el.title || '',
    'aria-label': el.getAttribute('aria-label') || '',
    id: el.id || '',
    svg: el.querySelector('svg') ? 'has-svg' : 'no',
    path: el.querySelector('svg path') ? el.querySelector('svg path').getAttribute('d') || 'path' : ''
  })));

  console.log('Sidebar/nav buttons:');
  navButtons.forEach((b, i) => console.log(`${i+1}.`, b));

  const allTexts = await page.evaluate(() => Array.from(document.querySelectorAll('*')).map(el => el.textContent.trim()).filter(t => t && t.length < 50 && !t.match(/\\d/)).slice(0,20));
  console.log('Page texts snippet:', allTexts.slice(0,20));

  await browser.close();
})();
