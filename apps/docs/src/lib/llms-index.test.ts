import { expect, test } from 'vite-plus/test';
import { buildLlmsIndex, parseMetaGroups } from './llms-index.js';

const LIST_LINE_PATTERN = /^- \[[^\]]+]\(https?:\/\/[^)]+\)(: .+)?$/;

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
				title: 'Components: Actions',
			},
		],
	});

	const sections = splitSections(body);
	expect(Object.keys(sections)).toEqual(['Overview', 'Components: Actions', 'Optional']);

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
