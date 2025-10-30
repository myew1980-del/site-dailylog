# 建築物施工日誌（公共工程制式｜Web版）

單檔 HTML，支援本機儲存、匯出/匯入 JSON、逐日 A4 列印（保留「工地主任 簽名/署章」）。

## 上架（GitHub Pages）
1. 建立公開 repo（例如 `site-dailylog`）。
2. 上傳 `index.html`（拖拉上傳）。
3. Settings → Pages → Source: `Deploy from a branch`；Branch: `main`；Folder: `/ (root)` → Save。
4. 等約 1 分鐘，開啟顯示網址 `https://<your-account>.github.io/site-dailylog/`。

## 使用
- 直接在頁面填寫各欄，按「儲存本日」。資料存在瀏覽器 localStorage。
- 「列印本月」：將該月所有日誌逐日分頁輸出（PDF 或印表機）。
- 可「匯出 JSON」備份；換電腦用「匯入 JSON」還原。

## 注意
- 圖片未上傳伺服器（本版本未含照片欄位）。
- 如果瀏覽器清除網站資料，localStorage 會被清空。請養成每月匯出備份的習慣。
