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

function forwardsDomPropsForExport(project: PropProject, path: string, name: string): boolean {
	const declaration = loadExportedPropDeclaration(project, repoRoot, path, name);
	if (declaration === undefined) return false;
	return typeForwardsDomProps(declaration, reactSrcDir);
}

test(
	'keeps documented press props on Button while hiding generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/button/button.tsx',
			'ButtonProps',
		);
		expect(names).toContain('onPress');
		expect(names).toContain('appearance');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
		expect(names).not.toContain('itemProp');
	},
	TS_MORPH_TEST_TIMEOUT,
);

/**
 * `AriaBaseButtonProps` (react-aria's `useButton`) declares these directly alongside `type` and the
 * props `DocumentedPressProps` redeclares, on the very same interface body, reached through a plain
 * `extends` — no syntax separates them from their documented siblings. `button.mdx` and
 * `icon-button.mdx` teach none of them and both point at the upstream React Aria page via `reactAria`
 * frontmatter, so per `docs/DOCUMENTATION.md` they belong behind that link, not in the table.
 */
const ARIA_BASE_BUTTON_LONG_TAIL = [
	'formMethod',
	'formAction',
	'formTarget',
	'formEncType',
	'formNoValidate',
	'name',
	'value',
	'preventFocusOnPress',
	'aria-pressed',
	'aria-expanded',
	'aria-haspopup',
	'aria-controls',
	'aria-current',
	'aria-disabled',
] as const;

test(
	"hides AriaBaseButtonProps' undocumented long tail on Button while keeping its labeling contract",
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/button/button.tsx',
			'ButtonProps',
		);
		for (const prop of ARIA_BASE_BUTTON_LONG_TAIL) {
			expect(names, `ButtonProps should hide ${prop}`).not.toContain(prop);
		}
		// The fixed `AriaLabelingProps` contract stays visible even though Button never redeclares it.
		expect(names).toContain('aria-label');
		expect(names).toContain('aria-labelledby');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps documented form and field props on TextField while hiding generic DOM props',
	async () => {
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
		expect(names).not.toContain('onPointerMoveCapture');
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps the primitive button styling and press contract without generic DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/primitives/button/button.tsx',
			'ButtonProps',
		);
		expect(names).toContain('appearance');
		expect(names).toContain('onPress');
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
				project as PropProject,
				'packages/@luke-ui/react/src/core/heading/heading.tsx',
				'HeadingProps',
			),
		).toBe(true);
		expect(
			forwardsDomPropsForExport(
				project as PropProject,
				'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
				'HeadingLevelsProps',
			),
		).toBe(false);
		expect(
			forwardsDomPropsForExport(
				project as PropProject,
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
	"keeps IconProps' curated SVG props visible without marking Icon as DOM-forwarding",
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/icon/icon.tsx',
			'IconProps',
		);
		// Icon deliberately `Pick`s these 5 props from `SVGAttributes`/`AriaAttributes`; the old
		// declaration-origin heuristic hid them because `Pick` preserves React's own declaration site.
		expect(names).toContain('aria-hidden');
		expect(names).toContain('className');
		expect(names).toContain('id');
		expect(names).toContain('style');
		expect(names).toContain('viewBox');
		// Unrelated DOM/event noise never picked by Icon must stay absent.
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
		expect(names).not.toContain('tabIndex');

		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/icon/icon.tsx',
			'IconProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(false);
		expect(
			forwardsDomPropsForExport(
				await getSharedPropProject(repoRoot),
				'packages/@luke-ui/react/src/core/icon/icon.tsx',
				'IconProps',
			),
		).toBe(false);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	"keeps VisuallyHidden's documented elementType prop visible while hiding generic DOM props",
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx',
			'VisuallyHiddenProps',
		);
		// The guide explicitly teaches `<VisuallyHidden elementType="h2">`.
		expect(names).toContain('elementType');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('itemProp');
		expect(names).not.toContain('onPointerMoveCapture');
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
		// `form` and `name` are the same react-aria long-tail prop names hidden on `ButtonProps` below —
		// visible here specifically because `ComboboxRootRedeclaredRACProps` redeclares them with useful
		// JSDoc, which is what "redeclared in Luke UI source wins" means in practice. Button never
		// redeclares them, so they stay hidden there. The asymmetry is deliberate, not a bug.
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

test(
	"keeps LoadingSpinner's documented aria-label visible while hiding generic DOM props",
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
			'LoadingSpinnerProps',
		);
		expect(names).toContain('aria-label');
		expect(names).toContain('isLoading');
		expect(names).toContain('size');
		expect(names).not.toContain('onClick');
		expect(names).not.toContain('onPointerMoveCapture');
		expect(names).not.toContain('itemProp');
		expect(names).not.toContain('key');
		expect(names).not.toContain('ref');

		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
			'LoadingSpinnerProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(true);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	"keeps InputGroupInput's documented aria-label and inputMode visible while hiding generic DOM props",
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
			'InputGroupInputProps',
		);
		for (const prop of ['aria-label', 'className', 'inputMode', 'ref', 'size'] as const) {
			expect(names).toContain(prop);
		}
		for (const prop of [...GENERIC_DOM_NOISE, 'key'] as const) {
			expect(names).not.toContain(prop);
		}

		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
			'InputGroupInputProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(true);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'keeps a pure native wrapper empty while still forwarding DOM props',
	async () => {
		const names = await visiblePropNames(
			'packages/@luke-ui/react/src/core/code/code.tsx',
			'CodeProps',
		);
		expect(names).toEqual([]);
		for (const prop of [...GENERIC_DOM_NOISE, 'key', 'ref'] as const) {
			expect(names).not.toContain(prop);
		}

		const { declaration } = await loadDoc(
			'packages/@luke-ui/react/src/core/code/code.tsx',
			'CodeProps',
		);
		expect(typeForwardsDomProps(declaration, reactSrcDir)).toBe(true);
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
 * `Code`, `Kbd`, `Prose` and the two checkbox anatomy parts are pure element wrappers: their guides
 * teach only that they render a native element with the component's own styling, and their source
 * is a bare `extends ComponentProps<'code' | 'kbd' | 'div' | 'span'>`. They document no Luke UI
 * contract beyond pass-through DOM props, so their filtered tables are intentionally empty and rely
 * on the native-props note alone.
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
		visible: [],
	},
	{
		forwardsDomProps: true,
		name: 'KbdProps',
		path: 'packages/@luke-ui/react/src/core/kbd/kbd.tsx',
		visible: [],
	},
	{
		forwardsDomProps: true,
		name: 'ProseProps',
		path: 'packages/@luke-ui/react/src/core/prose/prose.tsx',
		visible: [],
	},
	{
		forwardsDomProps: true,
		name: 'CheckboxControlProps',
		path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
		visible: [],
	},
	{
		forwardsDomProps: true,
		name: 'CheckboxIndicatorProps',
		path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
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
		// The guide teaches `aria-label` and `inputMode` on `InputGroupInput` for standalone inputs.
		forwardsDomProps: true,
		name: 'InputGroupInputProps',
		path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
		visible: [
			'aria-label',
			'className',
			'inputMode',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'placeholder',
			'ref',
			'render',
			'size',
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

test.each(AUDITED_TYPES)(
	'$name documents its own contract without generic DOM props',
	async ({ forwardsDomProps, hidden = [], name, path, visible }) => {
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
	'does not treat every union as DOM forwarding',
	async () => {
		const project = await getSharedPropProject(repoRoot);

		// A union of two plain object types forwards nothing, even though the union-aware walk visits
		// both constituents.
		expect(
			forwardsDomPropsForExport(project as PropProject, UNION_FIXTURE_PATH, 'PlainUnionProps'),
		).toBe(false);
		// One DOM-forwarding constituent is enough for the whole union to forward.
		expect(
			forwardsDomPropsForExport(project as PropProject, UNION_FIXTURE_PATH, 'MixedUnionProps'),
		).toBe(true);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test(
	'documents every branch of a union, not only the props common to all of them',
	async () => {
		const project = await getSharedPropProject(repoRoot);
		const declaration = loadExportedPropDeclaration(
			project as PropProject,
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
 * Exact visible-prop sets for types whose shape depends on how React and React Aria declare their
 * own interfaces. The structural analysis reads that upstream syntax, so an upstream release that
 * moves a prop between a curated contract and a generic element attribute bag changes what these
 * tables show. Pinning the whole set makes that change fail here loudly instead of silently
 * rewriting a published API table.
 */
const PINNED_VISIBLE_PROPS: ReadonlyArray<{
	exportName: string;
	name: string;
	path: string;
	props: ReadonlyArray<string>;
}> = [
	{
		// Every prop arrives through `Pick<SVGAttributes<SVGSVGElement>, …>` or a Luke UI interface, so
		// nothing here may come from inheriting an attribute bag.
		exportName: 'IconProps',
		name: 'IconProps',
		path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
		props: ['aria-hidden', 'className', 'id', 'name', 'size', 'style', 'title', 'viewBox'],
	},
	{
		// `Text` omits RAC's `Text` props it redeclares and adds its own typography contract. Everything
		// below `HTMLAttributes` must be gone.
		exportName: 'TextProps',
		name: 'TextProps',
		path: 'packages/@luke-ui/react/src/core/text/text.tsx',
		props: [
			'color',
			'elementType',
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
		// A bare `extends ComponentProps<'code'>`: no Luke UI contract props, only pass-through DOM.
		exportName: 'CodeProps',
		name: 'CodeProps',
		path: 'packages/@luke-ui/react/src/core/code/code.tsx',
		props: [],
	},
	{
		exportName: 'LoadingSpinnerProps',
		name: 'LoadingSpinnerProps',
		path: 'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
		props: ['aria-label', 'children', 'color', 'isLoading', 'size'],
	},
	{
		exportName: 'InputGroupInputProps',
		name: 'InputGroupInputProps',
		path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
		props: [
			'aria-label',
			'className',
			'inputMode',
			'onHoverChange',
			'onHoverEnd',
			'onHoverStart',
			'placeholder',
			'ref',
			'render',
			'size',
		],
	},
	{
		// The five button-shaped types below all inherit `AriaBaseButtonProps` (react-aria's
		// `useButton`), which declares `ARIA_BASE_BUTTON_LONG_TAIL` directly alongside genuinely
		// documented siblings on the same interface body — see the comment above that list.
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
			'endIcon',
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
			'render',
			'size',
			'slot',
			'startIcon',
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
			'appearance',
			'aria-describedby',
			'aria-details',
			'aria-label',
			'aria-labelledby',
			'autoFocus',
			'children',
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

test.each(PINNED_VISIBLE_PROPS)(
	'$name shows exactly its documented props',
	async ({ exportName, path, props }) => {
		const names = await visiblePropNames(path, exportName);
		expect([...names].sort()).toEqual([...props].sort());
	},
	TS_MORPH_TEST_TIMEOUT,
);
