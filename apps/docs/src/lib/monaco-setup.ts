/**
 * Bundles Monaco and its web workers into the site instead of using
 * @monaco-editor/react's default CDN loader, so the playground works offline
 * and on GitHub Pages without external requests. Import this module only from
 * client-only code — it touches `self` at module scope.
 */
import { flavors } from '@catppuccin/palette';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js';

self.MonacoEnvironment = {
	getWorker: (_workerId, label) => {
		if (label === 'typescript' || label === 'javascript') {
			return new Worker(
				new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
				{ type: 'module' },
			);
		}
		return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
			type: 'module',
		});
	},
};

loader.config({ monaco });

/**
 * The official Catppuccin palette mapped onto Monaco's coarser token
 * vocabulary per the Catppuccin style guide (there is no official Monaco
 * port): mauve keywords, green strings, peach numbers, yellow
 * types/attributes, sky operators, overlay2 comments and punctuation,
 * rosewater cursor, overlay1 line numbers. The editor pane backgrounds in
 * `routes/playground/index.tsx` mirror `editor.background` (each flavor's
 * `base` color).
 */
export const monacoThemes = {
	dark: 'catppuccin-mocha',
	light: 'catppuccin-latte',
} as const;

monaco.editor.defineTheme(monacoThemes.light, catppuccinTheme(flavors.latte, 'vs'));
monaco.editor.defineTheme(monacoThemes.dark, catppuccinTheme(flavors.mocha, 'vs-dark'));

function catppuccinTheme(
	flavor: (typeof flavors)[keyof typeof flavors],
	base: 'vs' | 'vs-dark',
): monaco.editor.IStandaloneThemeData {
	const colors = flavor.colors;
	// Token rule colors are hex digits without the leading `#`.
	const token = (color: { hex: string }) => color.hex.slice(1);
	return {
		base,
		colors: {
			'editor.background': colors.base.hex,
			'editor.foreground': colors.text.hex,
			'editor.lineHighlightBackground': `${colors.surface0.hex}4d`,
			'editor.selectionBackground': `${colors.overlay2.hex}40`,
			'editorBracketMatch.background': `${colors.surface0.hex}80`,
			'editorBracketMatch.border': colors.surface2.hex,
			'editorCursor.foreground': colors.rosewater.hex,
			'editorHoverWidget.background': colors.mantle.hex,
			'editorLineNumber.activeForeground': colors.lavender.hex,
			'editorLineNumber.foreground': colors.overlay1.hex,
			'editorSuggestWidget.selectedBackground': colors.surface0.hex,
			'editorWidget.background': colors.mantle.hex,
			'editorWidget.border': colors.surface0.hex,
			'scrollbarSlider.activeBackground': `${colors.overlay2.hex}66`,
			'scrollbarSlider.background': `${colors.overlay2.hex}33`,
			'scrollbarSlider.hoverBackground': `${colors.overlay2.hex}4d`,
		},
		inherit: true,
		rules: [
			{ foreground: token(colors.text), token: '' },
			{ fontStyle: 'italic', foreground: token(colors.overlay2), token: 'comment' },
			{ foreground: token(colors.mauve), token: 'keyword' },
			{ foreground: token(colors.green), token: 'string' },
			{ foreground: token(colors.peach), token: 'number' },
			{ foreground: token(colors.pink), token: 'regexp' },
			{ foreground: token(colors.sky), token: 'operator' },
			{ foreground: token(colors.overlay2), token: 'delimiter' },
			{ foreground: token(colors.yellow), token: 'type.identifier' },
			{ foreground: token(colors.blue), token: 'tag' },
			{ foreground: token(colors.yellow), token: 'attribute.name' },
			{ foreground: token(colors.green), token: 'attribute.value' },
		],
	};
}

const { typescriptDefaults } = monaco.typescript;

const bundlerModuleResolution = 100 as monaco.typescript.ModuleResolutionKind;

typescriptDefaults.setCompilerOptions({
	allowNonTsExtensions: true,
	jsx: monaco.typescript.JsxEmit.ReactJSX,
	module: monaco.typescript.ModuleKind.ESNext,
	moduleResolution: bundlerModuleResolution,
	paths: {
		'@luke-ui/react/*': ['file:///node_modules/@luke-ui/react/dist/*/index.d.ts'],
	},
	strict: true,
	target: monaco.typescript.ScriptTarget.ESNext,
});
typescriptDefaults.setEagerModelSync(true);

let isTypesLoaded = false;

export async function loadPlaygroundTypes(): Promise<void> {
	if (isTypesLoaded) return;
	isTypesLoaded = true;
	try {
		const { default: types } = await import('../generated/playground-types.generated.json');
		for (const [path, contents] of Object.entries(types)) {
			typescriptDefaults.addExtraLib(contents, path);
		}
	} catch {
		isTypesLoaded = false;
	}
}
