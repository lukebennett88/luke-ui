import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loader } from 'fumadocs-core/source';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { docs as docsCollection } from '../../.source/server.js';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { stringifyComponentPropsTable } from './stringify-component-props-table.js';
import type { TypeDefinitionsPayload } from './type-definition-model.js';

const source = loader({
	baseUrl: '/',
	source: docsCollection.toFumadocsSource(),
});

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const componentPropsGenerator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

// The first generator call in this file builds the shared ts-morph project, which is slow under
// load. That test gets the same generous timeout as `component-prop-analysis.test.ts`.
const TS_MORPH_TEST_TIMEOUT = 30_000;

async function processedApi(slugs: Array<string>): Promise<string> {
	const page = source.getPage(slugs);
	expect(page).toBeDefined();
	const processed = await page!.data.getText('processed');
	return processed.slice(processed.indexOf('## API'));
}

test('component-props-table through Fumadocs MDX becomes processed Markdown props tables', async () => {
	const page = source.getPage(['components', 'actions', 'button']);
	expect(page).toBeDefined();

	const processed = await page!.data.getText('processed');
	const api = processed.slice(processed.indexOf('## API'));

	expect(api).toContain('### ButtonProps');
	expect(api).toContain('| Prop');
	expect(api).toContain('`appearance?`');
	expect(api).toContain(
		'`ButtonProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
	expect(api).not.toContain('ComponentPropsTable');
	expect(api).not.toContain('<component-props-table');
	expect(api).not.toContain('"entries"');
	expect(api).not.toContain(NATIVE_PROPS_FORWARDING_KEY);
});

test('stringify leaves unrelated nodes to the default Fumadocs stringifier', () => {
	expect(
		stringifyComponentPropsTable({
			attributes: [],
			name: 'ExampleBlock',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toBeUndefined();
	expect(stringifyComponentPropsTable({ type: 'paragraph' })).toBeUndefined();
});

test('stringify throws when ComponentPropsTable has no GeneratedDoc JSON on `type`', () => {
	expect(() =>
		stringifyComponentPropsTable({
			attributes: [],
			name: 'ComponentPropsTable',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toThrow(/requires a `type` expression with GeneratedDoc JSON/);
});

test('stringify throws when ComponentPropsTable `type` is not valid GeneratedDoc JSON', () => {
	expect(() =>
		stringifyComponentPropsTable({
			attributes: [
				{
					name: 'type',
					type: 'mdxJsxAttribute',
					value: {
						type: 'mdxJsxAttributeValueExpression',
						value: 'not-json',
					},
				},
			],
			name: 'ComponentPropsTable',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toThrow(/not valid GeneratedDoc JSON/);
});

test('processed Markdown lists the Grid and Stack type definitions after their tables', async () => {
	const grid = await processedApi(['components', 'layout', 'grid']);
	const definitions = grid.slice(grid.indexOf('#### Type definitions'));

	expect(grid).toContain('`RequiredInitialResponsiveValue<number \\| string>`');
	expect(grid).toContain('`RequiredInitialResponsiveValue<ReadonlyArray<string>>`');
	expect(definitions).toContain(
		'##### `RequiredInitialResponsiveValue`\n\n```ts\ntype RequiredInitialResponsiveValue<Value>',
	);
	expect(definitions).toContain('Refers to `RequiredInitialResponsive` and `ResponsivePropValue`.');
	// Code blocks keep the build's line breaks, the same tokens the popover shows.
	expect(definitions).toContain(
		'```ts\n"bp640"\n  | "bp768"\n  | "bp1024"\n  | "bp1280"\n  | "bp1536"\n  | "initial"\n```',
	);
	expect(grid).not.toContain('&#x22;');

	const stack = await processedApi(['components', 'layout', 'stack']);
	expect(stack).toContain("`RequiredInitialResponsive<SprinklesProps['gap']>`");
	expect(stack).toMatch(
		/##### `SprinklesProps\['gap'\]`\n\nResolves to:\n\n```ts\nResponsiveValue<"0"\n {2}\| "space.4"\n {2}\|/,
	);
});

test('processed Markdown shows long resolved forms in full', async () => {
	const grid = await processedApi(['components', 'layout', 'grid']);
	const shape = grid.slice(grid.indexOf('##### `SprinklesPropsShape`'));
	const resolved = shape.slice(shape.indexOf('Which resolves to:'), shape.indexOf('\n##### '));

	// The mapped type hides which Sprinkles props exist. Its expansion lists every one with its values.
	expect(resolved.length).toBeGreaterThan(400);
	expect(resolved).toContain('  readonly alignContent?: ResponsiveValue<"center"\n    | "end"');
	expect(resolved).toContain('  readonly justifyContent?: ResponsiveValue<');
	expect(resolved).toContain('  readonly rowGap?: ResponsiveValue<');

	const bleed = await processedApi(['components', 'layout', 'bleed']);
	expect(bleed).toContain(
		"##### `BleedSpaceProp`\n\n```ts\ntype BleedSpaceProp = ResponsivePropValue<'0' | SpaceToken>;\n```",
	);
	expect(bleed).toContain('##### `SpaceToken`');
	expect(bleed).toMatch(
		/##### `SpaceStep`\n\n```ts\n[^`]+```\n\nWhich resolves to:\n\n```ts\n"4"\n/,
	);
});

test('processed Markdown shows Button render props and callbacks with their definitions', async () => {
	const button = await processedApi(['components', 'actions', 'button']);

	expect(button).toContain('`ChildrenOrFunction<ButtonRenderProps>`');
	expect(button).not.toContain('`ChildrenOrFunction<T>`');
	expect(button).toContain(
		'##### `PressAction`\n\n```ts\ntype PressAction = () => void | Promise<void>;\n```',
	);
	expect(button).toMatch(
		/##### `ChildrenOrFunction`\n\nDeclared in \[`react-aria-components`\]\(https:\/\/www\.npmjs\.com\/package\/react-aria-components\) \(`[^`]+\.d\.ts`\)\.\n\n```ts\ntype ChildrenOrFunction<T>/,
	);
});

test(
	'processed Markdown keeps optional and explicit-undefined props distinct',
	async () => {
		const [doc] = await componentPropsGenerator.generateTypeTable(
			{
				name: 'OptionalityDocProps',
				path: 'apps/docs/src/lib/__fixtures__/optionality-doc-props.ts',
			},
			{ basePath: repoRoot },
		);
		const markdown = stringifyComponentPropsTable(tableNode(doc));

		expect(markdown).toMatch(/\| `first\?` +\| `string` +\|/);
		expect(markdown).toMatch(/\| `second\?` +\| `string \\\| undefined` +\|/);
		expect(markdown).toMatch(/\| `third` +\| `string \\\| undefined` +\|/);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test('stringify lists Luke UI definitions before external types and labels shared names', () => {
	const typeDefinitions: TypeDefinitionsPayload = {
		KeyboardEvent: {
			definition: ['type KeyboardEvent = BaseEvent<ReactKeyboardEvent<any>>;'],
			module: '@react-types/shared',
			name: 'KeyboardEvent',
			references: ['KeyboardEvent (@types/react)'],
			source: 'src/events.d.ts',
		},
		'KeyboardEvent (@types/react)': {
			module: '@types/react',
			name: 'KeyboardEvent',
			references: [],
			source: 'index.d.ts',
		},
		Size: {
			definition: [
				['k', 'type'],
				' ',
				['t', 'Size'],
				' = ',
				['s', "'small'"],
				' |\u2060\u00a0',
				['s', "'medium'"],
				';',
			],
			name: 'Size',
			references: [],
		},
		"Spacing['gap']": {
			name: "Spacing['gap']",
			references: ['Size'],
			resolved: [
				['s', '"space.4"'],
				1,
				'|\u2060\u00a0',
				['s', '"space.8"'],
				1,
				'|\u2060\u00a0',
				['k', 'undefined'],
			],
		},
	};

	expect(stringifyComponentPropsTable(tableNode({ entries: [], name: 'Props' }, typeDefinitions)))
		.toBe(`### Props

#### Type definitions

These are the types that this table's signatures and the definitions below name. TypeScript's built-in types, such as \`Omit\` and \`ReadonlyArray\`, are not listed.

##### \`Size\`

\`\`\`ts
type Size = 'small' | 'medium';
\`\`\`

##### \`Spacing['gap']\`

Resolves to:

\`\`\`ts
"space.4"
  | "space.8"
  | undefined
\`\`\`

Refers to \`Size\`.

##### \`KeyboardEvent\`

Declared in [\`@react-types/shared\`](https://www.npmjs.com/package/@react-types/shared) (\`src/events.d.ts\`).

\`\`\`ts
type KeyboardEvent = BaseEvent<ReactKeyboardEvent<any>>;
\`\`\`

Refers to \`KeyboardEvent\` from \`@types/react\`.

##### \`KeyboardEvent\` from \`@types/react\`

Declared in [\`@types/react\`](https://www.npmjs.com/package/@types/react) (\`index.d.ts\`).`);
});

test('stringify fences a definition longer than the backtick runs inside it', () => {
	const definition =
		'interface Example {\n\t/** Shows ```ts code``` in JSDoc. */\n\tvalue: string;\n}';
	const markdown = stringifyComponentPropsTable(
		tableNode(
			{ entries: [], name: 'Props' },
			{ Example: { definition: [definition], name: 'Example', references: [] } },
		),
	);

	expect(markdown).toContain(`\`\`\`\`ts\n${definition}\n\`\`\`\``);
});

function tableNode(
	doc: object | undefined,
	typeDefinitions?: TypeDefinitionsPayload,
): { type: string } {
	return {
		attributes: [
			{
				name: 'type',
				type: 'mdxJsxAttribute',
				value: { type: 'mdxJsxAttributeValueExpression', value: JSON.stringify(doc) },
			},
		],
		...(typeDefinitions === undefined ? {} : { data: { typeDefinitions } }),
		name: 'ComponentPropsTable',
		type: 'mdxJsxFlowElement',
	} as { type: string };
}
