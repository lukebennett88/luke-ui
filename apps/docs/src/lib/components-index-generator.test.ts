import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { generateComponentsIndex } from '../../scripts/generate-components-index.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';

test('generates one runtime entry per component guide', () => {
	const reference = generateComponentsIndex();

	expect(reference).toContain("name: 'Button'");
	expect(reference).toContain("url: '/components/actions/button'");
	expect(reference).toContain("name: 'Visually Hidden'");
	expect(reference).toContain("url: '/components/primitives/visually-hidden'");
	expect(reference).toContain(
		'export const componentIndexGroups: ReadonlyArray<ComponentIndexGroup> = [',
	);
	expect(reference).toContain("title: 'Primitives',");
});

test('groups every entry by category in sidebar order', () => {
	expect(componentIndexGroups.map((group) => group.title)).toEqual([
		'Actions',
		'Feedback',
		'Forms',
		'Layout',
		'Typography',
		'Visuals',
		'Primitives',
	]);
});

test('emits the generated file on disk that the docs app imports', () => {
	const emitted = generateComponentsIndex();

	for (const group of componentIndexGroups) {
		for (const entry of group.entries) {
			expect(emitted).toContain(`url: '${entry.url}'`);
		}
	}

	const emittedPath = resolve(import.meta.dirname, '../generated/components-index.generated.ts');
	expect(readFileSync(emittedPath, 'utf8')).toBe(emitted);
});

test('excludes a topical page with no source frontmatter from the index', () => {
	const scratchDir = mkdtempSync(resolve(tmpdir(), 'components-index-'));

	try {
		writeFileSync(
			resolve(scratchDir, 'meta.json'),
			JSON.stringify({ pages: ['actions/button', 'forms/topic'] }),
		);

		mkdirSync(resolve(scratchDir, 'actions'), { recursive: true });
		writeFileSync(
			resolve(scratchDir, 'actions/button.mdx'),
			`---
title: Button
description: A labelled control for actions in an interface.
source: packages/example/src/button
---

Body.
`,
		);

		mkdirSync(resolve(scratchDir, 'forms'), { recursive: true });
		writeFileSync(
			resolve(scratchDir, 'forms/topic.mdx'),
			`---
title: Topic
description: A topical page with no source.
---

Body.
`,
		);

		const generated = generateComponentsIndex(scratchDir);

		expect(generated).toContain("url: '/components/actions/button'");
		expect(generated).toContain("name: 'Button'");
		expect(generated).not.toContain('/components/forms/topic');
		expect(generated).not.toContain("name: 'Topic'");
	} finally {
		rmSync(scratchDir, { force: true, recursive: true });
	}
});
