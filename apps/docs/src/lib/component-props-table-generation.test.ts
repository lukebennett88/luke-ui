import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const generator = createGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});
const componentPropsGenerator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

test('does not filter hand-authored theme type tables', async () => {
	const [themeInput] = await generator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/theme/define-theme.ts',
			name: 'ThemeInput',
		},
		{ basePath: repoRoot },
	);

	expect(themeInput?.entries.length ?? 0).toBeGreaterThan(5);
});

test('filters generated component prop tables through the component props generator', async () => {
	const [buttonProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/button/button.tsx',
			name: 'ButtonProps',
		},
		{ basePath: repoRoot },
	);

	expect(buttonProps?.entries.map((entry) => entry.name)).toEqual(
		expect.arrayContaining(['onPress', 'appearance']),
	);
	const entryNames = buttonProps?.entries.map((entry) => entry.name) ?? [];
	expect(entryNames).not.toContain('onClick');
	expect(entryNames).not.toContain('onPointerMoveCapture');
	expect(entryNames).not.toContain('itemProp');
});

test('marks a pure native wrapper with the native-props entry and no visible props', async () => {
	const [codeProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/code/code.tsx',
			name: 'CodeProps',
		},
		{ basePath: repoRoot },
	);

	expect(
		codeProps?.entries.flatMap((entry) =>
			entry.name !== NATIVE_PROPS_FORWARDING_KEY ? [entry.name] : [],
		),
	).toEqual([]);
	const nativePropsEntry = codeProps?.entries.find(
		(entry) => entry.name === NATIVE_PROPS_FORWARDING_KEY,
	);
	expect(nativePropsEntry?.description).toBe(
		'`CodeProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
});

test('marks a DOM-forwarding type with the native-props entry', async () => {
	const [headingProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/heading/heading.tsx',
			name: 'HeadingProps',
		},
		{ basePath: repoRoot },
	);

	const nativePropsEntry = headingProps?.entries.find(
		(entry) => entry.name === NATIVE_PROPS_FORWARDING_KEY,
	);
	expect(nativePropsEntry?.description).toBe(
		'`HeadingProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
});

test('does not mark an object-only type with the native-props entry', async () => {
	const [renderProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
			name: 'HeadingLevelsRenderProps',
		},
		{ basePath: repoRoot },
	);

	expect(renderProps?.entries.some((entry) => entry.name === NATIVE_PROPS_FORWARDING_KEY)).toBe(
		false,
	);
});
