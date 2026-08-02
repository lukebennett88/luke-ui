import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { findComponentDocContractIssues } from './component-doc-contract.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}

	testDirectories.length = 0;
});

test('accepts a focused component-doc scaffold without placeholder prose', () => {
	const docsDir = createDocsFixture({
		guide: `---
title: Status Badge
---

<ExampleBlock src="status-badge/basic" title="Status Badge — Basic" />
`,
		props: `---
title: Status Badge
---

## Props
`,
	});

	expect(findComponentDocContractIssues({ docsDir })).toEqual([]);
});

test('reports metadata drift, placeholders, and the wrong primary example', () => {
	const docsDir = createDocsFixture({
		guide: `---
title: Status Badge
description: Status Badge component.
---

\`StatusBadge\` from \`@luke-ui/react/status-badge\`.

<ExampleBlock src="status-badge/tones" title="Status Badge — Tones" />

TODO: Describe accessibility considerations.
`,
		props: `---
title: Badge
description: Badge component.
---
`,
	});

	expect(findComponentDocContractIssues({ docsDir })).toEqual([
		'status-badge: guide and Props titles must match',
		'status-badge: guide and Props descriptions must match',
		'status-badge/index.mdx: replace the generic component description',
		'status-badge/index.mdx: remove the generator TODO',
		'status-badge/index.mdx: remove the accessibility placeholder',
		'status-badge/index.mdx: remove the package-path placeholder',
		'status-badge/props.mdx: replace the generic component description',
		'status-badge/index.mdx: primary example must use status-badge/basic',
	]);
});

test('finds no component-doc contract issues in the docs app', () => {
	expect(
		findComponentDocContractIssues({
			docsDir: resolve(import.meta.dirname, '../../content/docs/components'),
		}),
	).toEqual([]);
});

function createDocsFixture({ guide, props }: { guide: string; props: string }): string {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-component-doc-contract-'));
	testDirectories.push(directory);

	const docsDir = join(directory, 'components');
	const componentDir = join(docsDir, 'status-badge');
	mkdirSync(componentDir, { recursive: true });
	writeFileSync(join(componentDir, 'index.mdx'), guide);
	writeFileSync(join(componentDir, 'props.mdx'), props);

	return docsDir;
}
