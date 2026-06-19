# CLAUDE.md — kids-study monorepo

小朋友各科考前複習 / 練習頁的集合。**一科一資料夾，每科都是單一靜態 HTML、零建置、零後端、可離線直接開。**

## 結構

```
kids-study/
├── index.html      ← 首頁選單（投電視時選科目），純連結到各科
├── english/        ← 英文：單字複習 + 聽力測驗（詳見 english/CLAUDE.md）
├── math/           ← 數學：錢幣闖關等（詳見 math/README.md）
└── shared/         ← （目前不存在）只有當 ≥2 科真的共用同一段時才抽出來
```

## 共用設計約束（所有科目都遵守）

- **離線可用是硬需求**：考試/練習當天投電視，本地直接開 `<科目>/index.html` 就要能跑。不引入需建置的東西（React／打包工具／npm 執行期依賴）。
- **每科自我完整**：一個科目的 index.html 自己跑得起來，不依賴別科或根目錄。根 `index.html` 只是選單。
- **語音用瀏覽器原生 Web Speech API**，避開英式（en-GB）預設、台灣學校教美式 KK。
- **不要過早抽 `shared/`**：單科用到的東西就留在該科內（constitution：簡單優先、不為單次用途做抽象）。等到第二科真的要用同一段（如語音挑選、卡片框架、撒彩帶）再抽到 `shared/`，用相對路徑引用（仍離線）。

## 各科專屬規則

- 英文：見 `english/CLAUDE.md`（資料模型 `DATA` / `PHRASES`、四種模式、聽力圖片與 `tools/gen-images.mjs`、測試邊界）。
- 數學：見 `math/README.md`。

## 部署

GitHub Pages（repo 根目錄）：首頁 `https://<帳號>.github.io/kids-study/`，各科在 `/english/`、`/math/` 子路徑。
> 註：數學原本是獨立 repo `kids-math`（網址 `…/kids-math/`），併入本 monorepo 後網址改為 `…/kids-study/math/`，舊歷史仍保留在 GitHub `kids-math` 遠端。
