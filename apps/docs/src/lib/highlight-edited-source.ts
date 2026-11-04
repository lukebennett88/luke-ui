import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import tsx from 'shiki/langs/tsx.mjs';
import { SHIKI_THEME_REGISTRATIONS, SHIKI_THEMES } from './shiki-theme.js';

const highlighter = createHighlighterCore({
	engine: createJavaScriptRegexEngine(),
	langs: [tsx],
	themes: SHIKI_THEME_REGISTRATIONS,
});

/** Only loaded after inline editing; normal examples use build-time highlighted source. */
export async function highlightEditedSource(source: string): Promise<string> {
	return (await highlighter).codeToHtml(source, {
		defaultColor: false,
		lang: 'tsx',
		themes: SHIKI_THEMES,
		transformers: [
			{
				name: 'docs:unwrap-pre',
				root(root) {
					const pre = root.children[0];
					if (pre?.type !== 'element') throw new Error('Missing highlighted pre');
					const code = pre.children[0];
					if (code?.type !== 'element') throw new Error('Missing highlighted code');
					code.properties.style = [pre.properties.style, code.properties.style]
						.filter(Boolean)
						.join(';');
					root.children = [code];
				},
			},
		],
	});
}
