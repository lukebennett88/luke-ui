import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import type { DocsCheckPaths } from '../../scripts/check-docs.js';
import {
	diffAgainstBaseline,
	findDocsIssues,
	markdownH2s,
	readBaseline,
} from '../../scripts/check-docs.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}
	testDirectories.length = 0;
});

test('accepts a component guide and authored guide that follow the heading contract', () => {
	const paths = createDocsFixture({
		authored: {
			'installation.mdx': `---
title: Installation
---

Install Luke UI.

## Install the package

Run the install command.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
		components: {
			'actions/button.mdx': `---
title: Button
source: packages/@luke-ui/react/src/exports/button.ts
---

<ExampleBlock src="button/basic" title="Button — Basic" />

## Best practices

Use Button for actions.

## Size

Medium is the default.

## Accessibility

The visible label is the accessible name.

## Related components

Use Link for navigation.
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([]);
});

test('reports heading vocabulary, order, and required Accessibility issues', () => {
	const paths = createDocsFixture({
		components: {
			'actions/button.mdx': `---
title: Button
source: packages/@luke-ui/react/src/exports/button.ts
---

<ExampleBlock src="button/basic" title="Button — Basic" />

## Size

Medium is the default.

## Primitive

Use the button primitive.

## Best practices

Use Button for actions.
`,
			'visuals/icon.mdx': `---
title: Icon
source: packages/@luke-ui/react/src/exports/icon.ts
---

<ExampleBlock src="icon/basic" title="Icon — Basic" />

## Anatomy

Icons reference the spritesheet.
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'actions/button.mdx: heading "Primitive" is not allowed (use "Related components")',
		'actions/button.mdx: "Best practices" must come before feature sections',
		'actions/button.mdx: missing required "Accessibility" heading',
		'visuals/icon.mdx: "Anatomy" is only allowed on primitive guides',
	]);
});

test('requires Continue learning with Cards on authored guides', () => {
	const paths = createDocsFixture({
		authored: {
			'styling.mdx': `---
title: Styling
---

## Choose a styling approach

Use component props first.

## Next steps

Read the colour guide.
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'docs/styling.mdx: last H2 must be "Continue learning" with <Cards>',
	]);
});

test('reports an example referenced from two pages', () => {
	const paths = createDocsFixture({
		authored: {
			'layout.mdx': `---
title: Layout
---

<ExampleBlock src="box/responsive-layout" title="Layout — Responsive values" />

## Continue learning

<Cards>
	<Card href="/components/layout/box" title="Box">
		See the Box guide.
	</Card>
</Cards>
`,
		},
		components: {
			'layout/box.mdx': `---
title: Box
source: packages/@luke-ui/react/src/exports/box.ts
---

<ExampleBlock src="box/basic" title="Box — Basic" />

<ExampleBlock src="box/responsive-layout" title="Box — Responsive layout" />
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'box/responsive-layout: referenced from more than one page (components/layout/box.mdx, docs/layout.mdx)',
	]);
});

test('does not report a shared-example issue for a page referencing the same example twice', () => {
	const paths = createDocsFixture({
		components: {
			'layout/box.mdx': `---
title: Box
source: packages/@luke-ui/react/src/exports/box.ts
---

<ExampleBlock src="box/basic" title="Box — Basic" />

<ExampleBlock src="box/basic" title="Box — Basic again" />
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([]);
});

test('does not report banned terms found only in JSX/MDX attribute values', () => {
	const paths = createDocsFixture({
		authored: {
			'attributes.mdx': `---
title: Attributes
---

<Card href="/docs/users" title="Team">
	Invite people to the workspace.
</Card>

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/attributes.mdx: terminology "people"']);
});

test('strips multi-line tags and expression attributes without fusing surrounding words', () => {
	const paths = createDocsFixture({
		authored: {
			'settings.mdx': `---
title: Settings
---

<ExampleBlock
	src="settings/basic"
	title="Settings — Basic"
	mode={{ a: 'b' }}
	start={1}
/>

Configure the workspace before you invite people to it.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/settings.mdx: terminology "people"']);
});

test('does not swallow prose past an unclosed angle bracket followed by a blank line', () => {
	const paths = createDocsFixture({
		authored: {
			'sizes.mdx': `---
title: Sizes
---

Some values <b times larger than others look odd in a table.

Invite people to review the sizing scale.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/sizes.mdx: terminology "people"']);
});

test('strips MDX expressions but still reports banned terms in prose and JSX child text', () => {
	const paths = createDocsFixture({
		authored: {
			'expressions.mdx': `---
title: Expressions
---

{users.map((user) => (
	<Card key={user.id} />
))}

Invite people to explore the workspace.

<Card title="Team">Ping people when the invite goes out.</Card>

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/expressions.mdx: terminology "people"']);
});

test('strips multi-line import and export statements in full', () => {
	const paths = createDocsFixture({
		authored: {
			'imports.mdx': `---
title: Imports
---

import {
	users,
	somethingElse,
} from './data';

export {
	users,
	somethingElse,
};

Invite people to configure the settings.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/imports.mdx: terminology "people"']);
});

test('does not swallow prose past an unbalanced brace followed by a blank line', () => {
	const paths = createDocsFixture({
		authored: {
			'braces.mdx': `---
title: Braces
---

This uses a { placeholder that never closes properly here.

Invite people to review the wording.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/braces.mdx: terminology "people"']);
});

test('ignores escaped quotes and backticks in MDX expressions', () => {
	const paths = createDocsFixture({
		authored: {
			'expressions-with-escapes.mdx': `---
title: Expressions with escapes
---

{format("Invite people to use an escaped \\"quote\\"")}

{format(\`Invite people to use an escaped \\\`backtick\\\`\`)}

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([]);
});

test('does not swallow prose after imports with escaped delimiters', () => {
	const paths = createDocsFixture({
		authored: {
			'imports-with-escapes.mdx': `---
title: Imports with escapes
---

import quotePath from './people\\'s-guide';
import backtickPath from \`./people\\\`s-guide\`;

Invite people to configure the settings.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/imports-with-escapes.mdx: terminology "people"']);
});

test('does not swallow prose after an unterminated import string', () => {
	const paths = createDocsFixture({
		authored: {
			'unterminated-import.mdx': `---
title: Unterminated import
---

import source from './docs

Invite people to configure the settings.

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual(['docs/unterminated-import.mdx: terminology "people"']);
});

test('reports prose patterns outside code and ignores them inside fences', () => {
	const paths = createDocsFixture({
		authored: {
			'color.mdx': `---
title: Colour
---

import { TokenExplorer } from './token-explorer';

This is useful; do not keep the semicolon.

We document the system for users.

Write foo—bar without spaces around the dash.

A wrapped dash is fine —
on the next line.

\`\`\`tsx
const users = ['we', 'us'];
const note = 'simply; note that';
\`\`\`

## Continue learning

<Cards>
	<Card href="/docs/styling" title="Styling">
		Choose a styling approach.
	</Card>
</Cards>
`,
		},
		internal: {
			'TESTING.md': `# Testing

An assertion should fail if an intention we own is not met.

\`\`\`ts
const users = true;
\`\`\`
`,
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'docs/color.mdx: prose semicolon',
		'docs/color.mdx: unspaced em dash',
		'docs/color.mdx: first-person "we"',
		'docs/color.mdx: terminology "users"',
		'docs/TESTING.md: first-person "we"',
	]);
});

test('diffAgainstBaseline reports extra and stale entries', () => {
	expect(diffAgainstBaseline(['keep', 'new'], ['keep', 'fixed'])).toEqual({
		extra: ['new'],
		stale: ['fixed'],
	});
});

test('markdownH2s ignores headings inside fenced code', () => {
	expect(
		markdownH2s(`## Size

\`\`\`md
## Primitive
\`\`\`

## Accessibility
`),
	).toEqual(['Size', 'Accessibility']);
});

test('finds no extra docs issues in the docs app beyond the baseline', () => {
	const issues = findDocsIssues();
	const baseline = readBaseline();
	expect(diffAgainstBaseline(issues, baseline)).toEqual({ extra: [], stale: [] });
});

const INVENTORY_GUIDE = `---
title: Button
source: packages/@luke-ui/react/src/exports/button.ts
---

<ExampleBlock src="button/basic" title="Button — Basic" />

## Accessibility

The visible label is the accessible name.
`;

function inventoryFixture(overrides: {
	components?: Record<string, string>;
	metadata?: Record<string, unknown>;
	packageExports?: ReadonlyArray<string>;
	sourceDirs?: ReadonlyArray<string>;
}): DocsCheckPaths {
	return createDocsFixture({
		components: overrides.components ?? { 'actions/button.mdx': INVENTORY_GUIDE },
		metadata: overrides.metadata ?? {
			'actions/meta.json': { pages: ['button'], title: 'Actions' },
			'meta.json': { pages: ['---Actions---', 'actions/button'], root: true, title: 'Components' },
		},
		packageExports: overrides.packageExports ?? ['./button'],
		sourceDirs: overrides.sourceDirs ?? ['button'],
	});
}

test('accepts a guide that the root and category metadata both list', () => {
	expect(findDocsIssues(inventoryFixture({}))).toEqual([]);
});

test('reports a guide that is absent from the root component metadata', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: [], title: 'Actions' },
			'meta.json': { pages: ['---Actions---'], root: true, title: 'Components' },
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/button.mdx: guide is absent from the root component metadata (expected entry "actions/button")',
	]);
});

test('validates category metadata for root entries before the first separator', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: ['button'], title: 'Actions' },
			'meta.json': {
				pages: ['actions/button', '---Actions---'],
				root: true,
				title: 'Components',
			},
		},
	});

	expect(findDocsIssues(paths)).toEqual([]);
});

test('reports stale category metadata when the root category disappears', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: ['button'], title: 'Actions' },
			'meta.json': { pages: [], root: true, title: 'Components' },
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/button.mdx: guide is absent from the root component metadata (expected entry "actions/button")',
		'component-guide-inventory: actions/meta.json: pages [button] do not match the root metadata (expected [])',
	]);
});

test('reports leftover category metadata when no guide remains in that category', () => {
	const paths = inventoryFixture({
		components: {},
		metadata: {
			'actions/meta.json': { pages: ['button'], title: 'Actions' },
			'meta.json': { pages: [], root: true, title: 'Components' },
		},
		packageExports: [],
		sourceDirs: [],
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/meta.json: pages [button] do not match the root metadata (expected [])',
	]);
});

test('reports a root metadata entry that has no guide', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: ['button', 'link'], title: 'Actions' },
			'meta.json': {
				pages: ['---Actions---', 'actions/button', 'actions/link'],
				root: true,
				title: 'Components',
			},
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: components/meta.json: entry "actions/link" has no guide (expected actions/link.mdx)',
	]);
});

test('reports a repeated root metadata entry', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: ['button', 'button'], title: 'Actions' },
			'meta.json': {
				pages: ['---Actions---', 'actions/button', 'actions/button'],
				root: true,
				title: 'Components',
			},
		},
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: components/meta.json: entry "actions/button" is repeated',
	]);
});

test('reports category metadata that does not match the root metadata', () => {
	const paths = inventoryFixture({
		metadata: {
			'actions/meta.json': { pages: ['link', 'button'], title: 'Actions' },
			'meta.json': {
				pages: ['---Actions---', 'actions/button', 'actions/link'],
				root: true,
				title: 'Components',
			},
		},
		components: {
			'actions/button.mdx': INVENTORY_GUIDE,
			'actions/link.mdx': `---
title: Link
source: packages/@luke-ui/react/src/exports/link.ts
---

<ExampleBlock src="link/basic" title="Link — Basic" />

## Accessibility

The visible label is the accessible name.
`,
		},
		packageExports: ['./button', './link'],
		sourceDirs: ['button', 'link'],
	});

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/meta.json: pages [link, button] do not match the root metadata (expected [button, link])',
	]);
});

test('reports a guide source that is not a public package entry point', () => {
	const paths = inventoryFixture({ packageExports: ['./link'] });

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/button.mdx: source "packages/@luke-ui/react/src/exports/button.ts" is not a public package entry point (expected export "./button" in @luke-ui/react)',
	]);
});

test('reports a missing exports module', () => {
	const paths = inventoryFixture({ sourceDirs: [] });

	expect(findDocsIssues(paths)).toEqual([
		'component-guide-inventory: actions/button.mdx: source "packages/@luke-ui/react/src/exports/button.ts" does not exist',
	]);
});

function createDocsFixture(input: {
	authored?: Record<string, string>;
	components?: Record<string, string>;
	internal?: Record<string, string>;
	/** Root and category `meta.json` files, keyed by their path under the components directory. */
	metadata?: Record<string, unknown>;
	/** Export keys for the fake `@luke-ui/react` manifest. */
	packageExports?: ReadonlyArray<string>;
	/** Subpaths under the fake package `src/exports` that get a `.ts` module. */
	sourceDirs?: ReadonlyArray<string>;
}): DocsCheckPaths {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-check-docs-'));
	testDirectories.push(directory);

	const contentDir = join(directory, 'content');
	const componentsDir = join(contentDir, 'components');
	const authoredDocsDir = join(contentDir, 'docs');
	const internalDocsDir = join(directory, 'internal-docs');
	const reactPackageDir = join(directory, 'react-package');
	mkdirSync(componentsDir, { recursive: true });
	mkdirSync(authoredDocsDir, { recursive: true });
	mkdirSync(internalDocsDir, { recursive: true });
	mkdirSync(reactPackageDir, { recursive: true });

	writeGuides(componentsDir, input.components ?? {});
	writeGuides(authoredDocsDir, input.authored ?? {});
	for (const [name, contents] of Object.entries(input.internal ?? {})) {
		writeFileSync(join(internalDocsDir, name), contents);
	}

	const guidePaths = Object.keys(input.components ?? {});
	for (const [relativePath, contents] of Object.entries(
		input.metadata ?? defaultMetadata(guidePaths),
	)) {
		const path = join(componentsDir, relativePath);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, JSON.stringify(contents));
	}

	const guideSources = guidePaths.map((path) => guideSourceSubpath(input.components?.[path] ?? ''));
	const exports = Object.fromEntries(
		(input.packageExports ?? guideSources.map((subpath) => `./${subpath}`)).map((key) => [
			key,
			`./dist${key.slice(1)}/index.js`,
		]),
	);
	const reactPackageJsonPath = join(reactPackageDir, 'package.json');
	writeFileSync(reactPackageJsonPath, JSON.stringify({ exports, name: '@luke-ui/react' }));

	for (const subpath of input.sourceDirs ?? guideSources) {
		const sourcePath = join(reactPackageDir, 'src', 'exports', `${subpath}.ts`);
		mkdirSync(join(sourcePath, '..'), { recursive: true });
		writeFileSync(sourcePath, 'export {};\n');
	}

	return {
		authoredDocsDir,
		componentsDir,
		contentDir,
		internalDocsDir,
		reactPackageDir,
		reactPackageJsonPath,
	};
}

function writeGuides(root: string, files: Record<string, string>): void {
	for (const [relativePath, contents] of Object.entries(files)) {
		const path = join(root, relativePath);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, contents);
	}
}

/** Root and category metadata that lists exactly the guides a fixture wrote, in that order. */
function defaultMetadata(guidePaths: ReadonlyArray<string>): Record<string, unknown> {
	const slugs = guidePaths.map((path) => path.replace(/\.mdx$/, ''));
	const groups = [...new Set(slugs.map((slug) => slug.split('/')[0] ?? ''))];
	const metadata: Record<string, unknown> = {};

	for (const group of groups) {
		metadata[`${group}/meta.json`] = {
			pages: slugs
				.filter((slug) => slug.startsWith(`${group}/`))
				.map((slug) => slug.slice(group.length + 1)),
			title: group,
		};
	}

	metadata['meta.json'] = {
		pages: groups.flatMap((group) => [
			`---${group}---`,
			...slugs.filter((slug) => slug.startsWith(`${group}/`)),
		]),
		root: true,
		title: 'Components',
	};

	return metadata;
}

function guideSourceSubpath(contents: string): string {
	const source = contents.match(/^source:\s*(.+)$/m)?.[1]?.trim() ?? '';
	return source.replace('packages/@luke-ui/react/src/exports/', '').replace(/\.ts$/, '');
}
