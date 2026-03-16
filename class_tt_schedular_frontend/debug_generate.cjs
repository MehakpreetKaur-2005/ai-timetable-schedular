const { chromium } = require('playwright'); // Ensure playwright is installed

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`PAGE EXCEPTION: ${exception}`);
  });

  try {
    await page.goto('http://localhost:5173/admin/generate');
    console.log('Navigated to Generate page.');
    
    // Wait for the generate button
    const btn = page.locator('button:has-text("Generate Timetable")').first();
    await btn.waitFor();
    console.log('Clicking Generate Timetable...');
    await btn.click();
    
    console.log('Waiting for generation trace or logs...');
    await page.waitForTimeout(5000); 
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
})();
