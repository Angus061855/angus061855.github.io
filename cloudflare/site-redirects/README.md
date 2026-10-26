# Public URL redirects

Deployed on 2026-10-27 using Cloudflare Bulk Redirects, because all 10 Single
Redirect slots were already occupied. GitHub Pages does not execute `_redirects`.
No existing rules, Worker routes, DNS records, or plan settings were changed.

Production list: `as_ent_public_paths` (ID `ffd2bdf47c474c22b05a87fa0f0af007`).
Production rule: `as-ent public paths 301` (ID `1cb7aefb82dd447b80d055f1009d7573`).
The five HTTPS source paths in `redirects` are enabled with status 301 and query
preservation. Include subdomains and subpath matching are disabled.
Verified all five paths with and without query strings, destination 200 responses,
an unaffected guide article (200), and an unknown URL (404).

Maintain this existing list rather than creating duplicate rules. Inspect current
Cloudflare state before any future edits; do not replace unrelated rules.

The source also retains optional Single Redirect payloads for reference only;
they are NOT the deployed mechanism. Print them from the repository root:

```sh
node --input-type=module -e "import {cloudflareRules} from './cloudflare/site-redirects/src/index.mjs'; console.log(JSON.stringify(cloudflareRules, null, 2))"
```

If migrating to Single Redirects later, the credential needs Zone > Single Redirect > Edit.
Reference: https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/

Only five exact paths redirect; guide articles and query strings are preserved.
Existing HTML fallback files remain in the repository; edge redirects take precedence.
Local preview tests do not verify the live Cloudflare configuration.

Preview using `node scripts/preview-site.mjs` and test with
`node --test scripts/ui-safety.test.mjs`.

After deployment, verify the HTTP 301 and Location headers on all five URLs,
and HTTP 200 on `/blog`, `/knowledge`, `/contact` and guide articles.
