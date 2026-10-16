import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { visit } from 'unist-util-visit';
import type { EnrichedGeneratedDoc, TypeDefinitionsPayload } from './type-definition-model.js';

interface MdastRoot {
	children: Array<unknown>;
	type: 'root';
}

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value?: string | MdxJsxAttributeValueExpression | null;
}

interface MdxJsxAttributeValueExpression {
	data?: { estree?: unknown };
	type: 'mdxJsxAttributeValueExpression';
	value: string;
}

interface MdxJsxFlowElement {
	attributes: Array<MdxJsxAttribute | { type: 'mdxJsxExpressionAttribute' }>;
	name?: string | null;
	type: 'mdxJsxFlowElement';
}

/**
 * Moves each expanded `<ComponentPropsTable>`'s type definitions into a JSON file that the page
 * imports with `?url`. The table then fetches its definitions when a reader first opens a type.
 *
 * Each file is named by a hash of its contents, so two tables share a file only when their
 * definitions are identical. Vite emits only the files a page imports, so files that earlier runs
 * left in `outputDir` never ship.
 */
export function remarkAttachTypeDefinitions({ outputDir }: { outputDir: string }) {
	return (tree: MdastRoot, file: { path: string }) => {
		const imports: Array<unknown> = [];

		visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name !== 'ComponentPropsTable') return;

			const expression = typeExpression(node);
			const { typeDefinitions = {}, ...doc } = JSON.parse(expression.value) as EnrichedGeneratedDoc;
			expression.value = JSON.stringify(doc, null, 2);

			const names = Object.keys(typeDefinitions);
			if (names.length === 0) return;

			const assetPath = writeDefinitionsAsset(outputDir, typeDefinitions);
			const identifier = `typeDefinitionsHref${imports.length}`;
			imports.push(urlImport(identifier, importSpecifier(file.path, assetPath)));
			node.attributes.push(
				expressionAttribute('definitionsHref', identifier, {
					name: identifier,
					type: 'Identifier',
				}),
				expressionAttribute('definitionNames', JSON.stringify(names), {
					elements: names.map((name) => ({ type: 'Literal', value: name })),
					type: 'ArrayExpression',
				}),
			);
		});

		tree.children.unshift(...imports);
	};
}

function typeExpression(node: MdxJsxFlowElement): MdxJsxAttributeValueExpression {
	for (const attribute of node.attributes) {
		if (attribute.type !== 'mdxJsxAttribute' || attribute.name !== 'type') continue;
		if (typeof attribute.value === 'object' && attribute.value !== null) return attribute.value;
	}
	throw new Error('<ComponentPropsTable> needs a `type` expression with GeneratedDoc JSON.');
}

function writeDefinitionsAsset(outputDir: string, definitions: TypeDefinitionsPayload): string {
	const json = `${JSON.stringify(definitions)}\n`;
	const hash = createHash('sha256').update(json).digest('hex').slice(0, 16);
	const assetPath = join(outputDir, `${hash}.json`);
	// The name is the content hash, so an existing file already holds these definitions.
	if (existsSync(assetPath)) return assetPath;

	mkdirSync(outputDir, { recursive: true });
	writeFileSync(assetPath, json);
	return assetPath;
}

/** `no-inline` keeps small files as separate assets instead of `data:` URLs in the page chunk. */
function importSpecifier(pagePath: string, assetPath: string): string {
	const path = relative(dirname(pagePath), assetPath).split(sep).join('/');
	return `${path.startsWith('.') ? path : `./${path}`}?url&no-inline`;
}

function urlImport(identifier: string, specifier: string) {
	return {
		data: {
			estree: {
				body: [
					{
						attributes: [],
						source: { type: 'Literal', value: specifier },
						specifiers: [
							{ local: { name: identifier, type: 'Identifier' }, type: 'ImportDefaultSpecifier' },
						],
						type: 'ImportDeclaration',
					},
				],
				sourceType: 'module',
				type: 'Program',
			},
		},
		type: 'mdxjsEsm',
		value: `import ${identifier} from ${JSON.stringify(specifier)};`,
	};
}

/** `source` is the expression as MDX text. `expression` is the estree MDX compiles. */
function expressionAttribute(name: string, source: string, expression: unknown): MdxJsxAttribute {
	return {
		name,
		type: 'mdxJsxAttribute',
		value: {
			data: {
				estree: {
					body: [{ expression, type: 'ExpressionStatement' }],
					sourceType: 'module',
					type: 'Program',
				},
			},
			type: 'mdxJsxAttributeValueExpression',
			value: source,
		},
	};
}
