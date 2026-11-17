# 安全標頭（尚未部署；業主 2026-11-17 原則同意，僅授權準備與非正式環境驗證）

GitHub Pages 無法自訂回應標頭，必須在 Cloudflare 加 **Response Header Transform Rule**。
2026-11-17 實測正式站回應只有 `Server`、`Content-Type`、`Cache-Control`，沒有下列任何一個。
標頭值的唯一來源是同資料夾的 `headers.json`；本機驗證與日後 Cloudflare 設定都以它為準。

## 非正式環境驗證（2026-11-17）

- `SECURITY_HEADERS=1 node scripts/preview-site.mjs`：本機預覽送出 `headers.json` 全部標頭。
- 核心流程 25 項（首頁 LINE 點擊與 GA4 事件、部落格搜尋／分類／載入更多、文章頁、7 個子頁 200 無主控台錯誤）：
  有標頭 25/25、無標頭 25/25，結果相同。
- `nosniff` 風險檢查：正式站 21 類自家資源（HTML、CSS、JS、webp、png、jpg、ico、xml、txt）與外部 GA4、Meta、文章 API
  的 Content-Type 全部正確，不會被擋。
- 未驗證：正式網域上 Cloudflare 規則本身的套用範圍與快取行為（需授權後在正式設定驗證）。

## 建議設定（Rules → Transform Rules → Modify Response Header）

條件：`(http.host eq "as-ent-tw.com")`

| 動作 | 標頭 | 值 | 對既有服務的影響評估 |
|---|---|---|---|
| Set static | `Strict-Transport-Security` | `max-age=31536000` | 全站已強制 https（http 會轉 https）。刻意**不加** `includeSubDomains`、`preload`，避免影響未確認的子網域。 |
| Set static | `X-Content-Type-Options` | `nosniff` | 所有資源都有正確 Content-Type，無影響。 |
| Set static | `Referrer-Policy` | `strict-origin-when-cross-origin` | 這是瀏覽器預設值；GA4／Meta 仍拿得到來源網域，只拿不到完整路徑。 |
| Set static | `X-Frame-Options` | `SAMEORIGIN` | 網站不需要被其他網域用 iframe 嵌入；若有合作夥伴嵌入頁面需先移除此項。 |
| Set static | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | 全站沒有用到這些 API。 |

**暫不建議**：`Content-Security-Policy`。全站大量 inline script（GA4、Meta Pixel、JSON-LD、頁面互動），
直接上 CSP 會讓功能失效；若要做，先用 `Content-Security-Policy-Report-Only` 觀察兩週。

## 上線後驗證

```bash
curl -sI https://as-ent-tw.com/ | grep -iE "strict-transport|x-content-type|referrer-policy|x-frame|permissions-policy"
```

再開首頁、/blog、任一 /post/ 文章、/tools/time-calculator/，確認 LINE 按鈕、文章載入、GA4 即時報表都正常。

## 回滾

在 Cloudflare 停用或刪除這條 Transform Rule 即可，立即生效；HSTS 已送出的瀏覽器會記住一年，
但全站本來就只走 https，不受影響。
