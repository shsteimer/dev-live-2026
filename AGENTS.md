# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

## Project
- Demo site for Sean's AEM Dev Live 2026 talk: top-10 countdown of EDS Masterclass questions. Pages here are proof points on stage.
- Talk context: `/Users/ssteimer/Documents/dev-live/dev-live-context.md`.
- Fictional brand: Vela Sports Group, a multinational sporting goods company. Brands: Stridewell (running), Ridgeline (outdoor), Tidal (water), Veloce (cycling), Courtside (team/racket).
- Demos to support: environments/repoless (#10), gated content (#8), martech vs. performance (#5), authoring (#4), multi-region (#3), carousel/design system (#2), server-side logic + SEO (#1).
- Integrations will run as Cloudflare Workers on a custom domain (likely `devlive.shsteimer.com`, TBD).

## Content
- Authored in DA: `shsteimer/dev-live-2026`. Edit locally in `content/` (gitignored, own git).
- `aem content clone --all` → edit → `aem content add` → `aem content commit -m` → `aem content push`. Push stores; it does not preview or publish.
- Images live in DA under `/media/`. Use CC0 or public-domain only.
- Write like a real brand. No lorem ipsum, no talk references in content.

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
- `npx -y @adobe/aem-cli up`: local code, previewed content.
- Merging `main` ships code; content publishes separately.
- Overrides global rules: commit and push straight to `main`, no PR needed.
- PRs, when used, need a `{branch}--dev-live-2026--shsteimer.aem.page/{path}` link.
- All committed files are served. Use `.hlxignore`.
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).
