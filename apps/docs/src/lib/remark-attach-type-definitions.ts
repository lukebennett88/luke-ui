import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { visit } from 'unist-util-visit';
import type {
	EnrichedGeneratedDoc,
	LinkedTypeDefinitions,
	TypeDefinitionsPayload,
} from './type-definition-model.js';
import { parseTypeDefinitionsPayload } from './type-definition-model.js';

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
	data?: ComponentPropsTableData;
	name?: string | null;
	type: 'mdxJsxFlowElement';
}

/** Data the table node keeps for processed Markdown. MDX does not compile node data into the page. */
export interface ComponentPropsTableData {
	typeDefinitions?: TypeDefinitionsPayload;
}

/**
 * Moves each expanded `<ComponentPropsTable>`'s type definitions out of the page. The model is
 * validated here, at build time. The Luke UI types a popover can open, from a row or from another
 * definition, go into a JSON file that the page imports with `?url`, with only the tokens a popover
 * shows. The table fetches it when a reader first opens a type. Each row's formatted type stays in
 * the page as the `typeTokens` prop, because the table renders without JavaScript.
 *
 * Each file is named by a hash of its contents, so two tables share a file only when their
 * definitions are identical. Vite emits only the files a page imports, so files that earlier runs
 * left in `outputDir` never ship.
 *
 * The whole model stays on the node's `data`, where `stringifyComponentPropsTable` lists it after
 * the table in processed Markdown.
 */
export function remarkAttachTypeDefinitions({ outputDir }: { outputDir: string }) {
	return (tree: MdastRoot, file: { path: string }) => {
		const imports: Array<unknown> = [];

		visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name !== 'ComponentPropsTable') return;

			const expression = typeExpression(node);
			const {
				typeDefinitions = {},
				typeTokens,
				...doc
			} = JSON.parse(expression.value) as EnrichedGeneratedDoc;
			expression.value = JSON.stringify(doc, null, 2);

			if (typeTokens !== undefined) {
				node.attributes.push(
					expressionAttribute('typeTokens', JSON.stringify(typeTokens), jsonToEstree(typeTokens)),
				);
			}
			if (Object.keys(typeDefinitions).length === 0) return;

			const model = parseTypeDefinitionsPayload(typeDefinitions);
			node.data = { ...node.data, typeDefinitions: model };
			const linked = localTypeDefinitions(model);
			const names = Object.keys(linked);
			if (names.length === 0) return;

			const assetPath = writeDefinitionsAsset(outputDir, linked);
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

/**
 * The Luke UI types with something to show, in the model's order, with only the tokens a popover
 * shows. External types stay plain text in the browser.
 */
function localTypeDefinitions(model: TypeDefinitionsPayload): LinkedTypeDefinitions {
	const linked: LinkedTypeDefinitions = {};
	for (const [key, { definition, module, resolved }] of Object.entries(model)) {
		if (module !== undefined || (definition === undefined && resolved === undefined)) continue;
		linked[key] = {
			...(definition === undefined ? {} : { definition }),
			...(resolved === undefined ? {} : { resolved }),
		};
	}
	return linked;
}

function writeDefinitionsAsset(outputDir: string, definitions: LinkedTypeDefinitions): string {
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

/** JSON data as the estree MDX compiles, for an expression attribute. */
function jsonToEstree(value: unknown): unknown {
	if (Array.isArray(value)) return { elements: value.map(jsonToEstree), type: 'ArrayExpression' };
	if (typeof value === 'object' && value !== null) {
		return {
			properties: Object.entries(value).map(([key, item]) => ({
				computed: false,
				key: { type: 'Literal', value: key },
				kind: 'init',
				method: false,
				shorthand: false,
				type: 'Property',
				value: jsonToEstree(item),
			})),
			type: 'ObjectExpression',
		};
	}
	return { type: 'Literal', value };
}
