import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { NATIVE_PROPS_FORWARDING_KEY, TYPE_DEFINITIONS_KEY } from './component-prop-groups.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { decodeTypeDefinitions } from './type-definition-model.js';

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

test('keeps JSDoc descriptions for Button presentation props', async () => {
	const [buttonProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/button/button.tsx',
			name: 'ButtonProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map(
		(buttonProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);

	for (const name of ['appearance', 'isBlock', 'prominence', 'size', 'tone'] as const) {
		const entry = entriesByName.get(name);
		expect(entry, `expected ${name} in ButtonProps`).toBeDefined();
		expect(entry?.description?.trim().length ?? 0).toBeGreaterThan(0);
	}

	expect(entriesByName.get('isPending')?.description?.trim().length ?? 0).toBeGreaterThan(0);
});

test('marks a pure native wrapper with the native-props entry and no visible props', async () => {
	const [kbdProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/kbd/kbd.tsx',
			name: 'KbdProps',
		},
		{ basePath: repoRoot },
	);

	expect(
		kbdProps?.entries.flatMap((entry) => {
			if (entry.name === NATIVE_PROPS_FORWARDING_KEY) return [];

			return [entry.name];
		}),
	).toEqual([]);
	const nativePropsEntry = kbdProps?.entries.find(
		(entry) => entry.name === NATIVE_PROPS_FORWARDING_KEY,
	);
	expect(nativePropsEntry?.description).toBe(
		'`KbdProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
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

test('preserves optional alias-of-union props instead of collapsing them to union', async () => {
	const [doc] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'apps/docs/src/lib/__fixtures__/optional-alias-doc-props.ts',
			name: 'OptionalAliasDocProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map((doc?.entries ?? []).map((entry) => [entry.name, entry] as const));
	const definitions = decodeTypeDefinitions(entriesByName.get(TYPE_DEFINITIONS_KEY)?.typeHref);

	expect(entriesByName.get('aliased')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'AliasOfUnion',
			type: 'AliasOfUnion',
			typeHref: 'AliasOfUnion',
		}),
	);
	expect(entriesByName.get('label')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'string',
			type: 'string',
		}),
	);
	expect(entriesByName.get('requiredAliased')).toEqual(
		expect.objectContaining({
			required: true,
			simplifiedType: 'AliasOfUnion',
			type: 'AliasOfUnion',
			typeHref: 'AliasOfUnion',
		}),
	);
	expect(entriesByName.get('render')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'FixtureRenderProp',
			type: 'FixtureRenderProp',
			typeHref: 'FixtureRenderProp',
		}),
	);
	expect(definitions.AliasOfUnion?.definition).toContain('string | number');
	expect(definitions.FixtureRenderProp?.definition).toContain('className');
});

test('preserves declared aliases on Grid responsive layout props with definitions', async () => {
	const [gridProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/grid/grid.tsx',
			name: 'GridProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map(
		(gridProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);
	const definitions = decodeTypeDefinitions(entriesByName.get(TYPE_DEFINITIONS_KEY)?.typeHref);

	expect(entriesByName.get('columns')?.simplifiedType).toBe(
		'RequiredInitialResponsiveValue<number | string>',
	);
	expect(entriesByName.get('columns')?.type).toBe(
		'RequiredInitialResponsiveValue<number | string>',
	);
	expect(entriesByName.get('columns')?.typeHref).toBe('RequiredInitialResponsiveValue');
	expect(entriesByName.get('areas')?.simplifiedType).toBe(
		'RequiredInitialResponsiveValue<ReadonlyArray<string>>',
	);
	expect(entriesByName.get('rows')?.simplifiedType).toBe('RequiredInitialResponsiveValue<string>');
	expect(definitions.RequiredInitialResponsiveValue?.definition).toContain(
		'RequiredInitialResponsive',
	);
});

test('links Button pressAction to the PressAction definition', async () => {
	const [buttonProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/button/button.tsx',
			name: 'ButtonProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map(
		(buttonProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);
	const definitions = decodeTypeDefinitions(entriesByName.get(TYPE_DEFINITIONS_KEY)?.typeHref);

	expect(entriesByName.get('pressAction')).toEqual(
		expect.objectContaining({
			simplifiedType: 'PressAction',
			type: 'PressAction',
			typeHref: 'PressAction',
		}),
	);
	expect(definitions.PressAction?.definition).toMatch(/=> void \| Promise<void>/);
});

test('keeps optional and explicit-undefined props distinct', async () => {
	const [doc] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'apps/docs/src/lib/__fixtures__/optionality-doc-props.ts',
			name: 'OptionalityDocProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map((doc?.entries ?? []).map((entry) => [entry.name, entry] as const));

	expect(entriesByName.get('first')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'string',
			type: 'string',
		}),
	);
	expect(entriesByName.get('second')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'string | undefined',
			type: 'string | undefined',
		}),
	);
	expect(entriesByName.get('third')).toEqual(
		expect.objectContaining({
			required: true,
			simplifiedType: 'string | undefined',
			type: 'string | undefined',
		}),
	);
	expect(entriesByName.get('nested')?.type).toBe('AliasHoldingUndefined');
	expect(entriesByName.get('nested')?.type).not.toMatch(/ \| undefined$/);
	expect(entriesByName.get('external')).toEqual(
		expect.objectContaining({
			type: 'Promise<string>',
		}),
	);
	expect(entriesByName.get('external')?.typeHref).toBeUndefined();
});
