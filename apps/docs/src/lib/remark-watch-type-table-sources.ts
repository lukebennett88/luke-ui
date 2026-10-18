import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { visit } from 'unist-util-visit';
import { collectTypescriptSourceGraph } from './typescript-source-graph.js';

const TYPE_TABLE_TAG_NAMES = new Set(['auto-type-table', 'component-props-table']);

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value?: string | { type: string; value?: string } | null;
}

interface MdxJsxFlowElement {
	attributes: Array<MdxJsxAttribute | { type: string }>;
	name?: string | null;
	type: 'mdxJsxFlowElement';
}

interface CompilerWithDependencies {
	addDependency?: (filePath: string) => void;
}

/**
 * Registers each type-table entry file and its relative import graph with Fumadocs MDX's
 * `_compiler.addDependency`, which Vite maps to `addWatchFile`. Without this, editing TypeScript
 * sources does not recompile the MDX module, so API tables stay stale until the MDX file changes or
 * the server restarts.
 */
export function remarkWatchTypeTableSources({ basePath }: { basePath: string }) {
	return (tree: unknown, file: { cwd?: string; data?: unknown; path?: string }) => {
		const compiler = (file.data as { _compiler?: CompilerWithDependencies } | undefined)?._compiler;
		const addDependency = compiler?.addDependency;
		if (addDependency === undefined) return;

		visit(tree as never, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name === null || node.name === undefined || !TYPE_TABLE_TAG_NAMES.has(node.name)) {
				return;
			}

			const pathAttribute = pathValue(node);
			if (pathAttribute === undefined) return;

			registerSourceGraph(resolve(basePath, pathAttribute), addDependency);
		});
	};
}

function pathValue(node: MdxJsxFlowElement): string | undefined {
	for (const attribute of node.attributes) {
		if (attribute.type !== 'mdxJsxAttribute') continue;
		const named = attribute as MdxJsxAttribute;
		if (named.name !== 'path' || typeof named.value !== 'string') continue;
		return named.value;
	}
	return undefined;
}

function registerSourceGraph(entryPath: string, addDependency: (filePath: string) => void): void {
	let content: string;
	try {
		content = readFileSync(entryPath, 'utf8');
	} catch {
		addDependency(entryPath);
		return;
	}

	const { files } = collectTypescriptSourceGraph(entryPath, content);
	for (const filePath of files) {
		addDependency(filePath);
	}
}
