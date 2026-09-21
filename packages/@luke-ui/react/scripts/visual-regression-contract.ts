import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VISUAL_ARTIFACTS_DIR = '.artifacts/visual-regression';
/** Baseline captures downloaded from the latest `main` baseline artefact. */
export const VISUAL_BASELINE_DIR = `${VISUAL_ARTIFACTS_DIR}/baseline`;
/** Captures rendered from the working tree. */
export const VISUAL_CURRENT_DIR = `${VISUAL_ARTIFACTS_DIR}/current`;
/** Expected, actual, and diff PNGs for every capture that is not unchanged. */
export const VISUAL_DIFF_DIR = `${VISUAL_ARTIFACTS_DIR}/diff`;
export const VISUAL_SUMMARY_FILE = `${VISUAL_ARTIFACTS_DIR}/summary.json`;

export const VISUAL_CAPTURE_DIR_ENV = 'VISUAL_CAPTURE_DIR';
export const VISUAL_CAPTURE_FALLBACK_DIR = '.visual-captures';

export function visualPackageRoot(fromScriptUrl: string): string {
	return path.resolve(path.dirname(fileURLToPath(fromScriptUrl)), '..');
}

export function visualRepoRootFromPackage(packageRoot: string): string {
	return path.resolve(packageRoot, '../../..');
}
