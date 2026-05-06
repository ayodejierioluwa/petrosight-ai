const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Forward console logs to node
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:3005', { waitUntil: 'networkidle0' });
  
  // Inject global click listener
  await page.evaluate(() => {
    document.addEventListener('click', (e) => {
      console.log('Global click caught on:', e.target.tagName, e.target.className, e.target.innerText.substring(0, 20));
    }, true); // use capture phase
  });
  
  // Try to click the "Compressors" tab
  console.log("Attempting to click Compressors tab...");
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.innerText, tab);
    if (text.includes('Compressors')) {
      await tab.click();
      console.log("Puppeteer clicked it.");
    }
  }
  
  await page.waitForTimeout(1000);
  await browser.close();
})();
