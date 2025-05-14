const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 120000, // Avoid protocol errors
    args: ['--no-sandbox']
  });

  let page = await browser.newPage();
  const baseUrl = "https://www.halfbakedharvest.com/recipes/?_paged=";
  const outputPath = path.join(__dirname, "halfbakedharvest-urls.txt");
  const allUrls = new Set();
  const startPage = parseInt(process.argv[2]) || 1;
  let pageNum = startPage;

  while (true) {
    const pageUrl = `${baseUrl}${pageNum}`;
    console.log(`Scraping: ${pageUrl}`);

    try {
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

      const urls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("article.post-summary h3.post-summary__title a"))
          .map(a => a.href);
      });

      const uniqueUrls = urls.filter(url => !allUrls.has(url));

      if (uniqueUrls.length === 0) {
        console.log("No new recipes found — finished scraping.");
        break;
      }

      uniqueUrls.forEach(url => allUrls.add(url));
      fs.appendFileSync(outputPath, uniqueUrls.join("\n") + "\n");

      console.log(`✅ Page ${pageNum}: ${uniqueUrls.length} new recipes found.`);

      // Optional: close and reopen page every 20 pages to avoid memory issues
      if (pageNum % 20 === 0) {
        await page.close();
        page = await browser.newPage();
      }

      // Respectful delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      pageNum++;

    } catch (err) {
      console.error(`❌ Error on page ${pageNum}: ${err.message}`);
      pageNum++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying next page
    }
  }

  await browser.close();

  console.log(`🎉 Done! Total unique recipes scraped: ${allUrls.size}`);
  console.log(`📄 Saved to: ${outputPath}`);
})();
