import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import type { TypeTokens } from './type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const generator = createGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});
const componentPropsGenerator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

// The first generator call in this file builds the shared ts-morph project, which is slow under
// load. That test gets the same generous timeout as `component-prop-analysis.test.ts`.
const TS_MORPH_TEST_TIMEOUT = 30_000;

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

test(
	'filters generated component prop tables through the component props generator',
	async () => {
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
	},
	TS_MORPH_TEST_TIMEOUT,
);

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
	const [doc] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'apps/docs/src/lib/__fixtures__/optional-alias-doc-props.ts',
			name: 'OptionalAliasDocProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const entriesByName = new Map((doc?.entries ?? []).map((entry) => [entry.name, entry] as const));

	expect(entriesByName.get('aliased')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'AliasOfUnion',
			type: 'AliasOfUnion',
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
		}),
	);
	expect(entriesByName.get('render')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'FixtureRenderProp',
			type: 'FixtureRenderProp',
		}),
	);
	// Docs fixtures are not Luke UI source, so their aliases stay plain text.
	expect(doc?.typeDefinitions).toBeUndefined();
});

test('preserves declared aliases on Grid responsive layout props with definitions', async () => {
	const [gridProps] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/grid/grid.tsx',
			name: 'GridProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const entriesByName = new Map(
		(gridProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);

	expect(entriesByName.get('columns')?.simplifiedType).toBe(
		'RequiredInitialResponsiveValue<number | string>',
	);
	expect(entriesByName.get('columns')?.type).toBe(
		'RequiredInitialResponsiveValue<number | string>',
	);
	expect(lukeLinks(gridProps, 'columns')).toEqual(['RequiredInitialResponsiveValue']);
	expect(entriesByName.get('areas')?.simplifiedType).toBe(
		'RequiredInitialResponsiveValue<ReadonlyArray<string>>',
	);
	expect(entriesByName.get('rows')?.simplifiedType).toBe('RequiredInitialResponsiveValue<string>');
	expect(text(gridProps?.typeDefinitions?.RequiredInitialResponsiveValue?.definition)).toContain(
		'RequiredInitialResponsive',
	);
});

test('links Button pressAction and prominence to their definitions', async () => {
	const [buttonProps] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/button/button.tsx',
			name: 'ButtonProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const entriesByName = new Map(
		(buttonProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);

	expect(entriesByName.get('pressAction')).toEqual(
		expect.objectContaining({ simplifiedType: 'PressAction', type: 'PressAction' }),
	);
	expect(lukeLinks(buttonProps, 'pressAction')).toEqual(['PressAction']);
	expect(text(buttonProps?.typeDefinitions?.PressAction?.definition)).toMatch(
		/=> void \| Promise<void>/,
	);
	// Presentation branches declare different subsets of Prominence, so the row shows the resolved
	// alias. It links the same way as an alias the prop writes.
	expect(entriesByName.get('prominence')?.simplifiedType).toBe('Prominence');
	expect(lukeLinks(buttonProps, 'prominence')).toEqual(['Prominence']);
	expect(text(buttonProps?.typeDefinitions?.Prominence?.definition)).toBe(
		"type Prominence = 'low' | 'standard' | 'high';",
	);
	// External render-prop aliases stay plain text.
	expect(lukeLinks(buttonProps, 'children')).toEqual([]);
	expect(lukeLinks(buttonProps, 'onPress')).toEqual([]);
});

test('shows the resolved type when Button presentation branches declare different types', async () => {
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

	// The checker orders union members by type id, so compare the members.
	expect(entriesByName.get('tone')?.simplifiedType.split(' | ').sort()).toEqual([
		'"critical"',
		'"neutral"',
	]);
	// `'low' | 'standard'` is a subset of `Prominence`, so the resolved union is the alias.
	expect(entriesByName.get('prominence')?.simplifiedType).toBe('Prominence');
});

test('prefers resolved callback signatures over indexed-access annotations', async () => {
	const [buttonProps] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/button/button.tsx',
			name: 'ButtonProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const buttonByName = new Map(
		(buttonProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);
	const onPress = buttonByName.get('onPress');
	expect(onPress?.type).toMatch(/PressEvent/);
	expect(onPress?.type).toMatch(/=>\s*void/);
	expect(onPress?.type).not.toMatch(/RacButtonProps\s*\[\s*['"]onPress['"]\s*\]/);
	expect(onPress?.simplifiedType).toBe(onPress?.type);
	expect(lukeLinks(buttonProps, 'onPress')).toEqual([]);
	expect(onPress?.required).toBe(false);
	// RAC's indexed onPress admits undefined in the value type, so keep it.
	expect(onPress?.type).toMatch(/\|\s*undefined$/);

	const [textInputFieldProps] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/text-input-field/text-input-field.tsx',
			name: 'TextInputFieldProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const fieldByName = new Map(
		(textInputFieldProps?.entries ?? []).map((entry) => [entry.name, entry] as const),
	);
	const onChange = fieldByName.get('onChange');
	expect(onChange?.type).toMatch(/value:\s*string/);
	expect(onChange?.type).toMatch(/=>\s*void/);
	expect(onChange?.type).not.toMatch(/RacTextFieldProps\s*\[\s*['"]onChange['"]\s*\]/);
	expect(onChange?.simplifiedType).toBe(onChange?.type);
	expect(lukeLinks(textInputFieldProps, 'onChange')).toEqual([]);
	expect(onChange?.required).toBe(false);
	expect(onChange?.type).toMatch(/\|\s*undefined$/);
});

test('keeps explicit undefined on indexed-access targets and strips only implied optionality', async () => {
	const [doc] = (await componentPropsGenerator.generateTypeTable(
		{
			path: 'apps/docs/src/lib/__fixtures__/indexed-access-doc-props.ts',
			name: 'IndexedAccessDocProps',
		},
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	const entriesByName = new Map((doc?.entries ?? []).map((entry) => [entry.name, entry] as const));

	expect(entriesByName.get('optionalPlain')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'string',
			type: 'string',
		}),
	);
	expect(entriesByName.get('optionalWithUndefined')).toEqual(
		expect.objectContaining({
			required: false,
			simplifiedType: 'string | undefined',
			type: 'string | undefined',
		}),
	);
	expect(entriesByName.get('requiredWithUndefined')).toEqual(
		expect.objectContaining({
			required: true,
			simplifiedType: 'string | undefined',
			type: 'string | undefined',
		}),
	);
});

test('prefers non-never annotations across element/render union branches', async () => {
	const [doc] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'apps/docs/src/lib/__fixtures__/union-branch-doc-props.ts',
			name: 'UnionBranchDocProps',
		},
		{ basePath: repoRoot },
	);
	const entriesByName = new Map((doc?.entries ?? []).map((entry) => [entry.name, entry] as const));

	expect(entriesByName.get('renderRoot')).toEqual(
		expect.objectContaining({
			simplifiedType: 'BranchRenderProp',
			type: 'BranchRenderProp',
		}),
	);
	expect(entriesByName.get('elementType')?.type).toBe("'div' | 'span'");
	expect(entriesByName.get('elementType')?.type).not.toBe('never');
	expect(entriesByName.get('shared')).toEqual(
		expect.objectContaining({
			simplifiedType: 'SharedBranchAlias',
			type: 'SharedBranchAlias',
		}),
	);
	// Branches that write different types fall back to the resolved type, which covers them all.
	expect(entriesByName.get('mode')).toEqual(
		expect.objectContaining({
			simplifiedType: '"element" | "render"',
			type: '"element" | "render"',
		}),
	);
	expect(entriesByName.get('mode')?.typeHref).toBeUndefined();

	const [boxProps] = await componentPropsGenerator.generateTypeTable(
		{
			path: 'packages/@luke-ui/react/src/core/box/box.tsx',
			name: 'BoxProps',
		},
		{ basePath: repoRoot },
	);
	const boxByName = new Map((boxProps?.entries ?? []).map((entry) => [entry.name, entry] as const));
	expect(boxByName.get('renderRoot')?.type).not.toBe('never');
	expect(boxByName.get('renderRoot')?.type).toMatch(/domProps/);
	expect(boxByName.get('elementType')?.type).toBe('BoxLikeElementType');
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

test('closes Grid definitions over every Luke UI type they name', async () => {
	const gridProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/grid/grid.tsx',
		'GridProps',
	);
	const definitions = gridProps?.typeDefinitions ?? {};

	expectClosedDefinitions(gridProps);
	expect(asText(definitions.RequiredInitialResponsiveValue)).toEqual({
		definition: expect.stringMatching(/^type RequiredInitialResponsiveValue<Value> =/),
		name: 'RequiredInitialResponsiveValue',
		references: ['RequiredInitialResponsive', 'ResponsivePropValue'],
	});
	expect(definitions.ResponsivePropValue?.references).toEqual(['ResponsiveCondition']);
	// The declaration reads `keyof typeof responsiveConditions`, so the breakpoint names come from
	// the checker. They are sorted, because the checker's order depends on the order pages compile in.
	expect(asText(definitions.ResponsiveCondition)).toEqual(
		expect.objectContaining({
			definition: 'type ResponsiveCondition = keyof typeof responsiveConditions;',
			resolved: '"bp640" | "bp768" | "bp1024" | "bp1280" | "bp1536" | "initial"',
		}),
	);
	// An indexed access such as `SprinklesProps['gap']` has only its resolved form.
	const emptyLocalNames = Object.values(definitions).flatMap((definition) => {
		if (definition.module !== undefined) return [];
		return definition.definition === undefined && definition.resolved === undefined
			? [definition.name]
			: [];
	});
	expect(emptyLocalNames).toEqual([]);
});

test("expands Stack gap's indexed access to the accepted spacing tokens", async () => {
	const stackProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/stack/stack.tsx',
		'StackProps',
	);
	const definitions = stackProps?.typeDefinitions ?? {};

	expectClosedDefinitions(stackProps);
	expect(stackProps?.entries.find((entry) => entry.name === 'gap')?.simplifiedType).toBe(
		"RequiredInitialResponsive<SprinklesProps['gap']>",
	);
	expect(asText(definitions["SprinklesProps['gap']"])).toEqual({
		name: "SprinklesProps['gap']",
		references: ['ResponsiveValue'],
		resolved: expect.stringMatching(
			/^ResponsiveValue<"0" \| "space.4" \| .*"space.96"> \| undefined$/,
		),
	});
	// The indexed access stands in for SprinklesProps, whose own definition shows no values.
	expect(definitions.SprinklesProps).toBeUndefined();
	expect(text(definitions.BreakpointName?.resolved)).toBe(
		'"bp640" | "bp768" | "bp1024" | "bp1280" | "bp1536" | "initial"',
	);
});

test('shows render props with their arguments and names their external definitions', async () => {
	const buttonProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/button/button.tsx',
		'ButtonProps',
	);
	const definitions = buttonProps?.typeDefinitions ?? {};

	expectClosedDefinitions(buttonProps);
	// React Aria writes `ChildrenOrFunction<T>` in a generic interface. The row shows the argument
	// ButtonProps supplies.
	expect(buttonProps?.entries.find((entry) => entry.name === 'children')?.simplifiedType).toBe(
		'ChildrenOrFunction<ButtonRenderProps>',
	);
	expect(asText(definitions.ChildrenOrFunction)).toEqual({
		definition: expect.stringMatching(/^type ChildrenOrFunction<T> = ReactNode \| \(\(values: T/),
		module: 'react-aria-components',
		name: 'ChildrenOrFunction',
		references: ['ReactNode'],
		source: expect.stringMatching(/\.d\.ts$/),
	});
	// An external interface names its package but not its members.
	expect(definitions.ButtonRenderProps).toEqual({
		module: 'react-aria-components',
		name: 'ButtonRenderProps',
		references: [],
		source: expect.stringMatching(/\.d\.ts$/),
	});
	expect(asText(definitions.PressAction)).toEqual({
		definition: 'type PressAction = () => void | Promise<void>;',
		name: 'PressAction',
		references: [],
	});
});

test('leaves TypeScript library types out of the definitions', async () => {
	const gridProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/grid/grid.tsx',
		'GridProps',
	);
	const names = Object.values(gridProps?.typeDefinitions ?? {}).map(
		(definition) => definition.name,
	);

	expect(gridProps?.entries.find((entry) => entry.name === 'ref')?.simplifiedType).toBe(
		'Ref<HTMLElement>',
	);
	expect(names).toContain('Ref');
	// React merges an empty `HTMLElement` into the DOM library's, which still owns the type.
	expect(names).not.toContain('HTMLElement');
	expect(names).not.toContain('ReadonlyArray');
});

test('defines generated Luke UI types such as IconName with their accepted values', async () => {
	const iconButtonProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/icon-button/icon-button.tsx',
		'IconButtonProps',
	);
	const iconName = iconButtonProps?.typeDefinitions?.IconName;

	expectClosedDefinitions(iconButtonProps);
	expect(iconName?.module).toBeUndefined();
	expect(text(iconName?.definition)).toBe('type IconName = (typeof iconNames)[number];');
	expect(text(iconName?.resolved)).toMatch(
		/^"add" \| "arrowDown" \| "[A-Za-z]+"( \| "[A-Za-z]+")*$/,
	);
});

test('records the name an import gives an external type', async () => {
	const gridProps = await generateEnrichedDoc(
		'packages/@luke-ui/react/src/core/grid/grid.tsx',
		'GridProps',
	);
	const definitions = Object.values(gridProps?.typeDefinitions ?? {});

	// `ScaleValue` imports csstype's `Properties` as `CSSProperties`, which React also declares.
	expect(definitions).toContainEqual(
		expect.objectContaining({
			module: 'csstype',
			name: 'Properties',
			writtenAs: ['CSSProperties'],
		}),
	);
});

async function generateEnrichedDoc(path: string, name: string) {
	const [doc] = (await componentPropsGenerator.generateTypeTable(
		{ name, path },
		{ basePath: repoRoot },
	)) as Array<EnrichedGeneratedDoc | undefined>;
	return doc;
}

/** Every reference, and every type name a row or definition links, names a key the definitions hold. */
function expectClosedDefinitions(doc: EnrichedGeneratedDoc | undefined) {
	const definitions = doc?.typeDefinitions ?? {};
	const missingReferences = Object.entries(definitions).flatMap(([key, definition]) =>
		definition.references.flatMap((reference) =>
			definitions[reference] === undefined ? [`${key} -> ${reference}`] : [],
		),
	);
	const missingLinks = [
		...Object.values(doc?.typeTokens ?? {}),
		...Object.values(definitions).flatMap((definition) => [
			definition.definition ?? [],
			definition.resolved ?? [],
		]),
	]
		.flatMap(linkedKeys)
		.filter((key) => definitions[key] === undefined);

	expect(missingReferences).toEqual([]);
	expect(missingLinks).toEqual([]);
}

/** Tokens on one line, as Markdown table cells show them. */
function text(tokens: TypeTokens | undefined): string | undefined {
	return tokens === undefined ? undefined : typeTokensToText(tokens, { multiline: false });
}

/** A definition with its tokens as one-line text, for readable comparisons. */
function asText<Definition extends { definition?: TypeTokens; resolved?: TypeTokens }>(
	definition: Definition | undefined,
) {
	if (definition === undefined) return;
	const { definition: declared, resolved, ...rest } = definition;
	return {
		...rest,
		...(declared === undefined ? {} : { definition: text(declared) }),
		...(resolved === undefined ? {} : { resolved: text(resolved) }),
	};
}

function linkedKeys(tokens: TypeTokens): Array<string> {
	return tokens.flatMap((token) =>
		Array.isArray(token) && token[2] !== undefined ? [token[2]] : [],
	);
}

/** The Luke UI types a row's tokens link, which the browser opens in a popover. */
function lukeLinks(doc: EnrichedGeneratedDoc | undefined, prop: string): Array<string> {
	return linkedKeys(doc?.typeTokens?.[prop] ?? []).filter(
		(key) => doc?.typeDefinitions?.[key]?.module === undefined,
	);
}
