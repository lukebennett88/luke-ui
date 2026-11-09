import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VISUAL_ARTIFACTS_DIR = '.artifacts/visual-regression';
export const VISUAL_BASELINE_DIR = `${VISUAL_ARTIFACTS_DIR}/baseline`;
export const VISUAL_CURRENT_DIR = `${VISUAL_ARTIFACTS_DIR}/current`;
export const VISUAL_DIFF_DIR = `${VISUAL_ARTIFACTS_DIR}/diff`;
export const VISUAL_SUMMARY_FILE = `${VISUAL_ARTIFACTS_DIR}/summary.json`;

export const VISUAL_CAPTURE_DIR_ENV = 'VISUAL_CAPTURE_DIR';
export const VISUAL_CAPTURE_FALLBACK_DIR = '.visual-captures';

const PLAYWRIGHT_IMAGE_PATTERN = /^FROM\s+(\S+)$/m;

function readPlaywrightVisualImage(): string {
	const dockerfile = fileURLToPath(
		new URL('../../../../.github/visual-playwright/Dockerfile', import.meta.url),
	);
	const image = PLAYWRIGHT_IMAGE_PATTERN.exec(readFileSync(dockerfile, 'utf8'))?.[1];
	if (!image) throw new Error(`No FROM image found in ${dockerfile}.`);
	return image;
}

/**
 * Digest-pinned Playwright image declared in `.github/visual-playwright/Dockerfile`. Renovate
 * updates that file, so the visual workflows and local captures share one source.
 */
export const PLAYWRIGHT_VISUAL_IMAGE = readPlaywrightVisualImage();

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
