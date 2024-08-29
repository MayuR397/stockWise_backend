import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

let stockDataArray = [];
let commonStockNames = [];
let taskInterval;

async function runPuppeteer() {
  stockDataArray = [];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const chromeProfilePath = path.join(
    os.homedir(),
    "Documents",
    "puppeteer_temp_chrome_profile"
  );

  async function createChromeProfile() {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--user-data-dir=${chromeProfilePath}`,
        "--disable-images",
        "--disable-javascript",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--no-startup-window",
      ],
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(
      "https://www.moneycontrol.com/india/stockpricequote/engineering-heavy/gardenreachshipbuildersengineers/GRS01#advchart",
      {
        waitUntil: "domcontentloaded",
      }
    );

    const session = await page.target().createCDPSession();
    const { windowId } = await session.send("Browser.getWindowForTarget");
    await session.send("Browser.setWindowBounds", {
      windowId,
      bounds: { left: -1000, top: -1000, width: 1, height: 1 },
    });

    await manuallyIndicatorsSetter(page);
    await findCommonStocks(page);

    console.log(
      "Manually set indicators, then press Enter to close the browser..."
    );
    await new Promise((resolve) => {
      process.stdin.once("data", resolve);
    });

    await browser.close();
  }

  async function useChromeProfile() {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--user-data-dir=${chromeProfilePath}`,
        "--disable-images",
        "--disable-javascript",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    const session = await page.target().createCDPSession();
    const { windowId } = await session.send("Browser.getWindowForTarget");
    await session.send("Browser.setWindowBounds", {
      windowId,
      bounds: { left: -1000, top: -1000, width: 1, height: 1 },
    });

    return browser;
  }

  if (!fs.existsSync(chromeProfilePath)) {
    console.log("Chrome profile not found. Creating a new profile...");
    await createChromeProfile();
  } else {
    console.log("Using existing Chrome profile...");
  }

  (async () => {
    const browser = await useChromeProfile();
    const page = await browser.newPage();

    const commonStocks = await findCommonStocks(page);
    await openCharts(commonStocks, page);

    await browser.close();
  })();

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function manuallyIndicatorsSetter(page) {
    await page.waitForSelector("#wzrk-cancel", { visible: true });
    await page.click("#wzrk-cancel");
    console.log("Button clicked successfully!");

    try {
      const iframeElement = await page.waitForSelector(
        "iframe[src*='charting_library-v22/charting_library']",
        { visible: true }
      );
      const iframe = await iframeElement.contentFrame();
      console.log("Switched to the iframe successfully!");

      const buttonSelector = "div[data-name='open-indicators-dialog']";
      await iframe.waitForSelector(buttonSelector, { visible: true });

      await iframe.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ block: "center", inline: "center" });
        }
      }, buttonSelector);
      await iframe.click(buttonSelector);
      console.log("Indicator button clicked successfully!");

      const inputSelector = "input[data-role='search']";
      await iframe.waitForSelector(inputSelector, { visible: true });
      await iframe.click(inputSelector);
      await iframe.type(inputSelector, "Moving Average Multiple");
      console.log(
        "Typed 'Moving Average Multiple' into the search input successfully!"
      );

      const suggestionSelector =
        "div[data-role='list-item'][data-title='Moving Average Multiple']";
      await iframe.waitForSelector(suggestionSelector, { visible: true });
      await iframe.click(suggestionSelector);
      console.log("Suggested option clicked successfully!");

      const closeButtonSelector =
        "span.close-2sL5JydP[data-name='close'][data-role='button']";
      await iframe.waitForSelector(closeButtonSelector, { visible: true });
      await iframe.click(closeButtonSelector);
      console.log("Clicked on the close button successfully!");

      await sleep(2000);

      const legendItemXPath =
        "//div[@class='title-1WIwNaDF mainTitle-1WIwNaDF apply-overflow-tooltip withDot-1WIwNaDF' and text()='Moving Average Multiple']";
      const legendItemHandle = await iframe.evaluateHandle((xpath) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return result;
      }, legendItemXPath);
      if (legendItemHandle) {
        await legendItemHandle.asElement().click();
        console.log(
          "Clicked on the 'Moving Average Multiple' legend item successfully!"
        );
      } else {
        console.log("Legend item 'Moving Average Multiple' not found.");
      }

      await sleep(2000);

      const absoluteXPath =
        "/html/body/div[2]/div[1]/div[2]/div[1]/div[2]/table/tr[1]/td[2]/div/div[2]/div[2]/div[2]/div[3]/div[1]/div[2]/div/div[3]";
      const elementHandle = await iframe.evaluateHandle((xpath) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return result;
      }, absoluteXPath);
      if (elementHandle) {
        await elementHandle.asElement().click();
        console.log("Clicked on the settings button successfully!");
      } else {
        console.log("Element not found with the absolute XPath.");
      }

      const input1Locator = iframe.locator('input[value="14"]');
      const input3Locator = iframe.locator('input[value="35"]');

      await input1Locator.click();
      console.log("Clicked on the first input with value 14.");

      await iframe.evaluate(() => {
        const button = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.scrollable-2CTvqFKf > div > div:nth-child(2) > div > span > span.inner-slot-1cMNQxXi.interactive-1cMNQxXi > div > button.control-7ApHzdB4.controlDecrease-7ApHzdB4"
        );

        if (button) {
          console.log("Button found, clicking it 4 times.");
          for (let i = 0; i < 4; i++) {
            button.click();
          }
          console.log("Button clicked 4 times successfully.");
        } else {
          console.log("Button not found.");
        }
      });

      await input3Locator.click();
      await iframe.evaluate(() => {
        const button2 = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.scrollable-2CTvqFKf > div > div:nth-child(6) > div > span > span.inner-slot-1cMNQxXi.interactive-1cMNQxXi > div > button.control-7ApHzdB4.controlIncrease-7ApHzdB4"
        );

        if (button2) {
          console.log("Button 2 found, clicking it 15 times.");
          for (let i = 0; i < 15; i++) {
            button2.click();
          }
          console.log("Button 2 clicked 15 times successfully.");
        } else {
          console.log("Button 2 not found.");
        }
      });

      const styleTabSelector =
        "div.tab-1KEqJy8_.withHover-1KEqJy8_.tab-3I2ohC86[data-type='tab-item'][data-name='tab-item-style']";
      await iframe.waitForSelector(styleTabSelector, { visible: true });
      await iframe.click(styleTabSelector);
      console.log("Clicked on the Style tab successfully!");

      await iframe.evaluate(() => {
        const label_4 = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.scrollable-2CTvqFKf > div > div:nth-child(7) > div > label"
        );

        if (label_4) {
          label_4.click();
          console.log("Label clicked successfully.");
        } else {
          console.log("Label not found.");
        }
      });

      await iframe.evaluate(() => {
        const label_5 = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.scrollable-2CTvqFKf > div > div:nth-child(9) > div > label"
        );

        if (label_5) {
          label_5.click();
          console.log("Label 5 clicked successfully.");
        } else {
          console.log("Label 5 not found.");
        }
      });

      await iframe.evaluate(() => {
        const label_6 = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.scrollable-2CTvqFKf > div > div:nth-child(11) > div > label"
        );

        if (label_6) {
          label_6.click();
          console.log("Label 6 clicked successfully.");
        } else {
          console.log("Label 6 not found.");
        }
      });

      await iframe.evaluate(() => {
        const ok_button = document.querySelector(
          "#overlap-manager-root > div > div > div.dialog-2AogBbC7.dialog-2cMrvu9r.dialog-UM6w7sFp.rounded-UM6w7sFp.shadowed-UM6w7sFp > div > div.footer-KW8170fm > div > span > button"
        );

        if (ok_button) {
          ok_button.click();
          console.log("OK button clicked successfully.");
        } else {
          console.log("OK button not found.");
        }
      });
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  async function findCommonStocks(page) {
    commonStockNames = [];

    const urls = [
      "https://chartink.com/screener/copy-fresh-all-time-highs-1",
      "https://chartink.com/screener/multi-year-breakout",
      "https://chartink.com/screener/52-week-breakout-1",
    ];

    let stockNamesList = [];

    for (const url of urls) {
      console.log(`Processing URL: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      try {
        await page.waitForSelector("#DataTables_Table_0", { visible: true });

        await page.waitForFunction(
          () => document.querySelectorAll("#DataTables_Table_0 tr").length > 10,
          { timeout: 60000 }
        );

        const stockNames = await page.evaluate(() => {
          const rows = document.querySelectorAll("#DataTables_Table_0 tr");
          const namesSet = new Set();

          rows.forEach((row) => {
            const columns = row.querySelectorAll("td");
            if (columns.length > 0) {
              const stockName = columns[2].innerText.trim();
              const percentChange = columns[4].innerText.trim();

              const percentChangeValue = parseFloat(
                percentChange.replace("%", "")
              );

              if (percentChangeValue > 5) {
                namesSet.add(stockName);
              }
            }
          });

          return Array.from(namesSet);
        });

        stockNamesList.push(new Set(stockNames));
      } catch (error) {
        console.error(`An error occurred while processing URL ${url}:`, error);
      }
    }

    const commonStocks = stockNamesList.reduce(
      (a, b) => new Set([...a].filter((x) => b.has(x)))
    );

    commonStockNames = Array.from(commonStocks);
    console.log("Common Stocks:", Array.from(commonStocks));
    return Array.from(commonStocks);
  }

  async function openCharts(commonStocks, page) {
    for (let i = 0; i < commonStocks.length; i++) {
      const stock = commonStocks[i];
      await page.goto("https://www.moneycontrol.com/", {
        waitUntil: "domcontentloaded",
      });

      try {
        await page.setViewport({ width: 1280, height: 800 });
        const inputSelector = "input#search_str";
        await page.waitForSelector(inputSelector, { visible: true });

        const inputField = await page.$(inputSelector);
        await inputField.click();

        for (const char of stock) {
          await page.keyboard.type(char, { delay: 200 });
        }

        await sleep(1000);

        const resultSelector = "#autosuggestlist > ul > li:first-child";
        await page.waitForSelector(resultSelector, { visible: true });
        await page.click(resultSelector);

        const stockData = await getDataChartsDaily5Min(page, stock);
      } catch (error) {
        console.error(
          `An error occurred while processing stock ${stock}:`,
          error
        );
      }
    }
  }

  async function getDataChartsDaily5Min(page, stock) {
    try {
      const iframeElement = await page.waitForSelector(
        "iframe[src*='charting_library-v22/charting_library']",
        { visible: true, timeout: 60000 }
      );

      await page.evaluate((iframe) => iframe.scrollIntoView(), iframeElement);
      const iframe = await iframeElement.contentFrame();
      if (!iframe) {
        console.error("Failed to switch to iframe for stock:", stock);
        return;
      }
      console.log(
        `Switched to the iframe successfully for charts data of ${stock}!`
      );

      await sleep(2000);
      const {
        currentPrice: dailyCurrentPrice,
        EMA10: dailyEMA10,
        EMA21: dailyEMA21,
        EMA50: dailyEMA50,
      } = await getCandlesData(iframe);

      await sleep(2000);
      await iframe.evaluate(() => {
        const button = document.querySelector(
          'div[data-value="5"][data-role="button"]'
        );
        if (button) {
          button.click();
          console.log("Clicked on the 5m button successfully.");
        } else {
          console.log("5m button not found.");
        }
      });
      await sleep(2000);

      const {
        currentPrice: fiveCurrentPrice,
        EMA10: fiveEMA10,
        EMA21: fiveEMA21,
        EMA50: fiveEMA50,
      } = await getCandlesData(iframe);

      stockDataArray.push({
        stock,
        daily: { dailyCurrentPrice, dailyEMA10, dailyEMA21, dailyEMA50 },
        fiveMin: { fiveCurrentPrice, fiveEMA10, fiveEMA21, fiveEMA50 },
      });

      return {
        stock,
        dailyCurrentPrice,
        dailyEMA10,
        dailyEMA21,
        dailyEMA50,
        fiveCurrentPrice,
        fiveEMA10,
        fiveEMA21,
        fiveEMA50,
      };
    } catch (error) {
      console.error(`An unexpected error occurred for ${stock}:`, error);
      return null;
    }
  }

  async function getCandlesData(iframe) {
    await iframe.waitForSelector("div.legend-1WIwNaDF.noWrap-1WIwNaDF", {
      timeout: 60000,
    });

    const currentPrice = await iframe.evaluate(() => {
      return document.querySelector(
        "div.legend-1WIwNaDF.noWrap-1WIwNaDF div.valuesWrapper-1WIwNaDF div:nth-child(6) div.valueValue-1WIwNaDF"
      ).innerText;
    });
    console.log("Text inside the element:", currentPrice);

    const EMA10 = await iframe.evaluate(() => {
      return document.querySelector(
        "div.legend-1WIwNaDF.noWrap-1WIwNaDF div.sources-1WIwNaDF div:nth-child(3) div.valuesWrapper-1WIwNaDF div:nth-child(1) div"
      ).innerText;
    });
    console.log("dEMA10:", EMA10);

    const EMA21 = await iframe.evaluate(() => {
      return document.querySelector(
        "div.legend-1WIwNaDF.noWrap-1WIwNaDF div.sources-1WIwNaDF div:nth-child(3) div.valuesWrapper-1WIwNaDF div:nth-child(2) div"
      ).innerText;
    });
    console.log("dEMA21:", EMA21);

    const EMA50 = await iframe.evaluate(() => {
      return document.querySelector(
        "div.legend-1WIwNaDF.noWrap-1WIwNaDF div.sources-1WIwNaDF div:nth-child(3) div.valuesWrapper-1WIwNaDF div:nth-child(3) div"
      ).innerText;
    });
    console.log("dEMA50:", EMA50);

    return { currentPrice, EMA10, EMA21, EMA50 };
  }
}

function startScheduledTask() {
  runPuppeteer();
  taskInterval = setInterval(runPuppeteer, 90000);
}

function stopScheduledTask() {
  if (taskInterval) {
    clearInterval(taskInterval);
    taskInterval = null;
  }
}

export {
  startScheduledTask,
  stopScheduledTask,
  stockDataArray,
  commonStockNames,
};
