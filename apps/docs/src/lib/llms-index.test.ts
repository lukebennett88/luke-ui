import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vite-plus/test';
import { findMdxFiles } from './docs-mdx-files.js';
import type { LlmsIndexPage } from './llms-index.js';
import { buildLlmsIndex, parseMetaGroups } from './llms-index.js';

const LIST_LINE_PATTERN = /^- \[[^\]]+]\(https?:\/\/[^)]+\)(: .+)?$/;

const contentDocsDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../content/docs');
const componentsDir = resolve(contentDocsDir, 'components');

test('opens with exactly one H1 on line 1 and a blockquote on line 3', () => {
	const body = buildLlmsIndex({
		intro: 'An example summary.',
		origin: 'https://luke-ui.netlify.app',
		sections: [
			{
				pages: [{ description: 'Install it.', markdownUrl: 'https://x/a.md', title: 'A' }],
				title: 'Overview',
			},
		],
	});
	const lines = body.split('\n');

	expect(lines[0]).toBe('# Luke UI');
	expect(lines[2]).toBe('> An example summary.');
	expect(body.split('\n').filter((line) => line.startsWith('# '))).toEqual(['# Luke UI']);
});

test('every H2 section body is only Markdown list lines', () => {
	const body = buildLlmsIndex({
		intro: 'An example summary.',
		origin: 'https://luke-ui.netlify.app',
		sections: [
			{
				pages: [
					{
						description: 'Install Luke UI.',
						markdownUrl: 'https://x/install.md',
						title: 'Install',
					},
					{ description: '', markdownUrl: 'https://x/bare.md', title: 'Bare' },
				],
				title: 'Overview',
			},
			{
				pages: [{ description: 'A button.', markdownUrl: 'https://x/button.md', title: 'Button' }],
				title: 'Components',
			},
			{
				pages: [{ description: 'A button.', markdownUrl: 'https://x/button.md', title: 'Button' }],
				title: 'Components: Actions',
			},
		],
	});

	const sections = splitSections(body);
	expect(Object.keys(sections)).toEqual([
		'Overview',
		'Components',
		'Components: Actions',
		'Optional',
	]);

	for (const [title, sectionLines] of Object.entries(sections)) {
		if (title === 'Optional') continue;
		for (const line of sectionLines) {
			expect(line).toMatch(LIST_LINE_PATTERN);
		}
	}
});

test('omits an empty section entirely', () => {
	const body = buildLlmsIndex({
		intro: 'An example summary.',
		origin: 'https://luke-ui.netlify.app',
		sections: [
			{ pages: [], title: 'Empty group' },
			{
				pages: [{ description: 'x', markdownUrl: 'https://x/a.md', title: 'A' }],
				title: 'Overview',
			},
		],
	});

	expect(body).not.toContain('## Empty group');
	expect(body).toContain('## Overview');
});

test('ends with an Optional section linking the full documentation', () => {
	const body = buildLlmsIndex({
		intro: 'An example summary.',
		origin: 'https://luke-ui.netlify.app',
		sections: [],
	});

	const lines = body.trimEnd().split('\n');
	const optionalIndex = lines.indexOf('## Optional');
	expect(optionalIndex).toBeGreaterThan(-1);
	expect(lines.slice(optionalIndex)).toEqual([
		'## Optional',
		'',
		'- [Full documentation](https://luke-ui.netlify.app/llms-full.txt)',
	]);
	expect(lines.at(-1)).toBe('- [Full documentation](https://luke-ui.netlify.app/llms-full.txt)');
});

test('parses meta.json separators into ordered groups, dropping the separators', () => {
	const groups = parseMetaGroups([
		'---Overview---',
		'installation',
		'---Foundations---',
		'composition',
		'styling',
	]);

	expect(groups).toEqual([
		{ slugs: ['installation'], title: 'Overview' },
		{ slugs: ['composition', 'styling'], title: 'Foundations' },
	]);
});

test('the docs and component meta.json groups, resolved the way the /llms.txt route resolves them, include every authored guide', () => {
	const docsGroups = parseMetaGroups(readMetaPages(resolve(contentDocsDir, 'docs/meta.json')));
	const componentGroups = parseMetaGroups(
		readMetaPages(resolve(contentDocsDir, 'components/meta.json')),
	);

	const docsSlugs = new Set(docsGroups.flatMap((group) => group.slugs));
	const componentSlugs = new Set(componentGroups.flatMap((group) => group.slugs));

	// Every docs guide (content/docs/docs/*.mdx) is listed in some docs meta.json group.
	for (const file of findMdxFiles(resolve(contentDocsDir, 'docs'))) {
		const slug = file
			.slice(resolve(contentDocsDir, 'docs').length + 1)
			.replace(/\.mdx$/, '')
			.split('\\')
			.join('/');
		expect(docsSlugs.has(slug)).toBe(true);
	}

	// Every component guide (content/docs/components/<group>/<name>.mdx), except the catalogue
	// index, is listed in some component meta.json group.
	for (const file of findMdxFiles(componentsDir)) {
		if (file === resolve(componentsDir, 'index.mdx')) continue;
		const slug = file
			.slice(componentsDir.length + 1)
			.replace(/\.mdx$/, '')
			.split('\\')
			.join('/');
		expect(componentSlugs.has(slug)).toBe(true);
	}

	// Rendering those slugs as pages produces only list lines under their group headings, and the
	// component groups are named "Components: <group>" per the llms.txt spec used here.
	const sections = [
		...docsGroups.map((group) => ({ pages: pagesFor(group.slugs), title: group.title })),
		...componentGroups.map((group) => ({
			pages: pagesFor(group.slugs),
			title: `Components: ${group.title}`,
		})),
	];
	const body = buildLlmsIndex({
		intro: 'Summary.',
		origin: 'https://luke-ui.netlify.app',
		sections,
	});

	for (const group of componentGroups) {
		expect(body).toContain(`## Components: ${group.title}`);
	}
});

function pagesFor(slugs: ReadonlyArray<string>): Array<LlmsIndexPage> {
	return slugs.map((slug) => ({
		description: '',
		markdownUrl: `https://luke-ui.netlify.app/${slug}.md`,
		title: slug,
	}));
}

function splitSections(body: string): Record<string, Array<string>> {
	const sections: Record<string, Array<string>> = {};
	let current: string | undefined;

	for (const line of body.split('\n')) {
		if (line.startsWith('## ')) {
			current = line.slice(3);
			sections[current] = [];
			continue;
		}
		if (current === undefined) continue;
		if (line.trim().length === 0) continue;
		sections[current]?.push(line);
	}

	return sections;
}

function readMetaPages(metaPath: string): Array<string> {
	const parsed: unknown = JSON.parse(readFileSync(metaPath, 'utf8'));
	if (typeof parsed !== 'object' || parsed === null) return [];
	const pages = (parsed as { pages?: unknown }).pages;
	if (!Array.isArray(pages)) return [];
	return pages.filter((page): page is string => typeof page === 'string');
}
