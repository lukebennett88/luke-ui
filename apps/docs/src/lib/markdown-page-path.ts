import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Markdown download path for a content-relative `.mdx` file. */
export function getMarkdownPagePath(relativePath: string): string {
	const withoutExtension = relativePath.slice(0, -'.mdx'.length);
	const pagePath = withoutExtension.endsWith('/index')
		? withoutExtension.slice(0, -'/index'.length)
		: withoutExtension;
	return `/${pagePath}.md`;
}

/** Markdown download path for a hosted docs page URL. `/` is `/index.md`. */
export function markdownUrlForPage(pageUrl: string): string {
	return `${pageUrl === '/' ? '/index' : pageUrl}.md`;
}

/** Fumadocs slugs for a `{$}.md` request. `/index.md` is the landing page. */
export function slugsFromMarkdownRequest(splat: string): Array<string> {
	const slugs = splat.split('/').filter(Boolean);
	if (slugs.length === 1 && slugs[0] === 'index') return [];
	return slugs;
}

/**
 * Resolves a docs pathname (`/components/actions/button`) to an MDX file under
 * `contentDir`, or `null` when none of the usual candidates exist.
 */
export function docsPageFile(contentDir: string, pathname: string): string | null {
	const segments = pathname.split('/').filter((segment) => segment !== '');
	if (segments.length === 0) return null;

	const base = resolve(contentDir, ...segments);
	const candidates = [`${base}.mdx`, resolve(base, 'index.mdx'), resolve(base, 'props.mdx')];
	return candidates.find((file) => existsSync(file)) ?? null;
}
