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
	typeForwardsDomPropsForExport,
} from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
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
			typeForwardsDomPropsForExport(
				await getSharedPropProject(repoRoot),
				repoRoot,
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
	'never renders an empty prop table for any documented component type',
	async () => {
		// Guards against the whole class of bug this branch fixes: a table with zero visible props.
		// `CodeProps`/`KbdProps`/`ProseProps`/checkbox anatomy parts previously showed nothing because
		// their entire flattened type came from outside Luke UI source.
		const previouslyEmptyTypes: ReadonlyArray<readonly [string, string]> = [
			['packages/@luke-ui/react/src/core/code/code.tsx', 'CodeProps'],
			['packages/@luke-ui/react/src/core/kbd/kbd.tsx', 'KbdProps'],
			['packages/@luke-ui/react/src/core/prose/prose.tsx', 'ProseProps'],
			['packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx', 'CheckboxControlProps'],
			[
				'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
				'CheckboxIndicatorProps',
			],
			[
				'packages/@luke-ui/react/src/core/primitives/field/description.tsx',
				'FieldDescriptionProps',
			],
			['packages/@luke-ui/react/src/core/primitives/field/error.tsx', 'FieldErrorProps'],
			[
				'packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx',
				'VisuallyHiddenProps',
			],
		];

		const results = await Promise.all(
			previouslyEmptyTypes.map(async ([path, name]) => ({
				name,
				path,
				names: await visiblePropNames(path, name),
			})),
		);

		for (const { name, path, names } of results) {
			expect(names.length, `${name} at ${path} rendered an empty prop table`).toBeGreaterThan(0);
		}
	},
	TS_MORPH_TEST_TIMEOUT,
);
