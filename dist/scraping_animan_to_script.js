"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const playwright_1 = __importDefault(require("playwright"));
const sync_1 = __importDefault(require("csv-stringify/sync"));
// ここにスレッドIDを入れる
const TOPICS_ID = "20856950";
const THREAD_URL = `https://animanch.com/archives/${TOPICS_ID}.html`;
// introareaのテキストと画像
const getThreadPosts = (context, isMainArea) => __awaiter(void 0, void 0, void 0, function* () {
    const p = context.pages()[0];
    const threadItems = yield p.$$(`${isMainArea ? "#maintext" : "#introtext"} > .res`);
    const list = yield Promise.all(threadItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const number = yield item.$eval(".t_h > .resnum", (e) => e.textContent);
        const text = yield item.$eval(".t_b", (e) => e.textContent);
        const textStyle = yield item.$eval(".t_b", (e) => e.getAttribute("style"));
        return {
            number,
            text,
            textStyle,
        };
    })));
    return list;
});
// commentareaのテキスト
const getCommentPosts = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const p = context.pages()[0];
    const commentItems = yield p.$$(`#commentarea > .commentwrap`);
    const list = yield Promise.all(commentItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const number = yield item.$eval(".commentheader > .commentnumber", (e) => e.textContent);
        const text = yield item.$eval(".commentbody", (e) => e.textContent);
        return {
            number,
            text,
            textStyle: "",
        };
    })));
    return list;
});
// メインエリアの画像の場合
const getMainAreaImages = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const p = context.pages()[0];
    // const topImage =
    //   (await p.$eval("#introtext > .compImage > a > img", (e) =>
    //     e.getAttribute("src")
    //   )) ?? "";
    const threadImages = yield p.$$("#maintext > .compImage");
    const list = yield Promise.all(threadImages.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const img = yield item.$eval("a > img", (e) => e.getAttribute("src"));
        return {
            img,
        };
    })));
    return list;
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.default.chromium.launch({
        channel: "chrome",
        headless: false,
        slowMo: 500,
    });
    const context = yield browser.newContext();
    const page = yield context.newPage();
    yield page.goto(THREAD_URL);
    // ページのタイトルを取得
    const element = page.locator("article > h1");
    const threadTitle = yield element.innerText();
    // 各エリアのテキストと画像を取得
    const introAreaList = yield getThreadPosts(context, false);
    const mainAreaList = yield getThreadPosts(context, true);
    const commentAreaList = yield getCommentPosts(context);
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
    const data = [];
    items.forEach((item, index) => {
        data.push({
            number: `${(index % 5) + 1}`,
            text: item.text,
        });
    });
    // CSVファイルを作成
    const csvData = sync_1.default.stringify(data, { header: true });
    // ディレクトリが存在するか確認し、存在しない場合は作成
    const dir = "./threads";
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir);
    }
    fs_1.default.writeFileSync(`./threads/${TOPICS_ID}_${threadTitle}.csv`, csvData);
    yield browser.close();
}))();
//# sourceMappingURL=scraping_animan_to_script.js.map