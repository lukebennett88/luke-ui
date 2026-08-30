import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import type { PropProject } from './component-prop-analysis.js';
import {
	filterGeneratedDoc,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
	renderNativePropsNote,
	typeForwardsDomProps,
	typeForwardsDomPropsForExport,
} from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
const generator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

async function loadDoc(path: string, name: string) {
	const [doc] = await generator.generateTypeTable({ path, name }, { basePath: repoRoot });
	const project = await import('fumadocs-typescript').then(({ createProject }) =>
		createProject({ tsconfigPath: resolve(repoRoot, 'apps/docs/tsconfig.json') }),
	);
	const declaration = loadExportedPropDeclaration(project as PropProject, repoRoot, path, name);
	if (doc === undefined || declaration === undefined) {
		throw new Error(`Missing documentation for ${name} in ${path}`);
	}
	return { declaration, doc };
}

async function visiblePropNames(path: string, name: string): Promise<Array<string>> {
	const { declaration, doc } = await loadDoc(path, name);
	return filterGeneratedDoc(doc, declaration, reactSrcDir).entries.map((entry) => entry.name);
}

test('keeps documented press props on Button while hiding generic DOM props', async () => {
	const names = await visiblePropNames(
		'packages/@luke-ui/react/src/core/button/button.tsx',
		'ButtonProps',
	);
	expect(names).toContain('onPress');
	expect(names).toContain('appearance');
	expect(names).not.toContain('onClick');
	expect(names).not.toContain('aria-label');
	expect(names.length).toBeLessThan(20);
});

test('keeps documented form and field props on TextField while hiding generic DOM props', async () => {
	const names = await visiblePropNames(
		'packages/@luke-ui/react/src/core/text-field/text-field.tsx',
		'TextFieldProps',
	);
	expect(names).toContain('label');
	expect(names).toContain('value');
	expect(names).toContain('onChange');
	expect(names).toContain('description');
	expect(names).not.toContain('onClick');
	expect(names).not.toContain('className');
	expect(names.length).toBeLessThan(20);
});

test('keeps the primitive button styling and press contract without generic DOM props', async () => {
	const names = await visiblePropNames(
		'packages/@luke-ui/react/src/core/primitives/button/button.tsx',
		'ButtonProps',
	);
	expect(names).toContain('appearance');
	expect(names).toContain('onPress');
	expect(names).not.toContain('onClick');
	expect(names).not.toContain('aria-controls');
});

test('keeps typography props on Heading while hiding generic DOM props', async () => {
	const names = await visiblePropNames(
		'packages/@luke-ui/react/src/core/heading/heading.tsx',
		'HeadingProps',
	);
	expect(names).toContain('level');
	expect(names).toContain('typography');
	expect(names).not.toContain('onClick');
	expect(names).not.toContain('aria-label');
	expect(names.length).toBeLessThan(20);
});

test('detects native DOM forwarding per exported prop type on multi-type pages', async () => {
	const project = await import('fumadocs-typescript').then(({ createProject }) =>
		createProject({ tsconfigPath: resolve(repoRoot, 'apps/docs/tsconfig.json') }),
	);

	expect(
		typeForwardsDomPropsForExport(
			project as PropProject,
			repoRoot,
			'packages/@luke-ui/react/src/core/heading/heading.tsx',
			'HeadingProps',
		),
	).toBe(true);
	expect(
		typeForwardsDomPropsForExport(
			project as PropProject,
			repoRoot,
			'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
			'HeadingLevelsProps',
		),
	).toBe(false);
	expect(
		typeForwardsDomPropsForExport(
			project as PropProject,
			repoRoot,
			'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
			'HeadingLevelsRenderProps',
		),
	).toBe(false);
});

test('renders the native props note with the exported type name', () => {
	expect(renderNativePropsNote('HeadingProps')).toBe(
		'`HeadingProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.\n\n',
	);
});

test('does not mark object-only provider props as DOM forwarding types', async () => {
	const { declaration } = await loadDoc(
		'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
		'HeadingLevelsRenderProps',
	);
	expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(false);
});
