import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import type { PropProject } from './component-prop-analysis.js';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
	typeForwardsDomProps,
} from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
// The union fixture stands in for shapes Luke UI has only one of. `BoxProps` is the sole union among
// the documented types, so the negative case — a union that forwards nothing — has no real
// counterpart to assert against. Analysing the fixture against its own directory makes its two plain
// branches "first-party" exactly the way a component's own interfaces are.
const UNION_FIXTURE_PATH = 'apps/docs/src/lib/__fixtures__/prop-analysis-union.ts';
const fixtureSrcDir = resolve(repoRoot, 'apps/docs/src/lib/__fixtures__');
const generator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

// Building the shared ts-morph project the first time is slow on CI; every test below reuses the
// same cached project via `getSharedPropProject` instead of creating a fresh one, and gets an
// explicit generous timeout so a slow first build never races vitest's 5s default.
const TS_MORPH_TEST_TIMEOUT = 30_000;

async function loadDoc(path: string, name: string) {
	const [doc] = await generator.generateTypeTable({ path, name }, { basePath: repoRoot });
	const project = await getSharedPropProject(repoRoot);
	const declaration = loadExportedPropDeclaration(project, repoRoot, path, name);
	if (doc === undefined || declaration === undefined) {
		throw new Error(`Missing documentation for ${name} in ${path}`);
	}
	return { declaration, doc };
}

async function visiblePropNames(path: string, name: string): Promise<Array<string>> {
	const { declaration, doc } = await loadDoc(path, name);
	return filterGeneratedDoc(doc, declaration, reactSrcDir).entries.map((entry) => entry.name);
}

function forwardsDomPropsForExport(project: PropProject, path: string, name: string): boolean {
	const declaration = loadExportedPropDeclaration(project, repoRoot, path, name);
	if (declaration === undefined) return false;
	return typeForwardsDomProps(declaration, reactSrcDir);
}

test(
	'keeps documented form and field props on TextInputField while hiding generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/text-input-field/text-input-field.tsx',
			'TextInputFieldProps',
		);
		expect(names).toContain('label');
		expect(names).toContain('aria-label');
		expect(names).toContain('aria-labelledby');
		expect(names).toContain('value');
		expect(names).toContain('onChange');
		expect(names).toContain('description');
		expect(names).toContain('id');
		expect(names).toContain('inputId');
		expect(names).not.toContain('isInvalid');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps label, naming, id, and ref props on Checkbox while hiding children, isInvalid, and generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/checkbox/checkbox.tsx',
			'CheckboxProps',
		);
		expect(names).toContain('label');
		expect(names).toContain('aria-label');
		expect(names).toContain('aria-labelledby');
		expect(names).toContain('description');
		expect(names).toContain('necessityIndicator');
		expect(names).toContain('id');
		expect(names).toContain('inputId');
		expect(names).toContain('inputRef');
		expect(names).toContain('ref');
		expect(names).not.toContain('children');
		expect(names).not.toContain('isInvalid');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps accessible-name props on ComboboxField while hiding generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/combobox-field/combobox-field.tsx',
			'ComboboxFieldProps',
		);
		expect(names).toContain('label');
		expect(names).toContain('aria-label');
		expect(names).toContain('aria-labelledby');
		expect(names).toContain('defaultItems');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps naming, selection, id, and ref props on SelectField while hiding isInvalid and generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/select-field/select-field.tsx',
			'SelectFieldProps',
		);
		expect(names).toContain('label');
		expect(names).toContain('aria-label');
		expect(names).toContain('aria-labelledby');
		expect(names).toContain('aria-describedby');
		expect(names).toContain('items');
		expect(names).toContain('value');
		expect(names).toContain('defaultValue');
		expect(names).toContain('onChange');
		expect(names).toContain('id');
		expect(names).toContain('ref');
		expect(names).toContain('triggerId');
		expect(names).toContain('triggerRef');
		expect(names).not.toContain('isInvalid');
		expect(names).not.toContain('isReadOnly');
		expect(names).not.toContain('isPending');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps typography props on Heading while hiding generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/heading/heading.tsx',
			'HeadingProps',
		);
		expect(names).toContain('level');
		expect(names).toContain('typography');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
		expect(names).not.toContain('itemProp');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'detects native DOM forwarding per exported prop type on multi-type pages',
	async () => {
		const project = await getSharedPropProject(repoRoot);

		expect(
			forwardsDomPropsForExport(
				project,
				'packages/@luke-ui/react/src/core/heading/heading.tsx',
				'HeadingProps',
			),
		).toBe(true);
		expect(
			forwardsDomPropsForExport(
				project,
				'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
				'HeadingLevelsProps',
			),
		).toBe(false);
		expect(
			forwardsDomPropsForExport(
				project,
				'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
				'HeadingLevelsRenderProps',
			),
		).toBe(false);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'does not mark object-only provider props as DOM forwarding types',
	async () => {
		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
			'HeadingLevelsRenderProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(false);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps the redeclared form and state contract visible on the Combobox root primitive',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/primitives/combobox/root.tsx',
			'ComboboxRootProps',
		);
		expect(names).toContain('isDisabled');
		expect(names).toContain('isReadOnly');
		expect(names).toContain('isRequired');
		expect(names).toContain('isInvalid');
		// `form` and `name` are the same react-aria long-tail prop names hidden on AriaBaseButton
		// types — visible here specifically because `ComboboxRootRedeclaredRACProps` redeclares them
		// with useful JSDoc, which is what "redeclared in Luke UI source wins" means in practice.
		expect(names).toContain('name');
		expect(names).toContain('form');
		expect(names).toContain('validate');
		expect(names).toContain('validationBehavior');
		expect(names).toContain('autoFocus');
		// The ~90 long-tail DOM handlers and capture-phase variants stay hidden.
		expect(names).not.toContain('onPointerMoveCapture');
		expect(names).not.toContain('onClickCapture');
		expect(names).not.toContain('onAuxClick');
	},
	TS_MORPH_TEST_TIMEOUT,
);

/**
 * Representative generic DOM noise. None of it is a documented Luke UI prop, and every entry
 * reaches a component type only by inheriting a React element attribute bag wholesale, so no table
 * should ever show any of it.
 */
const GENERIC_DOM_NOISE = ['itemProp', 'onClick', 'onPointerMoveCapture', 'tabIndex'] as const;

/**
 * The types whose tables were empty before this analysis existed, now audited against what each
 * component's guide actually teaches rather than against whatever the analysis happens to emit.
 *
 * `Kbd` stands for the pure native wrappers (`Prose`, checkbox anatomy parts, and similar): their
 * guides teach only that they render a native element with the component's own styling, and their
 * source is a bare `extends ComponentProps<'…'>`. They document no Luke UI contract beyond
 * pass-through DOM props, so their filtered tables are intentionally empty and rely on the
 * native-props note alone.
 *
 * `Code` composes `Text` and documents `lineClamp` and `textWrap` alongside its native `<code>`
 * DOM forwarding, so its table is no longer empty — see the `QuoteProps` entry below for the same
 * shape.
 */
const AUDITED_TYPES: ReadonlyArray<{
	forwardsDomProps: boolean;
	hidden?: ReadonlyArray<string>;
	name: string;
	path: string;
	visible: ReadonlyArray<string>;
}> = [
	{
		forwardsDomProps: true,
		name: 'CodeProps',
		path: 'packages/@luke-ui/react/src/core/code/code.tsx',
		visible: ['lineClamp', 'textWrap'],
	},
	{
		forwardsDomProps: true,
		name: 'KbdProps',
		path: 'packages/@luke-ui/react/src/core/kbd/kbd.tsx',
		visible: [],
	},
	{
		// The guide teaches `aria-label` in Accessibility for naming the loading status region.
		forwardsDomProps: true,
		name: 'LoadingSpinnerProps',
		path: 'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
		visible: ['aria-label', 'children', 'color', 'isLoading', 'size'],
	},
	{
		// The guide teaches `aria-label`, `aria-invalid`, and `inputMode` on a standalone `TextInput`.
		forwardsDomProps: true,
		name: 'TextInputProps',
		path: 'packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx',
		visible: [
			'aria-label',
			'aria-invalid',
			'className',
			'defaultValue',
			'disabled',
			'form',
			'id',
			'inputMode',
			'name',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'placeholder',
			'readOnly',
			'ref',
			'render',
			'required',
			'size',
			'value',
		],
	},
	{
		// The guide teaches `cite` for the quoted source URL.
		forwardsDomProps: true,
		name: 'QuoteProps',
		path: 'packages/@luke-ui/react/src/core/quote/quote.tsx',
		visible: ['cite', 'lineClamp', 'textWrap'],
	},
	{
		// The field guide teaches connecting labels with `htmlFor`.
		forwardsDomProps: true,
		name: 'FieldLabelProps',
		path: 'packages/@luke-ui/react/src/core/primitives/field/label.tsx',
		visible: ['elementType', 'htmlFor', 'necessityIndicator', 'render'],
	},
	{
		// The field guide teaches connecting helper text with `id` and `aria-describedby`.
		forwardsDomProps: true,
		name: 'FieldDescriptionProps',
		path: 'packages/@luke-ui/react/src/core/primitives/field/description.tsx',
		visible: ['elementType', 'id', 'render'],
	},
	{
		// `FieldError` styles RAC's field error slot, so it documents the same element-choice contract.
		forwardsDomProps: true,
		name: 'FieldErrorProps',
		path: 'packages/@luke-ui/react/src/core/primitives/field/error.tsx',
		visible: ['elementType', 'render'],
	},
	{
		// The guide teaches `<VisuallyHidden elementType="h2">` for a screen-reader-only heading.
		forwardsDomProps: true,
		name: 'VisuallyHiddenProps',
		path: 'packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx',
		visible: ['elementType', 'render'],
	},
	{
		// Icon picks five SVG props by name and forwards nothing else, so its table is closed.
		forwardsDomProps: false,
		hidden: ['viewport', 'width'],
		name: 'IconProps',
		path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
		visible: ['aria-hidden', 'className', 'id', 'name', 'size', 'style', 'title', 'viewBox'],
	},
];

for (const auditedType of AUDITED_TYPES) {
	test(
		`${auditedType.name} documents its own contract without generic DOM props`,
		async () => {
			const { forwardsDomProps, hidden = [], name, path, visible } = auditedType;
			const names = await visiblePropNames(path, name);

			for (const prop of visible) {
				expect(names, `${name} should document ${prop}`).toContain(prop);
			}
			const hiddenProps = [
				...GENERIC_DOM_NOISE,
				'key',
				...(visible.includes('ref') ? [] : (['ref'] as const)),
				...hidden,
			];
			for (const prop of hiddenProps) {
				expect(names, `${name} should hide ${prop}`).not.toContain(prop);
			}

			const { declaration } = await loadDoc(path, name);
			expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(forwardsDomProps);
		},
		TS_MORPH_TEST_TIMEOUT,
	);
}

test(
	'keeps both branches of a union type documented and DOM-forwarding',
	async () => {
		// `Box`'s props are a union of an element branch and a render branch. TypeScript reports only
		// the props common to *every* constituent, so reading the union directly hides the element
		// branch entirely — and with it the fact that `Box` spreads its rest props onto a real element.
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/box/box.tsx',
			'BoxProps',
		);
		// From the element branch, which the render branch does not declare.
		expect(names).toContain('elementType');
		expect(names).toContain('ref');
		// From the render branch, which the element branch types as `never`.
		expect(names).toContain('render');
		// Shared layout props from both branches' `SprinklesProps`.
		expect(names).toContain('padding');
		expect(names).toContain('display');
		for (const prop of GENERIC_DOM_NOISE) expect(names).not.toContain(prop);

		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/box/box.tsx',
			'BoxProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(true);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'hides forbidden ScrollFade props without hiding supported props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/scroll-fade/scroll-fade.tsx',
			'ScrollFadeProps',
		);
		expect(names).toContain('axis');
		for (const prop of [
			'tabIndex',
			'overflow',
			'overflowX',
			'overflowY',
			'elementType',
			'role',
			'render',
		] as const) {
			expect(names, `ScrollFadeProps should hide ${prop}`).not.toContain(prop);
		}
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps optional undefined props while hiding direct and aliased never props',
	async () => {
		const project = await getSharedPropProject(repoRoot);
		const file = project.createSourceFile(
			resolve(fixtureSrcDir, 'prop-analysis-never.ts'),
			'type Forbidden = never; export interface NeverProps { allowed?: undefined; forbidden?: never; aliased?: Forbidden; }',
			{ overwrite: true },
		);
		const declaration = file.getExportedDeclarations().get('NeverProps')?.[0];
		if (declaration === undefined) throw new Error('Missing NeverProps fixture declaration');

		const names = filterGeneratedDoc(
			{
				description: '',
				id: 'NeverProps',
				entries: ['allowed', 'forbidden', 'aliased'].map((name) => ({
					deprecated: false,
					description: '',
					name,
					required: false,
					simplifiedType: 'undefined',
					tags: [],
					type: 'undefined',
				})),
				name: 'NeverProps',
			},
			declaration,
			fixtureSrcDir,
		).entries.map((entry) => entry.name);

		expect(names).toEqual(['allowed']);
		expect(typeForwardsDomProps(declaration, fixtureSrcDir)).toBe(false);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'does not treat every union as DOM forwarding',
	async () => {
		const project = await getSharedPropProject(repoRoot);

		// A union of two plain object types forwards nothing, even though the union-aware walk visits
		// both constituents.
		expect(forwardsDomPropsForExport(project, UNION_FIXTURE_PATH, 'PlainUnionProps')).toBe(false);
		// One DOM-forwarding constituent is enough for the whole union to forward.
		expect(forwardsDomPropsForExport(project, UNION_FIXTURE_PATH, 'MixedUnionProps')).toBe(true);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'documents every branch of a union, not only the props common to all of them',
	async () => {
		const project = await getSharedPropProject(repoRoot);
		const declaration = loadExportedPropDeclaration(
			project,
			repoRoot,
			UNION_FIXTURE_PATH,
			'PlainUnionProps',
		);
		if (declaration === undefined) throw new Error('Missing PlainUnionProps fixture declaration');

		const names = filterGeneratedDoc(
			{
				description: '',
				id: 'PlainUnionProps',
				entries: ['a', 'b'].map((name) => ({
					deprecated: false,
					description: '',
					name,
					required: false,
					simplifiedType: '',
					tags: [],
					type: '',
				})),
				name: 'PlainUnionProps',
			},
			declaration,
			fixtureSrcDir,
		).entries.map((entry) => entry.name);

		expect(names).toEqual(['a', 'b']);
	},
	TS_MORPH_TEST_TIMEOUT,
);

/**
 * Exact visible-prop sets for the AriaBaseButton family. Those types inherit `AriaBaseButtonProps`
 * (react-aria's `useButton`), which declares an undocumented long tail directly alongside genuinely
 * documented siblings on the same interface body. The structural analysis reads that upstream
 * syntax, so an upstream release that moves a prop between a curated contract and a generic element
 * attribute bag changes what these tables show. Pinning the whole set makes that change fail here
 * loudly instead of silently rewriting a published API table.
 *
 * `TextProps` is pinned for the same reason against RAC `Text` / `HTMLAttributes` churn. Types
 * covered by `AUDITED_TYPES` are not re-pinned here.
 */
const PINNED_VISIBLE_PROPS: ReadonlyArray<{
	exportName: string;
	name: string;
	path: string;
	props: ReadonlyArray<string>;
}> = [
	{
		// `Text` omits RAC's `Text` props it redeclares and adds its own typography contract. Everything
		// below `HTMLAttributes` must be gone.
		exportName: 'TextProps',
		name: 'TextProps',
		path: 'packages/@luke-ui/react/src/core/text/text.tsx',
		props: [
			'color',
			'elementType',
			'fontStyle',
			'fontVariantNumeric',
			'fontWeight',
			'isVisuallyHidden',
			'lineClamp',
			'render',
			'shouldDisableTrim',
			'shouldInheritFont',
			'textAlign',
			'textDecoration',
			'textTransform',
			'textWrap',
			'typography',
		],
	},
	{
		exportName: 'ButtonProps',
		name: 'core ButtonProps',
		path: 'packages/@luke-ui/react/src/core/button/button.tsx',
		props: [
			'appearance',
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'children',
			'endContent',
			'id',
			'isBlock',
			'isDisabled',
			'isPending',
			'onBlur',
			'onFocus',
			'onFocusChange',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'onKeyDown',
			'onKeyUp',
			'onPress',
			'onPressChange',
			'onPressEnd',
			'onPressStart',
			'onPressUp',
			'pressAction',
			'prominence',
			'ref',
			'render',
			'size',
			'slot',
			'startContent',
			'tone',
			'type',
		],
	},
	{
		exportName: 'ButtonProps',
		name: 'primitive ButtonProps',
		path: 'packages/@luke-ui/react/src/core/primitives/button/button.tsx',
		props: [
			'appearance',
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'children',
			'id',
			'isBlock',
			'isDisabled',
			'isPending',
			'onBlur',
			'onFocus',
			'onFocusChange',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'onKeyDown',
			'onKeyUp',
			'onPress',
			'onPressChange',
			'onPressEnd',
			'onPressStart',
			'onPressUp',
			'prominence',
			'ref',
			'render',
			'size',
			'slot',
			'tone',
			'type',
		],
	},
	{
		exportName: 'IconButtonProps',
		name: 'IconButtonProps',
		path: 'packages/@luke-ui/react/src/core/icon-button/icon-button.tsx',
		props: [
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'icon',
			'id',
			'isDisabled',
			'isPending',
			'onBlur',
			'onFocus',
			'onFocusChange',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'onKeyDown',
			'onKeyUp',
			'onPress',
			'onPressChange',
			'onPressEnd',
			'onPressStart',
			'onPressUp',
			'pressAction',
			'prominence',
			'ref',
			'render',
			'size',
			'slot',
			'tone',
			'type',
		],
	},
	{
		exportName: 'ComboboxTriggerProps',
		name: 'ComboboxTriggerProps',
		path: 'packages/@luke-ui/react/src/core/primitives/combobox/trigger.tsx',
		props: [
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'children',
			'className',
			'id',
			'isDisabled',
			'isPending',
			'onBlur',
			'onFocus',
			'onFocusChange',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'onKeyDown',
			'onKeyUp',
			'onPress',
			'onPressChange',
			'onPressEnd',
			'onPressStart',
			'onPressUp',
			'render',
			'size',
			'slot',
			'type',
		],
	},
	{
		exportName: 'ComboboxClearButtonProps',
		name: 'ComboboxClearButtonProps',
		path: 'packages/@luke-ui/react/src/core/primitives/combobox/clear-button.tsx',
		props: [
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'children',
			'className',
			'id',
			'isDisabled',
			'isPending',
			'onBlur',
			'onFocus',
			'onFocusChange',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'onKeyDown',
			'onKeyUp',
			'onPress',
			'onPressChange',
			'onPressEnd',
			'onPressStart',
			'onPressUp',
			'render',
			'size',
			'type',
		],
	},
];

for (const pinned of PINNED_VISIBLE_PROPS) {
	test(
		`${pinned.name} shows exactly its documented props`,
		async () => {
			const { exportName, path, props } = pinned;
			const names = await visiblePropNames(path, exportName);
			expect([...names].sort()).toEqual([...props].sort());
		},
		TS_MORPH_TEST_TIMEOUT,
	);
}
