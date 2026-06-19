// 一次性開發工具：用 Gemini 生成聽力測驗的 7 張情境圖，存進 images/。
// 這不是 runtime 依賴 —— app 執行期只讀 images/ 裡的本地 PNG，照樣離線。
//
// 用法：
//   1. 去 https://aistudio.google.com/apikey 申請 API key（跟 Gemini app 訂閱不同）
//   2. export GEMINI_API_KEY="你的key"
//   3. npm run gen-images          # 已存在的圖會跳過
//      npm run gen-images -- --force  # 強制重生全部
//
// 改 prompt 或加題時，更新下面的 PROMPTS（id 要對應 index.html PHRASES 的 id）。

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "images");
const MODEL = "gemini-2.5-flash-image";

// 統一風格後綴：扁平童書插畫、單一主體、純色背景、無文字（聽力測驗，圖裡不能有字）、正方形。
const STYLE =
  "simple flat vector children's-book illustration, bright cheerful colors, " +
  "bold clean outlines, one single clear centered subject, plain solid light background, " +
  "no text, no letters, no words, no numbers, square composition, " +
  "friendly and suitable for a young kids' English class";

// id 必須對應 index.html 裡 PHRASES 的 id。
const PROMPTS = [
  { id: "thank-you",      desc: "a cheerful child smiling and bowing slightly with both hands together, warmly saying thank you" },
  { id: "youre-welcome",  desc: "a friendly child smiling with one open welcoming hand gesture, a kind 'you are welcome' pose" },
  { id: "good-job",       desc: "a happy child giving a big thumbs-up with a shining gold star beside them, celebrating a job well done" },
  { id: "are-you-ready",  desc: "an eager child wearing a backpack, standing alert and raising one hand, looking ready to start, a small question mark above the head" },
  { id: "come-in",        desc: "an open classroom door with a friendly hand gesturing to come inside, warm and inviting" },
  { id: "go-to-seat",     desc: "a child walking toward an empty classroom desk and chair to sit down, gently pointing to the seat" },
  { id: "repeat-after-me", desc: "a teacher pointing to their own mouth while speaking and a child repeating, two empty speech bubbles between them" },
];

const force = process.argv.includes("--force");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "✗ 找不到 GEMINI_API_KEY。\n" +
    "  1. 去 https://aistudio.google.com/apikey 申請（免費額度；跟 Gemini app 訂閱不同）\n" +
    '  2. export GEMINI_API_KEY="你的key"\n' +
    "  3. 再跑一次 npm run gen-images"
  );
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const ai = new GoogleGenAI({ apiKey });

async function genOne({ id, desc }) {
  const file = path.join(OUT_DIR, `${id}.png`);
  if (!force && fs.existsSync(file)) {
    console.log(`• skip  ${id}.png（已存在，--force 可覆蓋）`);
    return "skip";
  }
  const prompt = `${desc}. ${STYLE}.`;
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { imageConfig: { aspectRatio: "1:1" } },
  });
  const parts = res?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    const note = parts.find((p) => p.text)?.text || "（回傳無圖，可能被安全策略擋下）";
    throw new Error(note.slice(0, 200));
  }
  fs.writeFileSync(file, Buffer.from(img.inlineData.data, "base64"));
  console.log(`✓ wrote ${id}.png`);
  return "ok";
}

let ok = 0, skip = 0, fail = 0;
for (const item of PROMPTS) {
  try {
    const r = await genOne(item);
    r === "ok" ? ok++ : skip++;
  } catch (e) {
    fail++;
    console.error(`✗ fail  ${item.id}.png — ${e.message}`);
  }
}

console.log(`\n=== ${ok} 生成 / ${skip} 跳過 / ${fail} 失敗 → ${path.relative(process.cwd(), OUT_DIR)}/ ===`);
process.exit(fail ? 1 : 0);
