# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

## Project
- Demo site for Sean's AEM Dev Live 2026 talk: top-10 countdown of EDS Masterclass questions. Pages here are proof points on stage.
- Talk context: `/Users/ssteimer/Documents/dev-live/dev-live-context.md`.
- Fictional brand: Vela Sports Group, a multinational sporting goods company. Brands: Stridewell (running), Ridgeline (outdoor), Tidal (water), Veloce (cycling), Courtside (team/racket).
- Demos to support: environments/repoless (#10), gated content (#8), martech vs. performance (#5), authoring (#4), multi-region (#3), carousel/design system (#2), server-side logic + SEO (#1).
- Integrations will run as Cloudflare Workers on a custom domain (likely `devlive.shsteimer.com`, TBD).

## Workers
- `workers/<name>/` (wrangler.toml + `src/index.js`), own `package.json` in `workers/`. Not served (`.hlxignore`). See `workers/README.md`.
- `cdn`: BYO CDN worker, routes host → origin via `SITES` for repoless.
- Stage CDN = same worker, `wrangler --env stage` (`MODE=stage`). `?ref={branch}` swaps the branch on the resolved origin, sticky via cookie, `?ref=` resets. Uncached, noindex.
- Push to `main` touching `workers/<name>/` deploys it and each `[env.*]` (`.github/workflows/workers.yaml`). Needs `CLOUDFLARE_API_TOKEN` secret + `CLOUDFLARE_ACCOUNT_ID` var.
- Prefer worker routes on the site domain (e.g. `/api/*`) over cross-origin calls.

## Regions and languages
- Regional repoless sites: NA, EU, APAC (Sean creates sites + CDNs). Each translates into its own languages.
- All content lives under a language root: `/en/...`, `/de/...`. `/` redirects to `/en/` (`redirects` sheet). Nav/footer: `/{lang}/nav`, `/{lang}/footer`.
- Code reads language from the path via `scripts/i18n.js`. Never hardcode `/en` in code; content links are absolute with the language root.
- `/docs/...` is site tooling, not localized.

## Repoless
- Each site: own DA content + config at tools.aem.live, code from this repo.
- Code must not hardcode the site name or host. Use relative URLs and `window.hlx.codeBasePath`.
- New site → add host to `SITES` in `workers/cdn/wrangler.toml`.
- `content/` holds the main site only. Clone other sites into a separate checkout.

## Content
- Authored in DA: `shsteimer/dev-live-2026`. Edit locally in `content/` (gitignored, own git).
- `aem content clone --all` → edit → `aem content add` → `aem content commit -m` → `aem content push`. Push stores; it does not preview or publish.
- Images: external public URLs (CC0, e.g. rawpixel `editor_1024`, no watermark). Publishing ingests them to the media bus. Don't upload binaries to DA.
- Preview locally with `aem up` only. Sean previews/publishes from DA.
- Block library: `docs/library/blocks/{block}` + row in `docs/library/blocks.json`. Never published. Test-only variants: `docs/testing/blocks/{block}`.
- Write like a real brand. No lorem ipsum, no talk references in content.

## Testing
- `npm run lint` (pre-commit hook + CI), `npm test` (node:test + jsdom, CI), `npm run test:e2e` (Playwright vs. `aem up` + library pages; local only).
- Unit tests: pure logic only, mirror source path under `test/`. Call `setupDom()` before importing code that touches `window`.
- E2E: `test/e2e/blocks/{block}/{block}.spec.js`. Block root class + ARIA roles only, no authored copy. Only for a11y/interaction worth guarding.
- Guidance: `.agents/skills/testing-blocks/` (philosophy in `references/`).

## Skills
- `.agents/skills/` (`.claude/skills` symlinks to it): adobe/skills EDS + content-ops plugins. `testing-blocks` and `content-driven-development` carry local test/library conventions; keep them on upstream updates.
- Reuse ideas freely from https://github.com/scdemos/demo (auth-toggle, product-grid, search, form, schema, workers).

## Authorization
Standing approval from Sean, overriding global rules for this repo only:
- Create, edit, delete any file in this repo and `content/`.
- Commit and push straight to `main` on `shsteimer/dev-live-2026`. No PR needed.
- `aem content push`, incl. deletes, to DA `shsteimer/dev-live-2026`.
- Preview, publish, unpublish via admin.hlx.page for `shsteimer/dev-live-2026` and its repoless sites.
- Create/edit files under `workers/` and the GitHub workflows that deploy them.
- Still ask first: force-push, history rewrites, other repos/sites, Cloudflare changes.

## Avoid
- `scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/scripts/`.

## Outdated
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.

## Remember
- `npx -y @adobe/aem-cli up`: local code + local `content/`, falls back to preview.
- Merging `main` ships code; content publishes separately.
- PRs, when used, need a `{branch}--dev-live-2026--shsteimer.aem.page/{path}` link.
- All committed files are served. Use `.hlxignore`.
