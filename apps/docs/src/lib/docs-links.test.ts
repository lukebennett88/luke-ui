import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';

const contentDir = resolve(import.meta.dirname, '../../content/docs');

function findAllMdxFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) return findAllMdxFiles(path);
		return extname(entry.name) === '.mdx' ? [path] : [];
	});
}

function docsLinks(contents: string): Array<string> {
	const links: Array<string> = [];

	const hrefPattern = /\bhref\s*=\s*["']([^"']+)["']/g;
	for (const match of contents.matchAll(hrefPattern)) {
		const link = match[1];
		if (link !== undefined) links.push(link);
	}

	const markdownPattern = /\]\(([^)\s]+)\)/g;
	for (const match of contents.matchAll(markdownPattern)) {
		const link = match[1];
		if (link !== undefined) links.push(link);
	}

	return links
		.map((link) => link.split('#')[0])
		.filter((link): link is string => {
			return link !== undefined && link.startsWith('/') && !link.startsWith('//');
		});
}

function docsLinkTargetExists(pathname: string): boolean {
	const segments = pathname.split('/').filter((segment) => segment !== '');
	// `/` is the landing route, not an MDX page — no docs page links to it.
	if (segments.length === 0) return false;

	const base = resolve(contentDir, ...segments);
	return (
		existsSync(`${base}.mdx`) ||
		existsSync(resolve(base, 'index.mdx')) ||
		existsSync(resolve(base, 'props.mdx'))
	);
}

test('every internal link on the docs pages resolves', () => {
	for (const file of findAllMdxFiles(contentDir)) {
		const contents = readFileSync(file, 'utf8');

		for (const link of docsLinks(contents)) {
			expect(docsLinkTargetExists(link)).toBe(true);
		}
	}
});
