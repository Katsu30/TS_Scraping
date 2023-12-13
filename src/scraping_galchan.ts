import fs from "fs";
import playwright from "playwright";
import stringifySync from "csv-stringify/sync";

const TOPICS_ID = "20929287";

const getPostsByPage = async (
  context: playwright.BrowserContext,
  pageNum = 1
) => {
  const p = await context.newPage();
  await p.goto(
    `https://girlschannel.net/topics/${TOPICS_ID}/${
      pageNum !== 1 ? pageNum : ""
    }`
  );

  const threadItems = await p.$$(".topic-comment .comment-item .body");
  const list = await Promise.all(
    threadItems.map(async (item) => await item.innerText())
  );

  return list;
};

(async () => {
  const browser = await playwright.chromium.launch({
    channel: "chrome",
    headless: false,
    slowMo: 500,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`https://girlschannel.net/topics/${TOPICS_ID}/`);

  const element = await page.locator(".head-area > h1");
  const threadTitle = await element.innerText();

  const pager = await page.$$("ul.pager li");
  const pageNum = await Promise.all(
    pager.map(async (item) => await item.innerText())
  );
  const set = [...new Set(pageNum)].filter((v) => v).map((v) => parseInt(v));

  const test = await Promise.all(
    Array.from(set).map(async (_pageNum) => {
      const result = await getPostsByPage(context, _pageNum);
      return result;
    })
  );

  const items = test.flatMap((v) => v);

  const data = [];
  data.push({ title: threadTitle, content: "" });
  items.forEach((item) => {
    data.push({ title: "", content: item });
  });

  const csvData = stringifySync.stringify(data, { header: true });
  fs.writeFileSync(`./threads/${TOPICS_ID}.csv`, csvData);

  await browser.close();
})();
