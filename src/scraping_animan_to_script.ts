import fs from "fs";
import playwright from "playwright";
import stringifySync from "csv-stringify/sync";

// ここにスレッドIDを入れる
const TOPICS_ID = "20935167";
const THREAD_URL = `https://animanch.com/archives/${TOPICS_ID}.html`;

// introareaのテキストと画像
const getThreadPosts = async (
  context: playwright.BrowserContext,
  isMainArea: boolean
) => {
  const p = context.pages()[0];

  const threadItems = await p.$$(
    `${isMainArea ? "#maintext" : "#introtext"} > .res`
  );
  const list = await Promise.all(
    threadItems.map(
      async (item: playwright.ElementHandle<SVGElement | HTMLElement>) => {
        const number = await item.$eval(".t_h > .resnum", (e) => e.textContent);
        const text = await item
          .$eval(".t_b", (e) => e.textContent)
          .catch(() => "");
        const textStyle = await item
          .$eval(".t_b", (e) => e.getAttribute("style"))
          .catch(() => "");

        return {
          number,
          text,
          textStyle,
        };
      }
    )
  );

  return list;
};

// commentareaのテキスト
const getCommentPosts = async (context: playwright.BrowserContext) => {
  const p = context.pages()[0];

  const commentItems = await p.$$(`#commentarea > .commentwrap`);
  const list = await Promise.all(
    commentItems.map(
      async (item: playwright.ElementHandle<SVGElement | HTMLElement>) => {
        const number = await item.$eval(
          ".commentheader > .commentnumber",
          (e) => e.textContent
        );
        const text = await item
          .$eval(".commentbody", (e) => e.textContent)
          .catch(() => "");

        return {
          number,
          text,
          textStyle: "",
        };
      }
    )
  );

  return list;
};

// メインエリアの画像の場合
const getMainAreaImages = async (context: playwright.BrowserContext) => {
  const p = context.pages()[0];

  // const topImage =
  //   (await p.$eval("#introtext > .compImage > a > img", (e) =>
  //     e.getAttribute("src")
  //   )) ?? "";

  const threadImages = await p.$$("#maintext > .compImage");
  const list = await Promise.all(
    threadImages.map(
      async (item: playwright.ElementHandle<SVGElement | HTMLElement>) => {
        const img = await item.$eval("a > img", (e) => e.getAttribute("src"));

        return {
          img,
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
  const element = page.locator("article > h1");
  const threadTitle: string = await element.innerText();

  // 各エリアのテキストと画像を取得
  const introAreaList = await getThreadPosts(context, false);
  const mainAreaList = await getThreadPosts(context, true);
  const commentAreaList = await getCommentPosts(context);

  // 各エリアのテキストと画像を結合
  const items = [
    ...introAreaList,
    ...mainAreaList,
    {
      number: "xxxxxxxxxxx",
      text: "ここからコメントエリア",
    },
    ...commentAreaList,
  ].flatMap((v) => v);

  // CSV用のデータを作成
  const data: {
    number: string | null;
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

  fs.writeFileSync(`./threads/${TOPICS_ID}_${threadTitle}.csv`, csvData);

  await browser.close();
})();
