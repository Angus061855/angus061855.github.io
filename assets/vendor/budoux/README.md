# BudouX 0.10.1

Source: https://github.com/google/budoux/tree/v0.10.1
License: Apache-2.0 (see LICENSE).
Unmodified parser and Traditional Chinese model from npm budoux@0.10.1.

The site uses only the parser, not its HTML processor. Text is inserted with
textContent; existing HTML, links, events and manual line breaks are preserved.

Rebuild the checked-in browser bundle from the repository root:

```sh
npx --yes --package=esbuild@0.28.0 esbuild scripts/typography-entry.mjs --bundle --minify --charset=utf8 --outfile=typography.js
```

No CDN or runtime package download is required.
