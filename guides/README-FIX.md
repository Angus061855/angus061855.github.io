# guides 修復候選（t107）

## 行為
- `/guides`（根）→ 靜態候選導向 `/knowledge`（meta refresh + JS + canonical）
- **保留** `/guides/hotel-pr-guide/`

## 部署勿刪（遠端現況 200，本地候選可能未含全文）
正式站 sitemap／線上已存在，部署時**不得覆蓋刪除**：
1. `/guides/hotel-pr-guide/`
2. `/guides/hotel-contract/`
3. `/guides/hotel-pr-salary/`
4. `/guides/choose-agent/`
5. `/guides/is-hotel-work-safe/`

GitHub Pages 無原生 301；本候選用 meta/JS。若上 Cloudflare／_redirects，可另加 301 規則（需批准）。
