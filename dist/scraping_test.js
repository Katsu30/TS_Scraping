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
const TOPICS_ID = "20929287";
// introareaのテキストと画像
const getIntroPosts = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const p = yield context.newPage();
    yield p.goto(`https://animanch.com/archives/20929362.html`);
    const threadItems = yield p.$$("#entryarea > .res > .t_b");
    const list = yield Promise.all(threadItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        return {
            text: yield item.innerText(),
            textStyle: yield item.getAttribute("style"),
            image: yield item.$eval("img", (img) => img.getAttribute("src")),
        };
    })));
    return list;
});
// mainareanのテキストと画像
// commentareaのテキスト
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.default.chromium.launch({
        channel: "chrome",
        headless: false,
        slowMo: 500,
    });
    const context = yield browser.newContext();
    const page = yield context.newPage();
    yield page.goto(`https://animanch.com/archives/20929362.html`);
    // ページのタイトルを取得
    const element = yield page.locator("#entryarea > h1");
    const threadTitle = yield element.innerText();
    const result = yield getIntroPosts(context);
    const items = result.flatMap((v) => v);
    // CSV用のデータを作成
    const data = [];
    data.push({ title: threadTitle, content: "" });
    items.forEach((item) => {
        data.push({ title: "", content: item });
    });
    // CSVファイルを作成
    const csvData = sync_1.default.stringify(data, { header: true });
    fs_1.default.writeFileSync(`./threads/${TOPICS_ID}.csv`, csvData);
    yield browser.close();
}))();
//# sourceMappingURL=scraping_test.js.map