# Public URL redirects

Prepared locally only. GitHub Pages does not execute `_redirects`.
After explicit production approval, inspect existing Cloudflare Single Redirect
rules for duplicates/conflicts, then add only these exact-path rules. Do not replace
the whole ruleset or unrelated rules. No Worker routes need to change.

Print the rule payloads from the repository root:

```sh
node --input-type=module -e "import {cloudflareRules} from './cloudflare/site-redirects/src/index.mjs'; console.log(JSON.stringify(cloudflareRules, null, 2))"
```

Use Cloudflare's existing `http_request_dynamic_redirect` zone ruleset or create
one if absent. The API credential needs Zone > Single Redirect > Edit.
Reference: https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/

Only five exact paths redirect; guide articles and query strings are preserved.
Existing HTML fallbacks remain available until the edge redirects are deployed.
Local preview tests do not verify the live Cloudflare configuration.

Preview using `node scripts/preview-site.mjs` and test with
`node --test scripts/ui-safety.test.mjs`.

After deployment, verify the HTTP 301 and Location headers on all five URLs,
and HTTP 200 on `/blog`, `/knowledge`, `/contact` and guide articles.
