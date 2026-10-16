/*
 * Re-clones site content from DA before e2e tests. `/docs/library/blocks/*` pages are
 * never published, so they only render locally if cloned into content/. Clones --all
 * because `clone --force` replaces the whole content/ dir.
 *
 * Skipped when content/ has uncommitted changes (preserves WIP library pages) and when
 * E2E_BASE_URL points at a remote target (it serves its own content).
 *
 * Runs automatically via the test:e2e pretest hook.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function isContentClean() {
  if (!existsSync('content/.git')) return true;
  const status = execSync('git -C content status --porcelain', { encoding: 'utf-8' });
  return status.trim().length === 0;
}

function isLocalTarget() {
  const baseUrl = process.env.E2E_BASE_URL;
  return !baseUrl || new URL(baseUrl).hostname === 'localhost';
}

if (!isLocalTarget()) {
  // eslint-disable-next-line no-console
  console.log(`E2E_BASE_URL is remote (${process.env.E2E_BASE_URL}) — skipping local content refresh.`);
} else if (!isContentClean()) {
  // eslint-disable-next-line no-console
  console.log('content/ has uncommitted changes — skipping refresh to preserve work in progress.');
} else {
  // eslint-disable-next-line no-console
  console.log('Refreshing local content from da.live...');
  execSync('npx aem content clone --all --force --yes', { stdio: 'inherit' });
}
