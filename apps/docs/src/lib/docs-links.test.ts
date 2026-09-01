import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { findMdxFiles } from './docs-mdx-files.js';
import { docsPageFile } from './markdown-page-path.js';

const contentDir = resolve(import.meta.dirname, '../../content/docs');

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

	return links.flatMap((link) => {
		const base = link.split('#')[0];
		if (base === undefined || !base.startsWith('/') || base.startsWith('//')) return [];

		return [base];
	});
}

test('every internal link on the docs pages resolves', () => {
	for (const file of findMdxFiles(contentDir)) {
		const contents = readFileSync(file, 'utf8');

		for (const link of docsLinks(contents)) {
			expect(docsPageFile(contentDir, link)).not.toBeNull();
		}
	}
});
