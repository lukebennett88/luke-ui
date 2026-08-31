import { existsSync, readdirSync, rmdirSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const GENERATOR_OWNED_FILES: ReadonlyArray<string> = ['props.mdx', 'meta.json'];

/**
 * Removes stale output from the retired `generate-props-pages` script. Those files were
 * gitignored, so an existing checkout can still have `content/docs/components/<group>/<name>/
 * props.mdx` and `meta.json` on disk after switching to a branch that no longer generates them —
 * Fumadocs would keep discovering them and the old `/components/<group>/<name>/props` routes
 * would survive locally.
 *
 * Only ever deletes `props.mdx` and `meta.json` exactly two levels under `componentsDir`
 * (`<group>/<component>/`), and only removes the component directory once it is empty. Never
 * touches the authored `<group>/<component>.mdx` guides or the group-level `<group>/meta.json`
 * files one level up. No-ops silently when `componentsDir` or a group subdirectory does not
 * exist.
 */
export function cleanGeneratedPropsPages(componentsDir: string): {
	removedCount: number;
} {
	let removedCount = 0;
	if (!existsSync(componentsDir)) return { removedCount };

	for (const group of readdirSync(componentsDir, { withFileTypes: true })) {
		if (!group.isDirectory()) continue;
		const groupDir = resolve(componentsDir, group.name);

		for (const component of readdirSync(groupDir, { withFileTypes: true })) {
			if (!component.isDirectory()) continue;
			const componentDir = resolve(groupDir, component.name);
			removedCount += removeGeneratorOwnedFiles(componentDir);
			removeDirIfEmpty(componentDir);
		}
	}

	return { removedCount };
}

/** Removes only the generator-owned files in `componentDir`, leaving anything else untouched. */
function removeGeneratorOwnedFiles(componentDir: string): number {
	let removedCount = 0;
	for (const filename of GENERATOR_OWNED_FILES) {
		const filepath = resolve(componentDir, filename);
		if (!existsSync(filepath)) continue;
		if (!statSync(filepath).isFile()) continue;
		rmSync(filepath);
		removedCount++;
	}
	return removedCount;
}

/** Removes the component output directory only when it is now empty. */
function removeDirIfEmpty(dirPath: string): void {
	if (!existsSync(dirPath)) return;
	if (readdirSync(dirPath).length > 0) return;
	rmdirSync(dirPath);
}
