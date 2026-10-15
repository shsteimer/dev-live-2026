# workers

Cloudflare Workers for the demo site. One folder per worker: `workers/<name>/wrangler.toml` + `src/index.js`.

- `cdn`: BYO CDN worker in front of `*.aem.live`. Routes by host for repoless sites (`SITES` var).

Add a worker: copy `cdn/`, rename `name` in `wrangler.toml`. Pushes to `main` that touch `workers/<name>/` deploy that worker (`.github/workflows/workers.yaml`).

```sh
cd workers && npm i
npx wrangler dev -c cdn/wrangler.toml
```

GitHub config:
- secret `CLOUDFLARE_API_TOKEN` (Workers edit)
- var `CLOUDFLARE_ACCOUNT_ID`
- worker secrets: GitHub secrets named `<WORKER>__<NAME>` (e.g. `CDN__ORIGIN_AUTHENTICATION`) are pushed as `<NAME>`.
