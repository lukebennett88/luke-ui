import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import { TYPE_DEFINITIONS_DIR } from './type-definition-model.js';

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

/** Output dirs already cleared in this process so incremental plugin recreation cannot wipe assets. */
const cleanedOutputDirs = new Set<string>();

/** Clears the once-per-process clean guard. Used by unit tests. */
export function resetTypeDefinitionsOutputCleanGuardForTests(): void {
	cleanedOutputDirs.clear();
}

/**
 * Writes one definition JSON asset per ComponentPropsTable under `.source/type-definitions` and
 * attaches deferred-load props. Clears each output directory once per process so a full MDX pass
 * cannot leave obsolete files from a previous run.
 */
export function remarkAttachTypeDefinitions(options: { outputDir: string }) {
	const outputDir = options.outputDir;
	if (!cleanedOutputDirs.has(outputDir)) {
		rmSync(outputDir, { recursive: true, force: true });
		cleanedOutputDirs.add(outputDir);
	}
	mkdirSync(outputDir, { recursive: true });

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

			const fileId = createHash('sha1').update(doc.id).digest('hex').slice(0, 16);
			const fileName = `${fileId}.json`;
			writeFileSync(join(outputDir, fileName), `${JSON.stringify(definitions)}\n`);

			// Root-relative; the provider prefixes import.meta.env.BASE_URL for subpath deploys.
			const href = `/${TYPE_DEFINITIONS_DIR}/${fileName}`;
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
