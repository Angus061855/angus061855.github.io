 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/SITE_AUDIT_CHECKLIST.md b/SITE_AUDIT_CHECKLIST.md
new file mode 100644
index 0000000000000000000000000000000000000000..2f80047813bcca18f48b59649ed55af72344232b
--- /dev/null
+++ b/SITE_AUDIT_CHECKLIST.md
@@ -0,0 +1,95 @@
+# Website Audit Checklist（手機版 UX / 載入速度 / SEO 可讀性）
+
+> 適用站點：`index.html`、`blog.html`、`post.html`  
+> 使用方式：每次改版前後跑一輪，將 `[ ]` 改成 `[x]` 並補充備註。
+
+## A. 手機版 UX（Mobile UX）
+
+### A1. 導覽與互動
+- [ ] 手機導覽列高度固定且不遮住首屏主要內容（避免 fixed nav 遮住 H1/CTA）。
+- [ ] 漢堡選單可用鍵盤操作（Enter/Space）並有 `aria-expanded` 狀態。
+- [ ] 開啟手機選單時，背景不可誤觸（可加遮罩或鎖定滾動）。
+- [ ] 主要 CTA（加 LINE）在首屏內可見，且不被浮動按鈕遮擋。
+- [ ] 所有可點擊元素（button/link）觸控熱區至少 44x44px。
+
+### A2. 內容可讀性
+- [ ] 手機字級正文至少 16px，行高 >= 1.6。
+- [ ] 段落長度適中（每段 2–4 行），避免大段文字牆。
+- [ ] 文字與背景對比符合 WCAG AA（一般文字至少 4.5:1）。
+- [ ] Hero 與 FAQ 區塊在小螢幕不會橫向溢位（無水平捲軸）。
+- [ ] 固定浮動按鈕不遮住 footer、表單、cookie/banner 等元素。
+
+### A3. 狀態與回饋
+- [ ] Blog/Post 資料載入有 Skeleton 或 Loading 狀態（目前有「載入中...」，可再視覺優化）。
+- [ ] API 失敗時顯示可行動指引（重試、返回、聯絡方式）。
+- [ ] 互動元件（FAQ 展開、按鈕 hover/active）有一致回饋。
+- [ ] 不依賴 hover 才看得到關鍵資訊（手機沒有 hover）。
+
+---
+
+## B. 載入速度（Performance）
+
+### B1. 網路請求與資源
+- [ ] 字體（Google Fonts）加上 `preconnect`（fonts.googleapis.com / fonts.gstatic.com）。
+- [ ] Logo 與大圖使用正確尺寸與壓縮格式（建議 WebP/AVIF）。
+- [ ] 非首屏圖片使用 `loading="lazy"`、`decoding="async"`。
+- [ ] 避免阻塞渲染：非必要 JS 延後載入或 `defer`。
+- [ ] 第三方 API（Cloudflare Worker）有 timeout/retry 策略。
+
+### B2. 前端執行成本
+- [ ] `canvas` 背景動畫在手機降級（降低 FPS/粒子量，或提供 `prefers-reduced-motion`）。
+- [ ] 長列表（Blog 卡片）渲染避免一次插入過多 DOM。
+- [ ] 重複計算（如 views 計算）可快取，減少每次重算。
+- [ ] 盡量減少 inline style 與重複 CSS，利於快取與維護。
+
+### B3. 指標與門檻（建議）
+- [ ] LCP < 2.5s（4G 中階機）。
+- [ ] INP < 200ms。
+- [ ] CLS < 0.1。
+- [ ] 首頁總傳輸體積（HTML+CSS+JS+圖片）控制在可接受範圍。
+
+---
+
+## C. SEO 可讀性（H1/H2 / meta / 內鏈）
+
+### C1. 標題結構
+- [ ] 每頁僅 1 個 `<h1>`，且包含主關鍵詞。
+- [ ] `h2` 依內容語意分層，不跳階、不中斷。
+- [ ] 標題文字可讀、自然，不堆疊關鍵字。
+
+### C2. Meta 與結構化資料
+- [ ] 每頁 `title` 唯一且長度建議 50–60 字元內。
+- [ ] 每頁 `meta description` 唯一且具摘要性（約 120–160 字元）。
+- [ ] canonical 準確指向當前內容主 URL。
+- [ ] OG/Twitter meta 完整（title/description/image/url/type）。
+- [ ] JSON-LD（Person / FAQ / Blog / Article）語意與頁面內容一致。
+
+### C3. 內鏈與索引
+- [ ] 首頁、部落格、文章頁彼此有明確內鏈路徑（首頁→列表→文章→列表/首頁）。
+- [ ] 重要頁面可在 3 次點擊內抵達。
+- [ ] 錨點連結（#about/#faq）在手機上定位正確，不被 fixed nav 遮住。
+- [ ] `sitemap.xml` 包含主要頁面且可被搜尋引擎抓取。
+- [ ] 圖片 `alt` 文案有語意，不是重複關鍵詞。
+
+---
+
+## D. 針對目前站點的優先修正清單（依影響排序）
+
+1. **首頁補上語意化 H1**（目前 `index.html` 沒有 `<h1>`，建議加在 Hero 主標並保持視覺設計一致）。
+2. **手機版導覽無障礙**：漢堡按鈕補 `aria-expanded`、`aria-controls`，並在開關時同步更新。
+3. **字體與外部資源優化**：加 `preconnect` 與圖片 lazy loading。
+4. **Canvas 動畫降級策略**：對行動裝置/低效能與 `prefers-reduced-motion` 做性能保護。
+5. **文章頁 meta title 動態化**：目前 runtime 會改 `document.title`，可再確認 SSR/預渲染情境下的可抓取性。
+
+---
+
+## E. 驗收流程（每次改版）
+
+1. 手機實機（iPhone + Android）檢查首屏、導覽、CTA、FAQ。
+2. 跑 Lighthouse（Mobile）並記錄 LCP/INP/CLS。
+3. 檢查每頁 H1/H2/meta/canonical 是否唯一且正確。
+4. 隨機抽 3 篇文章檢查內鏈、返回路徑與錯誤處理。
+5. 提交前執行：
+   - `git diff --check`
+   - `rg -n "<h1\\b|<h2\\b|meta name=\"description\"|rel=\"canonical\"" index.html blog.html post.html`
+
 
EOF
)
