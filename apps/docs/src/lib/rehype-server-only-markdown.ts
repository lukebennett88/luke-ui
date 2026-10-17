interface HastRoot {
	children: Array<unknown>;
	type: 'root';
}

interface EstreeNode {
	type: string;
}

interface VariableDeclarator extends EstreeNode {
	id: { name?: string; type: string };
	init: EstreeNode | null;
	type: 'VariableDeclarator';
}

interface MdxjsEsm {
	data?: {
		estree?: {
			body: Array<{
				declaration?: { declarations?: Array<VariableDeclarator>; type: string } | null;
				type: string;
			}>;
		};
	};
	type: 'mdxjsEsm';
}

/** The export `includeProcessedMarkdown` adds to every page module. */
const MARKDOWN_EXPORT = '_markdown';

/**
 * Keeps processed Markdown out of browser chunks. Fumadocs exports it as `_markdown` from every page
 * module, but only server code reads it, through `getText('processed')`. The value becomes
 * `import.meta.env.SSR ? markdown : undefined`, which Vite turns into `undefined` in the client
 * build, so the Markdown and its type definitions never reach page JavaScript.
 */
export function rehypeServerOnlyMarkdown() {
	return (tree: HastRoot) => {
		for (const node of tree.children) {
			const declarator = markdownDeclarator(node);
			if (declarator?.init == null) continue;

			declarator.init = {
				alternate: { name: 'undefined', type: 'Identifier' },
				consequent: declarator.init,
				test: importMetaEnvSsr(),
				type: 'ConditionalExpression',
			} as EstreeNode;
		}
	};
}

function markdownDeclarator(node: unknown): VariableDeclarator | undefined {
	if ((node as { type?: string }).type !== 'mdxjsEsm') return;

	for (const statement of (node as MdxjsEsm).data?.estree?.body ?? []) {
		if (statement.type !== 'ExportNamedDeclaration') continue;
		const declarator = statement.declaration?.declarations?.find(
			(candidate) => candidate.id.name === MARKDOWN_EXPORT,
		);
		if (declarator !== undefined) return declarator;
	}
	return;
}

/** `import.meta.env.SSR` as estree. */
function importMetaEnvSsr(): EstreeNode {
	const importMeta = {
		meta: { name: 'import', type: 'Identifier' },
		property: { name: 'meta', type: 'Identifier' },
		type: 'MetaProperty',
	};
	const env = { computed: false, object: importMeta, optional: false, property: identifier('env') };
	return {
		computed: false,
		object: { ...env, type: 'MemberExpression' },
		optional: false,
		property: identifier('SSR'),
		type: 'MemberExpression',
	} as EstreeNode;
}

function identifier(name: string) {
	return { name, type: 'Identifier' };
}
