const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  // === Config ===
  const inputPath = path.join(__dirname, "halfbakedharvest-urls.txt");
  const outputPath = path.join(__dirname, "rawRecipes.ndjson");
  const failedPath = path.join(__dirname, "failed-urls.txt");
  const restartEvery = 50;

  // === Load URLs ===
  const allUrls = fs.readFileSync(inputPath, "utf8")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  // === Load already scraped URLs ===
  let alreadyScraped = new Set();
  if (fs.existsSync(outputPath)) {
    const lines = fs.readFileSync(outputPath, "utf8")
      .split("\n")
      .map(line => {
        try {
          return JSON.parse(line).url;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    alreadyScraped = new Set(lines);
  }

  // === CLI Arg: start index (optional) ===
  const cliStartIndex = parseInt(process.argv[2]) || 0;

  // === Filter to remaining URLs ===
  const urlsToScrape = allUrls.filter(url => !alreadyScraped.has(url));

  // === File Writers ===
  const fileStream = fs.createWriteStream(outputPath, { flags: "a" });
  const failLog = fs.createWriteStream(failedPath, { flags: "a" });

  let browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 120000,
    args: ["--no-sandbox"]
  });

  for (let i = cliStartIndex; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    console.log(`🔍 Scraping (${i + 1}/${urlsToScrape.length}): ${url}`);

    try {
      // Restart browser every N pages
      if (i > 0 && i % restartEvery === 0) {
        console.log("♻️ Restarting browser to prevent memory issues...");
        await browser.close();
        browser = await puppeteer.launch({
          headless: true,
          protocolTimeout: 120000,
          args: ["--no-sandbox"]
        });
      }

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

      const jsonLd = await page.evaluate(() => {
        const script = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .find(s => s.textContent.includes('"@type":"Recipe"'));
        return script ? JSON.parse(script.textContent) : null;
      });

      let recipeBlock = null;
      if (Array.isArray(jsonLd?.["@graph"])) {
        recipeBlock = jsonLd["@graph"].find(item => item["@type"] === "Recipe");
      } else if (jsonLd?.["@type"] === "Recipe") {
        recipeBlock = jsonLd;
      }

      if (recipeBlock) {
        const line = JSON.stringify({ url, data: recipeBlock });
        fileStream.write(line + "\n");
        console.log("✅ Recipe schema saved.");
      } else {
        console.warn("⚠️ No recipe schema found.");
        failLog.write(url + "\n");
      }

      await page.close();
      await new Promise((r) => setTimeout(r, 300));

    } catch (err) {
      console.error(`❌ Failed to scrape ${url}: ${err.message}`);
      failLog.write(url + "\n");
    }
  }

  await browser.close();
  fileStream.close();
  failLog.close();

  console.log(`\n🎉 Done! Appended recipes to ${outputPath}`);
})();
