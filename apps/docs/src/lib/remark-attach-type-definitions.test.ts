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
import { parseTypeDefinitionsPayload } from './type-definition-model.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const componentPropsGenerator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});

let outputDir: string | undefined;

afterEach(() => {
	if (outputDir !== undefined) rmSync(outputDir, { force: true, recursive: true });
	outputDir = undefined;
});

test('gives the HTML definitions asset and processed Markdown the same type model', async () => {
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

	// The HTML table fetches this asset when a reader opens a linked type.
	const [assetName] = readdirSync(outputDir).filter((name) => name.endsWith('.json'));
	const asset = parseTypeDefinitionsPayload(
		JSON.parse(readFileSync(join(outputDir, assetName!), 'utf8')),
	);
	expect(asset).toEqual(model);
	expect(attributeSource(node, 'definitionNames')).toContain('"RequiredInitialResponsiveValue"');
	expect(attributeSource(node, 'type')).not.toContain('typeDefinitions');

	const markdown = stringifyComponentPropsTable(node);
	expect(markdown).toMatch(
		/\| `columns\?` +\| `RequiredInitialResponsiveValue<number \\\| string>`/,
	);
	const missingFromMarkdown = Object.values(asset)
		.flatMap((definition) => [
			`##### \`${definition.name}\``,
			...[definition.definition, definition.resolved].flatMap((code) =>
				code === undefined ? [] : [`\`\`\`ts\n${code}\n\`\`\``],
			),
		])
		.filter((snippet) => !markdown?.includes(snippet));
	expect(missingFromMarkdown).toEqual([]);
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
