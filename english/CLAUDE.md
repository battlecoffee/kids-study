# CLAUDE.md

給 Claude Code 的專案脈絡。動手前先讀完「設計約束」——這專案有幾個刻意的決定，別當成普通網頁重構。

## 這是什麼

小孩英文單字的考前複習頁，用筆電投電視用。**單一靜態 HTML，零建置、零後端。**

考試形式決定了整個設計：老師指一個英文單字 → 小孩①唸發音 ②逐字母拼 ③說中文。所以每張卡固定有四個元素：圖示、英文（大字，給唸＋拼）、字母拆解（給拼字）、中文（要測的答案）。

## 架構

- `index.html` —— 全部都在這裡。HTML + CSS + JS 同檔。
- 唯一外部 **runtime** 依賴：Google Fonts（CDN，`Fredoka` + `Nunito`）。**離線會 fallback 到系統字體，這是刻意的**，見下方約束。
- 語音：瀏覽器原生 Web Speech API（`speechSynthesis`），不是音檔、不是雲端 TTS。
- 聽力測驗情境圖：`images/<id>.png` 本地檔，由 `tools/gen-images.mjs`（Gemini 生圖）一次性產生。**這是開發工具不是 runtime 依賴**——執行期只讀本地 PNG，照樣離線；缺圖時自動退回 emoji（見 `.optpic` 的 onerror）。`@google/genai` 只在 devDependencies。
- 資料模型：`<script>` 裡的 `DATA`（單字）與 `PHRASES`（聽力片語）兩個陣列，是唯一的真實來源（single source of truth）。畫面、抽考池、聽力題庫都由它們生成。

`DATA` 結構：
```js
{ key:"animals", zhName:"動物", en:"Animals", color:"--animals", items:[
    { w:"dog", zh:"狗", e:"🐶" },   // w=英文, zh=中文, e=emoji
] }
```

七個類別：people / animals / food / things / places / numbers / others。

聽力測驗另有獨立題庫 `PHRASES`（老師課堂常用語），結構 `{en, zh, e}`，與 `DATA` 平行，是聽力模式的唯一真實來源。

## 四種模式（`setMode`）

- `review` 複習：全攤開。
- `quiz` 測驗：分類網格，中文遮成「?」，點卡翻開並發聲。
- `test` 隨機抽考：洗牌後全螢幕一次一張，最接近真實考試。`Space`看答案 / `Enter`·`→`下一張 / `S`再聽。
- `listen` 聽力測驗：播一句英文整句（`speakPhrase`，**不逐字母拆**）→ 出兩張卡（emoji＋英文句），點對的那張。點對→綠框＋翻出中文後自動換題；點錯→紅框抖一下並再播一次，留原題重選。`S`／`R`再聽 / `Enter`·`→`跳下一題。題目來自 `PHRASES`，干擾項隨機取另一句。

## 維護常見任務

**加單字**：在 `DATA` 對應類別的 `items` 加 `{w,zh,e}`。只改這一處，畫面與抽考池自動更新。

**加聽力片語**：在 `PHRASES` 加 `{en,zh,e,id}`。`en` 用簡單清晰的整句（非俚語），`e` 是缺圖時的 emoji fallback，`id` 對應 `images/<id>.png`。要出圖的話，到 `tools/gen-images.mjs` 的 `PROMPTS` 加同一個 `id` + 英文情境描述，然後 `npm run gen-images`（需先 `export GEMINI_API_KEY=...`，key 申請見該檔頂部註解）。只改這兩處，聽力題庫與干擾項自動更新；沒生圖也能跑（顯示 emoji）。

**加類別**：要改四處，缺一不可——
1. `:root` 加兩個變數 `--xxx` / `--xxx-bg`
2. `.xxx .card{border-color:var(--xxx-bg);}`
3. `.xxx .word{color:var(--xxx);}`
4. `DATA` push 一個新類別物件（`color:"--xxx"`）

**調語音**：`rankVoice()` 是自動挑選的評分函式；預設強制優先 `Samantha`（見 `loadVoices`）。使用者一旦從下拉手動選過，就不再自動覆蓋。

## 設計約束（別違反）

- **中文不發聲**，只唸英文＋拼字。對應考試「中文要小孩自己說」。
- **避開英式（en-GB）語音當預設**。台灣學校教美式 KK，發音要一致。
- **不要為了「現代化」引入需建置的東西**（React／打包工具／npm 執行期依賴）。離線可用是硬需求：考試當天投電視，本地直接開 `index.html` 也要能跑。Web Speech 與系統字體的 fallback 就是為此。
- 中文遮罩靠純 CSS（`.fzh` 未翻開時 `color:transparent` + `::after` 顯示「?」）。**改到這段 CSS 後，務必用真瀏覽器目視確認中文沒透出來**——見下方測試邊界。

## 驗證

`npm test`（jsdom 回歸測試，見 `test/test.mjs`）涵蓋：資料完整性、抽考池、語音呼叫序列、預設語音、模式切換。

**測試邊界**：jsdom 不做 CSS layout，**測不到遮罩視覺**。動到 `.fzh` / `.flash .fzh` 的遮罩 CSS，要另外開瀏覽器看。其餘改動 `npm test` 綠燈即可。

## 部署

GitHub Pages：`index.html` 放根目錄，Settings → Pages → main/root。網址 `https://<帳號>.github.io/<repo>/`。
