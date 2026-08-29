import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { generatePropsPages, renderPropsPage } from '../../scripts/generate-props-pages.js';
import { parseComponentFrontmatter } from './docs-frontmatter.js';

test('renders a single-entry Props page without a type heading', () => {
	const frontmatter = parseComponentFrontmatter(`---
title: Button
description: A labelled control for actions in an interface.
source: packages/@luke-ui/react/src/exports/button.ts
reactAria: https://react-spectrum.adobe.com/react-aria/Button.html
props:
  - name: ButtonProps
    path: packages/@luke-ui/react/src/core/button/button.tsx
---
`);

	const page = renderPropsPage(frontmatter);
	expect(page).toContain('## Props');
	expect(page).not.toContain('### ');
	expect(page).toContain('name="ButtonProps"');
	expect(page).toContain('path="packages/@luke-ui/react/src/core/button/button.tsx"');
	expect(page).toContain('<component-props-table');
	expect(page).toContain('source: packages/@luke-ui/react/src/exports/button.ts');
	expect(page).not.toContain('props:');
});

test('renders the native props note only for DOM-forwarding types on multi-entry pages', () => {
	const frontmatter = parseComponentFrontmatter(`---
title: Heading
props:
  - name: HeadingProps
    path: packages/@luke-ui/react/src/core/heading/heading.tsx
  - name: HeadingLevelsProps
    path: packages/@luke-ui/react/src/core/heading/heading-context.tsx
---
`);

	const page = renderPropsPage(
		frontmatter,
		new Map([
			['HeadingProps', true],
			['HeadingLevelsProps', false],
		]),
	);

	expect(page).toContain(
		'`HeadingProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
	expect(page).not.toContain(
		'`HeadingLevelsProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
});
test('renders a multi-entry Props page with a heading per entry', () => {
	const frontmatter = parseComponentFrontmatter(`---
title: Field primitive
description: Shared label, description, and validation parts for custom fields.
source: packages/@luke-ui/react/src/exports/primitives/field.ts
props:
  - name: FieldProps
    path: packages/@luke-ui/react/src/core/primitives/field/field.tsx
  - name: FieldLabelProps
    path: packages/@luke-ui/react/src/core/primitives/field/label.tsx
---
`);

	const page = renderPropsPage(frontmatter);
	expect(page).toContain('## Props');
	expect(page).toContain('### FieldProps');
	expect(page).toContain('### FieldLabelProps');
	expect(page).toContain('\tpath="packages/@luke-ui/react/src/core/primitives/field/field.tsx"');
	expect(page).toContain('name="FieldLabelProps"');
	expect(page.indexOf('### FieldProps')).toBeLessThan(page.indexOf('### FieldLabelProps'));
});

let scratchDir: string | undefined;

afterEach(() => {
	if (scratchDir !== undefined) rmSync(scratchDir, { force: true, recursive: true });
	scratchDir = undefined;
});

function writeScratchGuide(
	name: string,
	guideContents: string,
): {
	guidePath: string;
	metaPath: string;
	outputDir: string;
	propsPath: string;
	rootDir: string;
} {
	scratchDir ??= mkdtempSync(resolve(tmpdir(), 'luke-ui-props-'));
	const groupDir = resolve(scratchDir, 'actions');
	mkdirSync(groupDir, { recursive: true });
	const guidePath = resolve(groupDir, `${name}.mdx`);
	writeFileSync(guidePath, guideContents);
	const outputDir = resolve(groupDir, name);
	return {
		guidePath,
		metaPath: resolve(outputDir, 'meta.json'),
		outputDir,
		propsPath: resolve(outputDir, 'props.mdx'),
		rootDir: scratchDir,
	};
}

const SCRATCH_GUIDE = `---
title: Button
props:
  - name: ButtonProps
    path: packages/@luke-ui/react/src/core/button/button.tsx
---

Guide body.
`;

test('generates props.mdx and meta.json under <group>/<name>/ from the <group>/<name>.mdx guide', async () => {
	const { metaPath, outputDir, propsPath, rootDir } = writeScratchGuide('button', SCRATCH_GUIDE);

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 1, removedCount: 0 });
	expect(existsSync(propsPath)).toBe(true);
	expect(existsSync(metaPath)).toBe(true);
	expect(resolve(propsPath, '..')).toBe(outputDir);
	expect(JSON.parse(readFileSync(metaPath, 'utf8'))).toEqual({
		collapsible: false,
		pages: ['!props'],
		pagesIndex: '../button',
	});
});

test('removes generated output and the empty output directory once the guide is removed', async () => {
	const { guidePath, metaPath, outputDir, propsPath, rootDir } = writeScratchGuide(
		'button',
		SCRATCH_GUIDE,
	);

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 1, removedCount: 0 });
	expect(existsSync(outputDir)).toBe(true);

	// Deleting or renaming the guide must not leave an orphaned Props page behind. It would keep
	// serving stale content from a route that is gitignored, so review would never surface it.
	rmSync(guidePath);

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 0, removedCount: 2 });
	expect(existsSync(propsPath)).toBe(false);
	expect(existsSync(metaPath)).toBe(false);
	expect(existsSync(outputDir)).toBe(false);
});

test('removes generated output for the old name once a guide is renamed', async () => {
	const { guidePath, metaPath, outputDir, propsPath, rootDir } = writeScratchGuide(
		'button',
		SCRATCH_GUIDE,
	);

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 1, removedCount: 0 });

	renameSync(guidePath, resolve(rootDir, 'actions/icon-button.mdx'));

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 1, removedCount: 2 });
	expect(existsSync(propsPath)).toBe(false);
	expect(existsSync(metaPath)).toBe(false);
	expect(existsSync(outputDir)).toBe(false);
	expect(existsSync(resolve(rootDir, 'actions/icon-button/props.mdx'))).toBe(true);
});

test('leaves the output directory in place when it still holds files the generator does not own', async () => {
	const { outputDir, rootDir } = writeScratchGuide('button', SCRATCH_GUIDE);

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 1, removedCount: 0 });

	writeFileSync(resolve(outputDir, 'notes.txt'), 'kept by hand');
	rmSync(resolve(rootDir, 'actions/button.mdx'));

	expect(await generatePropsPages(rootDir)).toEqual({ componentCount: 0, removedCount: 2 });
	expect(existsSync(outputDir)).toBe(true);
	expect(existsSync(resolve(outputDir, 'notes.txt'))).toBe(true);
});
