import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { buildComponentGuideInventory } from './component-guide-inventory.js';
import { findComponentPropsContractIssues } from './component-props-contract.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}
	testDirectories.length = 0;
});

test('requires component props from an exported component parameter', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonProps } from './button.js';\n",
		files: {
			'button.ts':
				'export interface ButtonProps {}\nexport function Button(props: ButtonProps) {}\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ButtonProps" in props frontmatter',
	]);
});

test('requires provider props from an exported provider parameter', () => {
	const fixture = createFixture({
		entry: "export { Provider, type ProviderProps } from './provider.js';\n",
		files: {
			'provider.ts':
				'export interface ProviderProps {}\nexport function Provider(props: ProviderProps) {}\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ProviderProps" in props frontmatter',
	]);
});

test('requires factory options and the factory return type', () => {
	const fixture = createFixture({
		entry:
			"export { createThing, type CreateThingOptions, type CreatedThing } from './factory.js';\n",
		files: {
			'factory.ts':
				"export interface CreateThingOptions {}\nexport type CreatedThing = { value: string };\nexport function createThing(options: CreateThingOptions): CreatedThing { return { value: 'thing' }; }\n",
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "CreateThingOptions" in props frontmatter',
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "CreatedThing" in props frontmatter',
	]);
});

test('requires a render callback value', () => {
	const fixture = createFixture({
		entry: "export { createRender, type RenderProps } from './render.js';\n",
		files: {
			'render.ts':
				'export type RenderProps = { value: string };\nexport function createRender(): (props: RenderProps) => string { return ({ value }) => value; }\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "RenderProps" in props frontmatter',
	]);
});

test('requires a named object generic constraint', () => {
	const fixture = createFixture({
		entry: "export { createThing, type ThingProps } from './factory.js';\n",
		files: {
			'factory.ts':
				'export type ThingProps = { value: string };\nexport function createThing<T extends ThingProps>(): T { throw new Error(); }\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ThingProps" in props frontmatter',
	]);
});

test('requires contracts from a multipart entry point', () => {
	const fixture = createFixture({
		entry: "export { Root, Item, type RootProps, type ItemProps } from './parts.js';\n",
		files: {
			'parts.ts':
				'export interface RootProps {}\nexport interface ItemProps {}\nexport function Root(props: RootProps) {}\nexport function Item(props: ItemProps) {}\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "RootProps" in props frontmatter',
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ItemProps" in props frontmatter',
	]);
});

test('requires contracts re-exported through an intermediate local module', () => {
	const fixture = createFixture({
		entry: "export { FieldLabel, type FieldLabelProps } from './field.js';\n",
		files: {
			'field.ts':
				"import type { FieldLabelProps } from './label.js';\nimport { FieldLabel } from './label.js';\nexport type { FieldLabelProps };\nexport { FieldLabel };\n",
			'label.ts':
				'export interface FieldLabelProps {}\nexport function FieldLabel(props: FieldLabelProps) {}\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "FieldLabelProps" in props frontmatter',
	]);
});

test('excludes a recipe variant type', () => {
	const fixture = createFixture({
		entry: "export { buttonRecipe, type ButtonRecipeVariants } from './recipe.css.js';\n",
		files: { 'recipe.css.ts': 'export type ButtonRecipeVariants = { size: string };\n' },
	});

	expect(issues(fixture)).toEqual([]);
});

test('excludes a leaf type', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonSize } from './button.js';\n",
		files: {
			'button.ts':
				"export type ButtonSize = 'small' | 'large';\nexport function Button(size: ButtonSize) {}\n",
		},
	});

	expect(issues(fixture)).toEqual([]);
});

test('excludes a leaf alias of a union', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonSize } from './button.js';\n",
		files: {
			'button.ts':
				"type Size = 'small' | 'large';\nexport type ButtonSize = Size;\nexport function Button(size: ButtonSize) {}\n",
		},
	});

	expect(issues(fixture)).toEqual([]);
});

test('excludes an indirect leaf alias', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonSize } from './button.js';\n",
		files: {
			'button.ts':
				"type Size = 'small' | 'large';\ntype Alias = Size;\nexport type ButtonSize = Alias;\nexport function Button(size: ButtonSize) {}\n",
		},
	});

	expect(issues(fixture)).toEqual([]);
});

test('requires an indirect alias that resolves to an object type', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonProps } from './button.js';\n",
		files: {
			'button.ts':
				'type Inner = { value: string };\ntype Alias = Inner;\nexport type ButtonProps = Alias;\nexport function Button(props: ButtonProps) {}\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ButtonProps" in props frontmatter',
	]);
});

test('reports an unsupported relevant exported signature', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonProps } from './button.js';\n",
		files: {
			'button.ts':
				'export interface ButtonProps {}\nexport declare const Button: (props: ButtonProps) => unknown;\n',
		},
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" has an unsupported exported signature "Button"',
	]);
});

test('does not treat a typed data constant as an unsupported signature', () => {
	const fixture = createFixture({
		entry: "export { iconNames, iconViewBoxes } from './icon.js';\n",
		files: {
			'icon.ts':
				"export const iconNames = ['add'] as const;\nexport const iconViewBoxes: Record<string, string> = { add: '0 0 24 24' };\n",
		},
	});

	expect(issues(fixture)).toEqual([]);
});

test('does not follow public re-exports outside the entry directory', () => {
	const fixture = createFixture({
		entry: "export { Icon, iconNames, type IconProps } from './icon.js';\n",
		files: {
			'icon.ts':
				"import { iconNames } from '../generated/icon-data.js';\nexport { iconNames };\nexport interface IconProps {}\nexport function Icon(props: IconProps) {}\n",
			'../generated/icon-data.ts':
				'export declare const iconNames: (props: IconProps) => unknown;\n',
		},
		props: ['IconProps'],
	});

	expect(issues(fixture)).toEqual([]);
});

test('reports frontmatter props that the entry point does not export', () => {
	const fixture = createFixture({
		entry: "export { Button, type ButtonProps } from './button.js';\n",
		files: {
			'button.ts':
				'export interface ButtonProps {}\nexport function Button(props: ButtonProps) {}\n',
		},
		props: ['MissingProps'],
	});

	expect(issues(fixture)).toEqual([
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" requires public object contract "ButtonProps" in props frontmatter',
		'actions/button.mdx: entry point "packages/@luke-ui/react/src/button/index.ts" does not export props frontmatter type "MissingProps"',
	]);
});

function createFixture(input: {
	entry: string;
	files: Record<string, string>;
	props?: ReadonlyArray<string>;
}): { inventory: ReturnType<typeof buildComponentGuideInventory>; reactPackageDir: string } {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-component-props-contract-'));
	testDirectories.push(directory);

	const componentsDir = join(directory, 'content', 'components');
	const reactPackageDir = join(directory, 'react-package');
	const sourceDir = join(reactPackageDir, 'src', 'button');
	mkdirSync(componentsDir, { recursive: true });
	mkdirSync(sourceDir, { recursive: true });
	writeFileSync(join(componentsDir, 'meta.json'), '{"pages":["---Actions---","actions/button"]}');
	writeFileSync(
		join(reactPackageDir, 'package.json'),
		'{"exports":{"./button":"./dist/button/index.js"}}',
	);
	writeFileSync(join(sourceDir, 'index.ts'), input.entry);

	for (const [path, contents] of Object.entries(input.files)) {
		const filePath = join(sourceDir, path);
		mkdirSync(dirname(filePath), { recursive: true });
		writeFileSync(filePath, contents);
	}

	const props = input.props ?? [];
	const guide = `---\ntitle: Button\nsource: packages/@luke-ui/react/src/button\n${renderProps(props)}---\n`;
	return {
		inventory: buildComponentGuideInventory({
			componentsDir,
			guides: [{ group: 'actions', relativePath: 'actions/button.mdx', source: guide }],
			reactPackageJsonPath: join(reactPackageDir, 'package.json'),
		}),
		reactPackageDir,
	};
}

function renderProps(props: ReadonlyArray<string>): string {
	if (props.length === 0) return '';
	return `props:\n${props.map((name) => `  - name: ${name}\n    path: packages/@luke-ui/react/src/button/button.ts`).join('\n')}\n`;
}

function issues(fixture: {
	inventory: ReturnType<typeof buildComponentGuideInventory>;
	reactPackageDir: string;
}): Array<string> {
	return findComponentPropsContractIssues(fixture.inventory, fixture.reactPackageDir);
}
