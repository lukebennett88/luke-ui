import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
} from './component-prop-analysis.js';
import type { PropProject } from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
const docsComponentsDir = resolve(repoRoot, 'apps/docs/content/docs/components');
const generator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});
const TS_MORPH_TEST_TIMEOUT = 30_000;

/**
 * Props each component guide explicitly teaches as intentional Luke UI behaviour. Every entry was
 * checked against the matching generated API table. Props that are generic platform pass-through
 * and only mentioned as alternatives (for example `aria-label` on `Button` when the visible label
 * already names the control) are omitted here.
 */
const GUIDE_TAUGHT_PROPS: ReadonlyArray<{
	guide: string;
	name: string;
	path: string;
	props: ReadonlyArray<string>;
}> = [
	{
		guide: 'actions/button.mdx',
		name: 'ButtonProps',
		path: 'packages/@luke-ui/react/src/core/button/button.tsx',
		props: [
			'appearance',
			'isBlock',
			'isDisabled',
			'isPending',
			'size',
			'startIcon',
			'endIcon',
			'tone',
		],
	},
	{
		guide: 'actions/icon-button.mdx',
		name: 'IconButtonProps',
		path: 'packages/@luke-ui/react/src/core/icon-button/icon-button.tsx',
		props: ['appearance', 'icon', 'isDisabled', 'isPending', 'size', 'tone'],
	},
	{
		guide: 'actions/link.mdx',
		name: 'LinkProps',
		path: 'packages/@luke-ui/react/src/core/link/link.tsx',
		props: ['href', 'isDisabled', 'isStandalone', 'tone'],
	},
	{
		guide: 'feedback/loading-skeleton.mdx',
		name: 'LoadingSkeletonProps',
		path: 'packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx',
		props: ['elementType', 'isLoading', 'radius'],
	},
	{
		guide: 'feedback/loading-spinner.mdx',
		name: 'LoadingSpinnerProps',
		path: 'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
		props: ['aria-label', 'color', 'isLoading', 'size'],
	},
	{
		guide: 'forms/checkbox.mdx',
		name: 'CheckboxProps',
		path: 'packages/@luke-ui/react/src/core/checkbox/checkbox.tsx',
		props: [
			'defaultSelected',
			'description',
			'errorMessage',
			'inputRef',
			'isDisabled',
			'isIndeterminate',
			'isReadOnly',
			'isRequired',
			'isSelected',
			'onChange',
			'size',
		],
	},
	{
		guide: 'forms/combobox-field.mdx',
		name: 'ComboboxFieldProps',
		path: 'packages/@luke-ui/react/src/core/combobox-field/combobox-field.tsx',
		props: [
			'defaultItems',
			'errorMessage',
			'inputRef',
			'isRequired',
			'items',
			'label',
			'listBoxProps',
			'loadMoreItem',
			'loadingState',
			'menuWidth',
			'name',
			'necessityIndicator',
			'onLoadMore',
			'placeholder',
			'popoverProps',
			'size',
			'validate',
		],
	},
	{
		guide: 'forms/text-field.mdx',
		name: 'TextFieldProps',
		path: 'packages/@luke-ui/react/src/core/text-field/text-field.tsx',
		props: [
			'aria-label',
			'errorMessage',
			'isRequired',
			'label',
			'necessityIndicator',
			'pattern',
			'placeholder',
			'prefix',
			'size',
			'suffix',
			'type',
			'validate',
		],
	},
	{
		guide: 'layout/box.mdx',
		name: 'BoxProps',
		path: 'packages/@luke-ui/react/src/core/box/box.tsx',
		props: ['elementType', 'ref', 'render'],
	},
	{
		guide: 'layout/visually-hidden.mdx',
		name: 'VisuallyHiddenProps',
		path: 'packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx',
		props: ['elementType'],
	},
	{
		guide: 'primitives/combobox.mdx',
		name: 'ComboboxRootProps',
		path: 'packages/@luke-ui/react/src/core/primitives/combobox/root.tsx',
		props: ['aria-label', 'size'],
	},
	{
		guide: 'primitives/input-group.mdx',
		name: 'InputGroupInputProps',
		path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
		props: ['aria-label', 'className', 'inputMode', 'ref', 'size'],
	},
	{
		guide: 'primitives/input-group.mdx',
		name: 'InputGroupProps',
		path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
		props: ['className', 'isInvalid', 'size'],
	},
	{
		guide: 'typography/blockquote.mdx',
		name: 'BlockquoteProps',
		path: 'packages/@luke-ui/react/src/core/blockquote/blockquote.tsx',
		props: ['fontWeight', 'lineClamp', 'typography'],
	},
	{
		guide: 'typography/em.mdx',
		name: 'EmProps',
		path: 'packages/@luke-ui/react/src/core/em/em.tsx',
		props: ['lineClamp', 'textWrap'],
	},
	{
		guide: 'typography/emoji.mdx',
		name: 'EmojiProps',
		path: 'packages/@luke-ui/react/src/core/emoji/emoji.tsx',
		props: ['emoji', 'label'],
	},
	{
		guide: 'typography/heading.mdx',
		name: 'HeadingProps',
		path: 'packages/@luke-ui/react/src/core/heading/heading.tsx',
		props: ['level', 'typography'],
	},
	{
		guide: 'typography/numeral.mdx',
		name: 'NumeralProps',
		path: 'packages/@luke-ui/react/src/core/numeral/numeral.tsx',
		props: [
			'currency',
			'format',
			'formatOptions',
			'fontVariantNumeric',
			'textAlign',
			'unit',
			'value',
		],
	},
	{
		guide: 'typography/quote.mdx',
		name: 'QuoteProps',
		path: 'packages/@luke-ui/react/src/core/quote/quote.tsx',
		props: ['cite', 'lineClamp', 'textWrap'],
	},
	{
		guide: 'typography/strong.mdx',
		name: 'StrongProps',
		path: 'packages/@luke-ui/react/src/core/strong/strong.tsx',
		props: ['lineClamp', 'textWrap'],
	},
	{
		guide: 'typography/text.mdx',
		name: 'TextProps',
		path: 'packages/@luke-ui/react/src/core/text/text.tsx',
		props: [
			'elementType',
			'fontVariantNumeric',
			'fontWeight',
			'lineClamp',
			'shouldDisableTrim',
			'textAlign',
			'textDecoration',
			'textTransform',
			'textWrap',
			'typography',
		],
	},
	{
		guide: 'visuals/icon.mdx',
		name: 'IconProps',
		path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
		props: ['title'],
	},
];

async function visiblePropNames(path: string, name: string): Promise<Array<string>> {
	const [doc] = await generator.generateTypeTable({ path, name }, { basePath: repoRoot });
	const project = await getSharedPropProject(repoRoot);
	const declaration = loadExportedPropDeclaration(project as PropProject, repoRoot, path, name);
	if (doc === undefined || declaration === undefined) {
		throw new Error(`Missing documentation for ${name} in ${path}`);
	}
	return filterGeneratedDoc(doc, declaration, reactSrcDir).entries.map((entry) => entry.name);
}

test.each(GUIDE_TAUGHT_PROPS)(
	'$guide teaches documented props on $name',
	async ({ guide, name, path, props }) => {
		const names = await visiblePropNames(path, name);
		for (const prop of props) {
			expect(names, `${guide} teaches ${prop} on ${name}`).toContain(prop);
		}
	},
	TS_MORPH_TEST_TIMEOUT,
);

/** Every main component guide (not legacy `/props` pages) declares at least one API table. */
test('every main component guide declares a component-props-table', () => {
	const missing: Array<string> = [];

	function walk(dir: string, prefix = ''): void {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === 'props.mdx' || entry.name === 'index.mdx') continue;
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				walk(join(dir, entry.name), relative);
				continue;
			}
			if (!entry.name.endsWith('.mdx')) continue;
			const content = readFileSync(join(dir, entry.name), 'utf8');
			if (!content.includes('<component-props-table')) {
				missing.push(relative);
			}
		}
	}

	walk(docsComponentsDir);
	expect(missing).toEqual([]);
});
