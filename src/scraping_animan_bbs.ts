import fs from "fs";
import playwright from "playwright";
import stringifySync from "csv-stringify/sync";

// ここにスレッドIDを入れる
const TOPICS_ID = "2827950";
const THREAD_URL = `https://bbs.animanch.com/board/${TOPICS_ID}/`;

// introareaのテキストと画像
const getThreadPosts = async (context: playwright.BrowserContext) => {
  const p = context.pages()[0];

  const threadItems = await p.$$(`#resList > .list-group-item > .resbody`);

  const list = await Promise.all(
    threadItems.map(
      async (item: playwright.ElementHandle<SVGElement | HTMLElement>) => {
        return {
          text: await item.textContent(),
        };
      }
    )
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

  await page.goto(THREAD_URL);

  // ページのタイトルを取得
  const element = await page.locator("#catalog > h1");
  const threadTitle: string = await element.innerText();

  // 各エリアのテキストと画像を取得
  const mainAreaList = await getThreadPosts(context);

  // 各エリアのテキストと画像を結合
  const items = [...mainAreaList].flatMap((v) => v);

  // CSV用のデータを作成
  const data: {
    number: string;
    text: string | null;
  }[] = [];
  items.forEach((item, index) => {
    data.push({
      number: `${(index % 5) + 1}`,
      text: item.text,
    });
  });

  // CSVファイルを作成
  const csvData = stringifySync.stringify(data, { header: true });

  // ディレクトリが存在するか確認し、存在しない場合は作成
  const dir = "./threads";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(`./threads/bbs_${TOPICS_ID}_${threadTitle}.csv`, csvData);

  await browser.close();
})();
