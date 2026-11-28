import { canRunInPlayground } from '@luke-ui/playground-core/specifiers';
import { readFile } from 'node:fs/promises';
// These Shiki entry points load only the core, TSX grammar, and selected themes.
import type { HighlighterCore } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import tsx from 'shiki/langs/tsx.mjs';
import type { Plugin } from 'vite-plus';
import { encodeDocsPlaygroundHash } from '../playground/docs-playground-hash.js';
import { docsPlaygroundSpecifiers } from '../playground/docs-playground-specifiers.js';
import type { HighlightedSource } from './highlighted-source.js';
import { SHIKI_THEME_REGISTRATIONS, SHIKI_THEMES } from './shiki-theme.js';

const HIGHLIGHT_QUERY = '?highlight';

// Vanilla Extract compiles any ID whose path ends in `.css.ts`, whatever its query, so the resolved
// ID carries the file path in its query instead.
const RESOLVED_ID_PREFIX = '\0docs-highlight?file=';

/**
 * Converts a `?highlight` TSX import into a {@link HighlightedSource} module.
 *
 * The module watches its source file, so Vite invalidates it when the file changes.
 */
export function highlightSourcePlugin(): Plugin {
	// One highlighter serves all source modules in each build environment.
	let highlighter: Promise<HighlighterCore> | undefined;

	return {
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!source.endsWith(HIGHLIGHT_QUERY)) return null;

			const resolved = await this.resolve(source.slice(0, -HIGHLIGHT_QUERY.length), importer, {
				...options,
				skipSelf: true,
			});
			return resolved ? `${RESOLVED_ID_PREFIX}${resolved.id}` : null;
		},
		async load(id) {
			if (!id.startsWith(RESOLVED_ID_PREFIX)) return null;

			highlighter ??= createHighlighterCore({
				engine: createJavaScriptRegexEngine(),
				langs: [tsx],
				themes: SHIKI_THEME_REGISTRATIONS,
			});

			const path = id.slice(RESOLVED_ID_PREFIX.length);
			this.addWatchFile(path);
			const source = (await readFile(path, 'utf8')).trim();

			const highlighted: HighlightedSource = {
				html: (await highlighter).codeToHtml(source, {
					defaultColor: false,
					lang: 'tsx',
					themes: SHIKI_THEMES,
					transformers: [
						{
							name: 'docs:unwrap-pre',
							root(root) {
								// Docs CodeBlock owns the outer `<pre>`, so the plugin emits the `<code>`
								// element. The `<code>` element retains Shiki's theme properties.
								const pre = root.children[0];
								if (pre?.type !== 'element') throw new Error(`No <pre> highlighting ${path}`);
								const code = pre.children[0];
								if (code?.type !== 'element') throw new Error(`No <code> highlighting ${path}`);

								code.properties.style = [pre.properties.style, code.properties.style]
									.filter(Boolean)
									.join(';');
								root.children = [code];
							},
						},
					],
				}),
				playgroundHash: canRunInPlayground(source, docsPlaygroundSpecifiers())
					? encodeDocsPlaygroundHash(source)
					: null,
				source,
			};

			return `export default ${JSON.stringify(highlighted)};\n`;
		},
		name: 'docs-highlight-source',
	};
}
