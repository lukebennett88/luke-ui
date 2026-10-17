import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { afterEach, expect, test } from 'vite-plus/test';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { remarkAttachTypeDefinitions } from './remark-attach-type-definitions.js';
import { stringifyComponentPropsTable } from './stringify-component-props-table.js';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import { typeTokensToText } from './type-tokens.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const componentPropsGenerator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

// The first generator call in this file builds the shared ts-morph project, which is slow under
// load. That test gets the same generous timeout as `component-prop-analysis.test.ts`.
const TS_MORPH_TEST_TIMEOUT = 30_000;

let outputDir: string | undefined;

afterEach(() => {
	if (outputDir !== undefined) rmSync(outputDir, { force: true, recursive: true });
	outputDir = undefined;
});

test(
	'gives the HTML definitions asset and processed Markdown the same type model',
	async () => {
		const [gridProps] = (await componentPropsGenerator.generateTypeTable(
			{ name: 'GridProps', path: 'packages/@luke-ui/react/src/core/grid/grid.tsx' },
			{ basePath: repoRoot },
		)) as Array<EnrichedGeneratedDoc | undefined>;
		const model = gridProps?.typeDefinitions;
		expect(model).toBeDefined();

		outputDir = mkdtempSync(join(tmpdir(), 'type-definitions-'));
		const node = componentPropsTableNode(gridProps!);
		remarkAttachTypeDefinitions({ outputDir })(
			{ children: [node], type: 'root' },
			{ path: join(outputDir, 'grid.mdx') },
		);

		// The HTML table fetches this asset when a reader opens a linked type. It holds every Luke UI type
		// with a definition, so links inside a definition open too, and nothing else.
		const [assetName] = readdirSync(outputDir).filter((name) => name.endsWith('.json'));
		const asset = JSON.parse(readFileSync(join(outputDir, assetName!), 'utf8')) as Record<
			string,
			unknown
		>;
		const lukeEntries = Object.entries(model!).filter(
			([, definition]) =>
				definition.module === undefined &&
				(definition.definition !== undefined || definition.resolved !== undefined),
		);
		expect(asset).toEqual(
			Object.fromEntries(
				lukeEntries.map(([name, { definition, resolved }]) => [name, { definition, resolved }]),
			),
		);
		expect(Object.keys(asset)).toEqual(
			expect.arrayContaining([
				'BoxLikeElementType',
				'RequiredInitialResponsiveValue',
				'ResponsiveCondition',
			]),
		);
		expect(JSON.parse(attributeSource(node, 'definitionNames')!)).toEqual(Object.keys(asset));
		// Each row's tokens stay in the page, so the table renders before the asset loads.
		expect(JSON.parse(attributeSource(node, 'typeTokens')!)).toEqual(gridProps!.typeTokens);
		expect(attributeSource(node, 'type')).not.toContain('typeTokens');
		expect(attributeSource(node, 'type')).not.toContain('typeDefinitions');

		const markdown = stringifyComponentPropsTable(node);
		expect(markdown).toMatch(
			/\| `columns\?` +\| `RequiredInitialResponsiveValue<number \\\| string>`/,
		);
		// Markdown lists the whole model, so it holds every popover's text too.
		const missingFromMarkdown = Object.values(model!)
			.flatMap((definition) => [
				`##### \`${definition.name}\``,
				...[definition.definition, definition.resolved].flatMap((tokens) =>
					tokens === undefined
						? []
						: [`\`\`\`ts\n${typeTokensToText(tokens, { multiline: true })}\n\`\`\``],
				),
			])
			.filter((snippet) => !markdown?.includes(snippet));
		expect(missingFromMarkdown).toEqual([]);
	},
	TS_MORPH_TEST_TIMEOUT,
);

test('rejects an invalid type model at build time', () => {
	outputDir = mkdtempSync(join(tmpdir(), 'type-definitions-'));
	const node = componentPropsTableNode({
		entries: [],
		name: 'Props',
		typeDefinitions: { Broken: { definition: 1 } },
	} as unknown as EnrichedGeneratedDoc);

	expect(() =>
		remarkAttachTypeDefinitions({ outputDir: outputDir! })(
			{ children: [node], type: 'root' },
			{ path: join(outputDir!, 'page.mdx') },
		),
	).toThrow('Invalid type definitions payload');
});

interface TableNode {
	attributes: Array<{
		name: string;
		type: 'mdxJsxAttribute';
		value: { type: 'mdxJsxAttributeValueExpression'; value: string };
	}>;
	name: string;
	type: 'mdxJsxFlowElement';
}

/** The node `remarkAutoTypeTable` leaves for `<component-props-table>` with `remarkStringify`. */
function componentPropsTableNode(doc: EnrichedGeneratedDoc): TableNode {
	return {
		attributes: [
			{
				name: 'type',
				type: 'mdxJsxAttribute',
				value: { type: 'mdxJsxAttributeValueExpression', value: JSON.stringify(doc) },
			},
		],
		name: 'ComponentPropsTable',
		type: 'mdxJsxFlowElement',
	};
}

function attributeSource(node: TableNode, name: string): string | undefined {
	return node.attributes.find((attribute) => attribute.name === name)?.value.value;
}
