import { readFile } from 'node:fs/promises';
// These Shiki entry points load only the core, TSX grammar, and selected themes.
import type { HighlighterCore } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import tsx from 'shiki/langs/tsx.mjs';
import type { Plugin } from 'vite-plus';
import type { HighlightedSource } from './highlighted-source.js';
import { encodeCodeHash } from './playground-hash.js';
import { canRunInPlayground } from './playground-runtime-specifiers.js';
import { SHIKI_THEME_REGISTRATIONS, SHIKI_THEMES } from './shiki-theme.js';

const HIGHLIGHT_QUERY = '?highlight';

/**
 * Converts a `?highlight` TSX import into a {@link HighlightedSource} module.
 *
 * The resolved module ID retains the file path, so Vite invalidates it when the file changes.
 */
export function highlightSourcePlugin(): Plugin {
	// One highlighter serves all source modules in each build environment.
	let highlighter: Promise<HighlighterCore> | undefined;

	return {
		enforce: 'pre',
		async load(id) {
			if (!id.endsWith(HIGHLIGHT_QUERY)) return null;

			highlighter ??= createHighlighterCore({
				engine: createJavaScriptRegexEngine(),
				langs: [tsx],
				themes: SHIKI_THEME_REGISTRATIONS,
			});

			const path = id.slice(0, -HIGHLIGHT_QUERY.length);
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
								// Fumadocs provides the outer `<pre>`, so the plugin emits the `<code>` element.
								// The `<code>` element retains Shiki's theme properties.
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
				playgroundHash: canRunInPlayground(source) ? encodeCodeHash(source) : null,
			};

			return `export default ${JSON.stringify(highlighted)};\n`;
		},
		name: 'docs-highlight-source',
	};
}
