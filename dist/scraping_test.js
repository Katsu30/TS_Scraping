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
const TOPICS_ID = '4159101';
const getPostsByPage = (context, pageNum = 1) => __awaiter(void 0, void 0, void 0, function* () {
    const p = yield context.newPage();
    yield p.goto(`https://girlschannel.net/topics/${TOPICS_ID}/${pageNum !== 1 ? pageNum : ''}`);
    const threadItems = yield p.$$(".topic-comment .comment-item .body");
    const list = yield Promise.all(threadItems.map((item) => __awaiter(void 0, void 0, void 0, function* () { return yield item.innerText(); })));
    return list;
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.default.chromium.launch({
        channel: 'chrome',
        headless: false,
        slowMo: 500,
    });
    const context = yield browser.newContext();
    const page = yield context.newPage();
    yield page.goto(`https://girlschannel.net/topics/${TOPICS_ID}/`);
    const element = yield page.locator('.head-area > h1');
    const threadTitle = yield element.innerText();
    const pager = yield page.$$("ul.pager li");
    const pageNum = yield Promise.all(pager.map((item) => __awaiter(void 0, void 0, void 0, function* () { return yield item.innerText(); })));
    const set = [...new Set(pageNum)].filter((v) => v).map((v) => parseInt(v));
    const test = yield Promise.all(Array.from(set).map((_pageNum) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield getPostsByPage(context, _pageNum);
        return result;
    })));
    const items = test.flatMap((v) => v);
    const data = [];
    data.push({ title: threadTitle, content: '' });
    items.forEach((item) => {
        data.push({ title: '', content: item });
    });
    const csvData = sync_1.default.stringify(data, { header: true });
    fs_1.default.writeFileSync(`./${TOPICS_ID}_sample.csv`, csvData);
    yield browser.close();
}))();
//# sourceMappingURL=scraping_test.js.map