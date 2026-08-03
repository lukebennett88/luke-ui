import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface NetlifyRedirect {
	from: string;
	to: string;
}

/**
 * Parses the `[[redirects]]` blocks out of a `netlify.toml` file. Only understands the flat
 * `from`/`to`/`status` string and number fields this project's redirect table uses — not a
 * general-purpose TOML parser.
 */
export function parseNetlifyRedirects(source: string): Array<NetlifyRedirect> {
	const redirects: Array<NetlifyRedirect> = [];
	const blocks = source.split(/^\[\[redirects\]\]\s*$/m).slice(1);

	for (const block of blocks) {
		const from = block.match(/^from\s*=\s*"([^"]*)"/m)?.[1];
		const to = block.match(/^to\s*=\s*"([^"]*)"/m)?.[1];
		if (from !== undefined && to !== undefined) redirects.push({ from, to });
	}

	return redirects;
}

/**
 * Every docs page URL under `docsDir`, mirroring how Fumadocs derives a page's URL from its file
 * path: the `.mdx` extension is dropped, and an `index.mdx` resolves to its folder's own path (the
 * docs root's `index.mdx` resolves to `/`).
 */
export function getDocsPagePaths(docsDir: string): Set<string> {
	const paths = new Set<string>();

	function walk(dir: string) {
		for (const entry of readdirSync(dir)) {
			const entryPath = join(dir, entry);
			if (statSync(entryPath).isDirectory()) {
				walk(entryPath);
				continue;
			}
			if (!entry.endsWith('.mdx')) continue;

			const relativePath = relative(docsDir, entryPath).replaceAll('\\', '/');
			paths.add(getDocsPagePath(relativePath));
		}
	}

	walk(docsDir);
	return paths;
}

/**
 * The URL a docs `.mdx` file resolves to, given its path relative to the docs directory: the
 * extension is dropped, and an `index` file resolves to its folder's own path (a root `index.mdx`
 * resolves to `/`).
 */
function getDocsPagePath(relativePath: string): string {
	const withoutExtension = relativePath.slice(0, -'.mdx'.length);
	if (withoutExtension === 'index') return '/';
	const pagePath = withoutExtension.endsWith('/index')
		? withoutExtension.slice(0, -'/index'.length)
		: withoutExtension;
	return `/${pagePath}`;
}

/**
 * Checks that every path in `removedPaths` has a redirect whose destination resolves to a page
 * that still exists. Returns a human-readable issue per failure, or `[]` when the table is
 * complete and accurate.
 */
export function findRedirectIssues({
	removedPaths,
	redirects,
	existingPagePaths,
}: {
	existingPagePaths: Set<string>;
	redirects: Array<NetlifyRedirect>;
	removedPaths: Array<string>;
}): Array<string> {
	const issues: Array<string> = [];
	const byFrom = new Map(redirects.map((redirect) => [redirect.from, redirect]));

	for (const path of removedPaths) {
		const redirect = byFrom.get(path);
		if (!redirect) {
			issues.push(`${path}: no redirect rule found`);
			continue;
		}
		if (!existingPagePaths.has(redirect.to)) {
			issues.push(`${path}: redirect destination "${redirect.to}" does not resolve to a page`);
		}
	}

	return issues;
}
