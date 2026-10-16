import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import { TYPE_DEFINITIONS_PUBLIC_DIR } from './type-definition-model.js';

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

/** Writes one definition JSON asset per ComponentPropsTable and attaches deferred-load props. */
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

			const definitions = doc.typeDefinitions ?? {};
			const { typeDefinitions: _removed, ...rest } = doc;
			expression.value = JSON.stringify(rest, null, 2);

			if (Object.keys(definitions).length === 0) return;

			mkdirSync(outputDir, { recursive: true });
			const fileId = createHash('sha1').update(doc.id).digest('hex').slice(0, 16);
			const fileName = `${fileId}.json`;
			writeFileSync(join(outputDir, fileName), `${JSON.stringify(definitions)}\n`);

			// Root-relative; the provider prefixes import.meta.env.BASE_URL for subpath deploys.
			const href = `/${TYPE_DEFINITIONS_PUBLIC_DIR}/${fileName}`;
			setStringAttribute(node, 'definitionsHref', href);
			setStringAttribute(node, 'definitionNames', Object.keys(definitions).join(','));
		});
	};
}

function setStringAttribute(node: MdxJsxFlowElement, name: string, value: string): void {
	const existing = node.attributes.find(
		(attr): attr is MdxJsxAttribute =>
			attr.type === 'mdxJsxAttribute' && 'name' in attr && attr.name === name,
	);
	if (existing !== undefined) {
		existing.value = value;
		return;
	}
	node.attributes.push({
		name,
		type: 'mdxJsxAttribute',
		value,
	});
}
