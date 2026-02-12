const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    console.log('Navigating to http://localhost:7000...');
    await page.goto('http://localhost:7000', { waitUntil: 'networkidle' });

    // Helper to click nav and screenshot
    const captureTab = async (pageName, fileName) => {
      console.log(`Capturing ${pageName}...`);
      const navItem = await page.$(`.nav-item[data-page="${pageName}"]`);
      if (navItem) {
        await navItem.click();
        await page.waitForTimeout(1000); // Wait for animations/renders
        await page.screenshot({ path: `/tmp/${fileName}` });
      } else {
        console.error(`Nav item for ${pageName} not found`);
      }
    };

    // The default page is likely 'overview' or similar. 
    // We'll try to find 'chat', 'tasks', and 'office'.
    // Based on the grep, the data-page for office might be 'office'.
    
    await captureTab('chat', 'dobby-chat.png');
    await captureTab('tasks', 'dobby-tasks.png');
    
    // Check if 'office' nav item exists
    const hasOffice = await page.$('.nav-item[data-page="office"]');
    if (hasOffice) {
      await captureTab('office', 'dobby-office.png');
    } else {
      console.log('Office tab nav item not found in DOM');
      await page.screenshot({ path: '/tmp/dobby-office-missing.png' });
    }

  } catch (err) {
    console.error('Navigation failed:', err);
  } finally {
    console.log('Console Errors found:', consoleErrors);
    await browser.close();
  }
})();
