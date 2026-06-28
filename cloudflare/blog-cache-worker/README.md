# AS Blog Cache Worker

Read-only cache proxy for the existing article Worker.

## Cached routes

- `/posts`: 5 minutes
- `/posts/:slug`: 30 minutes
- `/sitemap.xml`: 60 minutes

Responses include `X-AS-Cache: MISS` on the first request and `X-AS-Cache: HIT` when served from the Cloudflare Cache API.

## Deploy

```bash
npx wrangler deploy
```

After deployment, replace the `WORKER` constants in `blog.html` and `post.html`, plus the homepage article endpoint in `index.html`, with the new Worker URL.
