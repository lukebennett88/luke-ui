import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';
import type { EnrichedGeneratedDoc, TypeDefinitionsPayload } from './type-definition-model.js';
import { TYPE_DEFINITIONS_KEY, TYPE_DEFINITIONS_PUBLIC_DIR } from './type-definition-model.js';

interface MdxJsxAttributeValueExpression {
	data?: {
		estree?: unknown;
	};
	type: 'mdxJsxAttributeValueExpression';
	value: string;
}

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value?: string | MdxJsxAttributeValueExpression | null;
}

interface MdxJsxFlowElement {
	attributes: Array<MdxJsxAttribute | { type: string }>;
	name?: string | null;
	type: 'mdxJsxFlowElement';
}

/**
 * Writes one definition JSON asset per ComponentPropsTable and passes `definitionsHref` instead of
 * embedding the registry in the props `type` record (which also polluted search indexes).
 */
export function remarkAttachTypeDefinitions(options: { publicDir: string }) {
	const outputDir = join(options.publicDir, TYPE_DEFINITIONS_PUBLIC_DIR);

	return (tree: { type: string }) => {
		visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name !== 'ComponentPropsTable') return;

			const typeAttr = node.attributes.find(
				(attr): attr is MdxJsxAttribute =>
					attr.type === 'mdxJsxAttribute' &&
					'name' in attr &&
					attr.name === 'type' &&
					attr.value !== null &&
					attr.value !== undefined &&
					typeof attr.value !== 'string' &&
					attr.value.type === 'mdxJsxAttributeValueExpression',
			);
			if (typeAttr === undefined || typeof typeAttr.value === 'string' || typeAttr.value == null) {
				return;
			}

			const expression = typeAttr.value;
			const raw = expression.value.trim();
			if (raw.length === 0) return;

			let doc: EnrichedGeneratedDoc;
			try {
				doc = JSON.parse(raw) as EnrichedGeneratedDoc;
			} catch {
				return;
			}

			const definitions = collectDefinitions(doc);
			// Keep Markdown / search JSON free of the registry and any legacy synthetic entry.
			const cleanedEntries = doc.entries.filter((entry) => entry.name !== TYPE_DEFINITIONS_KEY);
			const { typeDefinitions: _removed, ...rest } = doc;
			expression.value = JSON.stringify({ ...rest, entries: cleanedEntries }, null, 2);

			if (Object.keys(definitions).length === 0) return;

			mkdirSync(outputDir, { recursive: true });
			const fileId = createHash('sha1').update(doc.id).digest('hex').slice(0, 16);
			const fileName = `${fileId}.json`;
			writeFileSync(join(outputDir, fileName), `${JSON.stringify(definitions)}\n`);

			const href = `/${TYPE_DEFINITIONS_PUBLIC_DIR}/${fileName}`;
			const existing = node.attributes.find(
				(attr): attr is MdxJsxAttribute =>
					attr.type === 'mdxJsxAttribute' && 'name' in attr && attr.name === 'definitionsHref',
			);
			if (existing !== undefined) {
				existing.value = href;
			} else {
				node.attributes.push({
					name: 'definitionsHref',
					type: 'mdxJsxAttribute',
					value: href,
				});
			}
		});
	};
}

function collectDefinitions(doc: EnrichedGeneratedDoc): TypeDefinitionsPayload {
	if (doc.typeDefinitions !== undefined) return doc.typeDefinitions;

	const legacy = doc.entries.find((entry) => entry.name === TYPE_DEFINITIONS_KEY);
	if (legacy?.typeHref === undefined || legacy.typeHref.length === 0) return {};
	try {
		const parsed: unknown = JSON.parse(legacy.typeHref);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return parsed as TypeDefinitionsPayload;
	} catch {
		return {};
	}
}
