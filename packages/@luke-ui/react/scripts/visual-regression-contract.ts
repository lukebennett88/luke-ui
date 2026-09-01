import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VISUAL_LOCKFILE = 'pnpm-lock.yaml';

/** Marks a baseline worktree that can accept the current visual harness. */
export const VISUAL_HARNESS_LAYOUT_FILE = 'packages/@luke-ui/react/src/core/stylesheet.css.ts';

/** Files that shape how a capture renders. Hashed into the cache key and copied into compatible base worktrees. */
export const VISUAL_HARNESS_FILES = [
	'packages/@luke-ui/react/vitest.config.ts',
	'packages/@luke-ui/react/stylex-vite-plugin.ts',
	VISUAL_HARNESS_LAYOUT_FILE,
	'packages/@luke-ui/react/src/core/test-utils/render-setup.ts',
	'packages/@luke-ui/react/src/core/test-utils/render-mount-state.ts',
	'packages/@luke-ui/react/src/core/test-utils/render.tsx',
	'packages/@luke-ui/react/src/core/test-utils/visual-setup.ts',
] as const;

export const VISUAL_CACHE_HASH_FILES = [VISUAL_LOCKFILE, ...VISUAL_HARNESS_FILES];

export const VISUAL_ARTIFACTS_DIR = '.artifacts/visual-regression';
export const VISUAL_CACHE_DIR = `${VISUAL_ARTIFACTS_DIR}/cache`;
export const VISUAL_REPORT_DIR = `${VISUAL_ARTIFACTS_DIR}/report`;
export const VISUAL_REPORT_INDEX = `${VISUAL_REPORT_DIR}/index.html`;
export const VISUAL_SUMMARY_FILE = `${VISUAL_REPORT_DIR}/summary.json`;

export const VISUAL_CAPTURE_DIR_ENV = 'VISUAL_CAPTURE_DIR';
export const VISUAL_CAPTURE_FALLBACK_DIR = '.visual-captures';

export function visualPackageRoot(fromScriptUrl: string): string {
	return path.resolve(path.dirname(fileURLToPath(fromScriptUrl)), '..');
}

export function visualRepoRootFromPackage(packageRoot: string): string {
	return path.resolve(packageRoot, '../../..');
}

export function visualArtifactsRoot(repoRoot: string): string {
	return path.join(repoRoot, VISUAL_ARTIFACTS_DIR);
}

export function visualReportIndex(repoRoot: string): string {
	return path.join(repoRoot, ...VISUAL_REPORT_INDEX.split('/'));
}
