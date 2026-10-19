import type { GeneratedDoc } from 'fumadocs-typescript';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import type { ComponentPropsTableData } from './remark-attach-type-definitions.js';
import type { TypeDefinition, TypeDefinitionsPayload } from './type-definition-model.js';
import type { TypeTokens } from './type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

interface MdastNode {
	type: string;
}

interface MdxJsxAttributeValueExpression {
	type: 'mdxJsxAttributeValueExpression';
	value: string;
}

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value?: string | MdxJsxAttributeValueExpression | null;
}

interface MdxJsxExpressionAttribute {
	type: 'mdxJsxExpressionAttribute';
	value: string;
}

interface MdxJsxElementNode {
	attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>;
	data?: ComponentPropsTableData;
	name?: string | null;
	type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
}

const JSDOC_LINK_PATTERN = /{@link (?<link>[^}]*)}/g;
const BACKTICK_RUN_PATTERN = /`+/g;

/**
 * Processed Markdown for an expanded `<ComponentPropsTable>` node. The table is followed by the
 * definitions `remarkAttachTypeDefinitions` kept on the node, which the HTML table loads on demand
 * instead. `remarkAttachTypeDefinitions` records this text with `replaceSource`.
 */
export function stringifyComponentPropsTable(node: MdastNode): string | undefined {
	if (!isMdxJsxElement(node) || node.name !== 'ComponentPropsTable') return;

	const table = generatedDocToMarkdown(readGeneratedDoc(node));
	const typeDefinitions = node.data?.typeDefinitions;
	if (typeDefinitions === undefined || Object.keys(typeDefinitions).length === 0) return table;

	return `${table.trimEnd()}\n\n${typeDefinitionsToMarkdown(typeDefinitions)}`;
}

/**
 * Lists every type in a table's definitions under its own heading, so a reader without the
 * interactive popover can look up each name a signature or definition uses. Luke UI types come first,
 * then external types with their package. Both keep the order they were first referenced in.
 */
function typeDefinitionsToMarkdown(typeDefinitions: TypeDefinitionsPayload): string {
	const keys = Object.keys(typeDefinitions);
	const ordered = [
		...keys.filter((key) => typeDefinitions[key]!.module === undefined),
		...keys.filter((key) => typeDefinitions[key]!.module !== undefined),
	];

	const sections = ordered.map((key) => {
		const definition = typeDefinitions[key]!;
		const writtenAs =
			definition.writtenAs === undefined
				? ''
				: ` (written as ${formatList(definition.writtenAs.map((name) => `\`${name}\``))})`;
		const parts = [`##### ${typeLabel(key, definition)}${writtenAs}`];

		if (definition.module !== undefined) {
			const packageLink = `[\`${definition.module}\`](https://www.npmjs.com/package/${definition.module})`;
			const file = definition.source === undefined ? '' : ` (\`${definition.source}\`)`;
			parts.push(`Declared in ${packageLink}${file}.`);
		}
		if (definition.definition !== undefined) parts.push(tokensBlock(definition.definition));
		if (
			definition.module === undefined &&
			definition.definition === undefined &&
			definition.resolved === undefined
		) {
			parts.push('Not expanded, because this table names more types than its definitions list.');
		}
		if (definition.resolved !== undefined) {
			parts.push(definition.definition === undefined ? 'Resolves to:' : 'Which resolves to:');
			parts.push(tokensBlock(definition.resolved));
		}
		if (definition.references.length > 0) {
			const labels = definition.references.map((reference) => {
				const referenced = typeDefinitions[reference];
				return referenced === undefined ? `\`${reference}\`` : typeLabel(reference, referenced);
			});
			parts.push(`Refers to ${formatList(labels)}.`);
		}
		return parts.join('\n\n');
	});

	return [
		'#### Type definitions',
		"These are the types that this table's signatures and the definitions below name. TypeScript's built-in types, such as `Omit` and `ReadonlyArray`, are not listed.",
		...sections,
	].join('\n\n');
}

/** The type's name, plus its owner when another type in the table has the same name. */
function typeLabel(key: string, definition: TypeDefinition): string {
	if (key === definition.name) return `\`${definition.name}\``;
	return `\`${definition.name}\` from \`${definition.module ?? '@luke-ui/react'}\``;
}

/** Formatted tokens with their line breaks, as the popover shows them. */
function tokensBlock(tokens: TypeTokens): string {
	return codeBlock(typeTokensToText(tokens, { multiline: true }));
}

/** A TypeScript code block whose fence is longer than any backtick run inside it. */
function codeBlock(code: string): string {
	const longestRun = Math.max(
		0,
		...(code.match(BACKTICK_RUN_PATTERN) ?? []).map((run) => run.length),
	);
	const fence = '`'.repeat(Math.max(3, longestRun + 1));
	return `${fence}ts\n${code}\n${fence}`;
}

function formatList(items: ReadonlyArray<string>): string {
	if (items.length <= 2) return items.join(' and ');
	return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function generatedDocToMarkdown(doc: GeneratedDoc): string {
	const rows: Array<[string, string, string]> = [['Prop', 'Type', 'Description']];
	let nativePropsNote: string | undefined;

	for (const entry of doc.entries) {
		if (entry.name === NATIVE_PROPS_FORWARDING_KEY) {
			const note = entry.description.trim();
			if (note.length > 0) nativePropsNote = note;
			continue;
		}

		const tags = parseTags(entry.tags);
		let description = entry.description.replace(JSDOC_LINK_PATTERN, '$1').trim();
		if (tags.default !== undefined) {
			description += `${description ? ' ' : ''}Default: \`${tags.default}\``;
		}
		if (entry.deprecated) {
			description = `**Deprecated.** ${description}`;
		}

		rows.push([
			`\`${entry.name}${entry.required ? '' : '?'}\``,
			`\`${entry.simplifiedType}\``,
			description,
		]);
	}

	let out = `### ${doc.name}\n\n`;
	if (doc.description !== undefined && doc.description.trim().length > 0) {
		out += `${doc.description.trim()}\n\n`;
	}
	if (nativePropsNote !== undefined) {
		out += `${nativePropsNote}\n\n`;
	}
	if (rows.length === 1) return out.trimEnd();

	return out + formatTable(rows);
}

function isMdxJsxElement(node: MdastNode): node is MdxJsxElementNode {
	return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function readGeneratedDoc(node: MdxJsxElementNode): GeneratedDoc {
	const typeAttr = node.attributes.find((attr): attr is MdxJsxAttribute => {
		return attr.type === 'mdxJsxAttribute' && attr.name === 'type';
	});
	const expression =
		typeAttr?.value !== null &&
		typeAttr?.value !== undefined &&
		typeof typeAttr.value !== 'string' &&
		typeAttr.value.type === 'mdxJsxAttributeValueExpression'
			? typeAttr.value.value.trim()
			: undefined;

	if (expression === undefined || expression.length === 0) {
		throw new Error(
			'<ComponentPropsTable>: processed Markdown requires a `type` expression with GeneratedDoc JSON (remarkStringify).',
		);
	}

	try {
		return JSON.parse(expression) as GeneratedDoc;
	} catch (cause) {
		throw new Error(
			'<ComponentPropsTable>: processed Markdown `type` attribute is not valid GeneratedDoc JSON.',
			{ cause },
		);
	}
}

function parseTags(tags: GeneratedDoc['entries'][number]['tags']): { default?: string } {
	const typed: { default?: string } = {};
	for (const { name, text } of tags) {
		if (name === 'default' || name === 'defaultValue') {
			typed.default = text;
		}
	}
	return typed;
}

function formatTable(rows: ReadonlyArray<ReadonlyArray<string>>): string {
	const cells: Array<Array<string>> = [];
	const widths: Array<number> = [];

	for (const row of rows) {
		const escaped: Array<string> = [];
		for (let i = 0; i < row.length; i++) {
			const text = row[i]!.replace(/\s*\n\s*/g, ' ').replaceAll('|', '\\|');
			widths[i] = Math.max(widths[i] ?? 0, text.length);
			escaped.push(text);
		}
		cells.push(escaped);
	}

	let out = '';
	for (let r = 0; r < cells.length; r++) {
		let line = '|';
		for (let i = 0; i < widths.length; i++) {
			line += ` ${(cells[r]![i] ?? '').padEnd(widths[i]!)} |`;
		}
		out += `${line}\n`;
		if (r === 0) {
			line = '|';
			for (const width of widths) {
				line += ` ${'-'.repeat(width)} |`;
			}
			out += `${line}\n`;
		}
	}
	return out;
}
