import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VISUAL_ARTIFACTS_DIR = '.artifacts/visual-regression';
export const VISUAL_BASELINE_DIR = `${VISUAL_ARTIFACTS_DIR}/baseline`;
export const VISUAL_CURRENT_DIR = `${VISUAL_ARTIFACTS_DIR}/current`;
export const VISUAL_DIFF_DIR = `${VISUAL_ARTIFACTS_DIR}/diff`;
export const VISUAL_SUMMARY_FILE = `${VISUAL_ARTIFACTS_DIR}/summary.json`;

export const VISUAL_CAPTURE_DIR_ENV = 'VISUAL_CAPTURE_DIR';
export const VISUAL_CAPTURE_FALLBACK_DIR = '.visual-captures';

/**
 * Digest-pinned Playwright image used by Visual baseline, Visual regression, and
 * `visual-local`. Workflows cannot import this module, so a test asserts they still
 * pin the same string. Bump the tag and digest together when Playwright moves.
 */
export const PLAYWRIGHT_VISUAL_IMAGE =
	'mcr.microsoft.com/playwright:v1.64.0-jammy@sha256:c064e7f355d2dda32f669801a1b09e86a1e9252395c844d2cfbbe5c44acb9b79';

/** Matches GitHub Actions’ architecture so local Docker captures match CI. */
export const PLAYWRIGHT_VISUAL_PLATFORM = 'linux/amd64';

/** Browsers baked into {@link PLAYWRIGHT_VISUAL_IMAGE}. */
export const PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';

export function visualPackageRoot(fromScriptUrl: string): string {
	return path.resolve(path.dirname(fileURLToPath(fromScriptUrl)), '..');
}

export function visualRepoRootFromPackage(packageRoot: string): string {
	return path.resolve(packageRoot, '../../..');
}
