// 回歸測試：資料完整性、抽考池、語音、模式切換。
// 注意：jsdom 不做 CSS layout，測不到中文遮罩的視覺正確性。
// 動到 .fzh 遮罩 CSS 時，請另外開瀏覽器目視確認。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"} - ${name}`); };

// 建一個帶 Web Speech mock 的 DOM。voices 可自訂以測語音挑選。
function makeDom(voices = [{ name: "Samantha", lang: "en-US", localService: true }]) {
  const spoken = [];
  let lastVoice = null;
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window;
  w.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  w.speechSynthesis = {
    getVoices: () => voices, cancel: () => {}, onvoiceschanged: null,
    speak: (u) => { spoken.push(u.text); lastVoice = u.voice ? u.voice.name : null; },
  };
  w.loadVoices && w.loadVoices();
  return { w, spoken, getLastVoice: () => lastVoice };
}

// ---- 資料完整性 ----
{
  const { w } = makeDom();
  const words = [...w.document.querySelectorAll("#board .word")].map(e => e.textContent);
  check("無重複單字", new Set(words).size === words.length);

  let missing = 0;
  w.document.querySelectorAll("#board .card").forEach(c => {
    if (!c.querySelector(".emoji").textContent.trim() || !c.querySelector(".zh").textContent.trim()) missing++;
  });
  check("每張卡都有 emoji 與中文", missing === 0);

  // 七個類別都有對應配色 class（避免加類別漏改 CSS）
  ["people","animals","food","things","places","numbers","others"].forEach(k =>
    check(`類別區塊存在: ${k}`, !!w.document.querySelector(`.group.${k}`)));
}

// ---- 抽考池：一輪涵蓋全部、不重複 ----
{
  const { w } = makeDom();
  const total = w.document.querySelectorAll("#board .card").length;
  w.setMode("test");
  const drawn = new Set();
  for (let i = 0; i < total; i++) { drawn.add(w.document.getElementById("fWord").textContent); w.nextFlash(); }
  check(`抽考一輪涵蓋全部 ${total} 字`, drawn.size === total);
}

// ---- 語音：翻開時 = 單字 + 逐字母；收起不發聲 ----
{
  const { w, spoken } = makeDom();
  w.setMode("test");
  const word = w.document.getElementById("fWord").textContent;
  spoken.length = 0;
  w.flipFlash(); // 翻開
  check(`翻牌發聲 = 單字+逐字母 (${JSON.stringify(spoken)})`,
        JSON.stringify(spoken) === JSON.stringify([word, ...word.split("")]));
  spoken.length = 0;
  w.flipFlash(); // 收起
  check("收起時不發聲", spoken.length === 0);

  spoken.length = 0;
  w.speakWord("banana");
  check("banana = [banana,b,a,n,a,n,a]",
        JSON.stringify(spoken) === JSON.stringify(["banana","b","a","n","a","n","a"]));
}

// ---- 預設語音優先 Samantha，並能切換 ----
{
  const { w, getLastVoice } = makeDom([
    { name: "Fred", lang: "en-US", localService: true },
    { name: "Google US English", lang: "en-US", localService: false },
    { name: "Samantha (Enhanced)", lang: "en-US", localService: true },
    { name: "Mei-Jia", lang: "zh-TW", localService: true }, // 非英文，應被濾掉
  ]);
  const sel = w.document.getElementById("voiceSel");
  check("選單排除非英文語音", !sel.innerHTML.includes("Mei-Jia"));
  check(`預設選 Samantha (${sel.options[sel.selectedIndex].text})`,
        sel.options[sel.selectedIndex].text.includes("Samantha"));

  const gIdx = [...sel.options].findIndex(o => o.text.includes("Google"));
  w.setMode("test");
  w.pickVoice(gIdx);
  check("切換語音後發聲使用所選語音", getLastVoice() === "Google US English");
}

// ---- 模式切換 ----
{
  const { w } = makeDom();
  w.setMode("review"); check("review 模式 class", w.document.body.className === "review");
  w.setMode("quiz");   check("quiz 模式 class",   w.document.body.className === "quiz");
  w.setMode("test");   check("test 模式 class",   w.document.body.className === "test");
  w.setMode("listen"); check("listen 模式 class", w.document.body.className === "listen");
}

// ---- 聽力測驗 ----
// 註：PHRASES 為 const，不掛 window；改由 DOM + cycling 驗證資料與行為。
{
  const { w, spoken } = makeDom();
  const correctOf = () => [...w.document.querySelectorAll("#lopts .opt")]
    .find(o => /pickOption\(this,true\)/.test(o.getAttribute("onclick")));

  spoken.length = 0;
  w.setMode("listen");
  const opts = [...w.document.querySelectorAll("#lopts .opt")];
  check("聽力出兩張選項卡", opts.length === 2);

  // 播放整句（一次 utterance，非逐字母拆解），內容 = 正確卡的英文句
  check(`播放整句語音 (${JSON.stringify(spoken)})`,
        spoken.length === 1 && spoken[0] === correctOf().querySelector(".optword").textContent);

  // cycling 多輪收集題庫：至少 5 句、每句有 emoji/英文/中文
  const seen = new Map();
  for (let i = 0; i < 40; i++) {
    const c = correctOf();
    seen.set(c.querySelector(".optword").textContent, {
      e: c.querySelector(".emoji").textContent.trim(),
      zh: c.querySelector(".optzh").textContent.trim(),
    });
    w.nextListen();
  }
  check(`題庫至少 5 句 (收集到 ${seen.size})`, seen.size >= 5);
  check("每句片語有 emoji/英文/中文",
        [...seen].every(([en, v]) => en && v.e && v.zh));

  // 每張選項卡都接上 images/<id>.png（圖在就用圖，缺圖 onerror 退回 emoji）
  const pics = [...w.document.querySelectorAll("#lopts .opt .optpic")];
  check("選項卡接上本地圖片 src",
        pics.length === 2 && pics.every(p => /^images\/[a-z-]+\.png$/.test(p.getAttribute("src"))));

  // 選項一對一錯（onclick 帶 true / false）
  const curOpts = [...w.document.querySelectorAll("#lopts .opt")];
  const correctCard = curOpts.find(o => /pickOption\(this,true\)/.test(o.getAttribute("onclick")));
  const wrongCard   = curOpts.find(o => /pickOption\(this,false\)/.test(o.getAttribute("onclick")));
  check("選項一張正確一張干擾", !!correctCard && !!wrongCard);

  // 選錯 → wrong class（抖動），不換題不揭曉
  w.pickOption(wrongCard, false);
  check("選錯加 wrong class", wrongCard.classList.contains("wrong"));
  check("選錯不揭曉中文", !wrongCard.classList.contains("revealed"));

  // 選對 → correct + revealed，兩張都鎖定（done）
  w.pickOption(correctCard, true);
  check("選對加 correct + revealed", correctCard.classList.contains("correct") && correctCard.classList.contains("revealed"));
  check("選對後兩張都鎖定 done", curOpts.every(o => o.classList.contains("done")));
}

// ---- 干擾項：長度相近，避免用字長短作弊 ----
{
  const { w } = makeDom();
  w.setMode("listen");
  const optText = (which) => [...w.document.querySelectorAll("#lopts .opt")]
    .find(o => o.getAttribute("onclick").includes(`pickOption(this,${which})`))
    .querySelector(".optword").textContent;

  // 先收集全部片語文字（cycling）
  const all = new Set();
  for (let i = 0; i < 60; i++) { all.add(optText("true")); all.add(optText("false")); w.nextListen(); }
  const texts = [...all];
  // 某句的「第 3 接近」長度差（含並列，用門檻值比較，避免 tie 抖動）
  const thirdClosestDiff = (c) => {
    const diffs = texts.filter(t => t !== c).map(t => Math.abs(t.length - c.length)).sort((a, b) => a - b);
    return diffs[Math.min(2, diffs.length - 1)];
  };

  let withinPool = true, sawVariety = new Map();
  for (let i = 0; i < 240; i++) {
    const c = optText("true"), d = optText("false");
    if (Math.abs(c.length - d.length) > thirdClosestDiff(c)) withinPool = false;
    (sawVariety.get(c) || sawVariety.set(c, new Set()).get(c)).add(d);
    w.nextListen();
  }
  check("干擾項長度落在最接近的前三名內", withinPool);
  // 至少有某句的干擾項出現過 ≥2 種（證明仍有變化、不是固定配對）
  check("同一句的干擾項仍會變化", [...sawVariety.values()].some(s => s.size >= 2));
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
