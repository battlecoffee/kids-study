# 聽力測驗情境圖 — 生圖指引

這 7 張圖是聽力測驗的選項圖。用 Gemini app（或任何生圖工具）把下面每個 prompt 生成一張，
**存成指定檔名、放在這個 `images/` 資料夾裡**。`index.html` 已接好——圖在就用圖，缺圖自動退回 emoji。

要點：
- **正方形（1:1）**、**圖裡不要有任何文字/字母**（這是聽力測驗，看字就破功了）。
- 七張風格要一致（prompt 已內含統一風格後綴）。
- 不滿意某張就重生那一張、覆蓋同檔名即可，不用動 code。
- 之後若想改用 API 自動生（含 43 張單字卡），prompt 同步維護在 `tools/gen-images.mjs`。

存好後直接開 `index.html` → 聽力測驗 看效果。

---

## thank-you.png
A cheerful child smiling and bowing slightly with both hands together, warmly saying thank you. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## youre-welcome.png
A friendly child smiling with one open welcoming hand gesture, a kind "you are welcome" pose. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## good-job.png
A happy child giving a big thumbs-up with a shining gold star beside them, celebrating a job well done. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## are-you-ready.png
An eager child wearing a backpack, standing alert and raising one hand, looking ready to start, a small question mark above the head. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## come-in.png
An open classroom door with a friendly hand gesturing to come inside, warm and inviting. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## go-to-seat.png
A child walking toward an empty classroom desk and chair to sit down, gently pointing to the seat. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, one single clear centered subject, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.

## repeat-after-me.png
A teacher pointing to their own mouth while speaking and a child repeating, two empty speech bubbles between them. Simple flat vector children's-book illustration, bright cheerful colors, bold clean outlines, two clear subjects, plain solid light background, no text, no letters, no words, no numbers, square composition, friendly and suitable for a young kids' English class.
