import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Artefact locations, kept in step with
 * `packages/@luke-ui/react/scripts/visual-regression-contract.ts`.
 */
export const VISUAL_BASELINE_DIR = '.artifacts/visual-regression/baseline';
export const VISUAL_SUMMARY_FILE = '.artifacts/visual-regression/summary.json';

/**
 * The repo root, derived from this file rather than `process.cwd()`. The
 * workflows invoke these scripts through `pnpm --filter`, which runs them with
 * the package directory as the cwd, so a relative artefact path would otherwise
 * resolve inside `.github/scripts`.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function fromRepoRoot(relativePath: string): string {
	return path.join(repoRoot, ...relativePath.split('/'));
}
