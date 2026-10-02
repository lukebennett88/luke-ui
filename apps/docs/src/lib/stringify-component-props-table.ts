import type { GeneratedDoc } from 'fumadocs-typescript';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';

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
	name?: string | null;
	type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
}

const JSDOC_LINK_PATTERN = /{@link (?<link>[^}]*)}/g;

/** remarkLLMs `stringify` hook for expanded `<ComponentPropsTable>` nodes. */
export function stringifyComponentPropsTable(node: MdastNode): string | undefined {
	if (!isMdxJsxElement(node) || node.name !== 'ComponentPropsTable') return undefined;
	return generatedDocToMarkdown(readGeneratedDoc(node));
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
