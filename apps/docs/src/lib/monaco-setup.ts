/**
 * Bundles Monaco and its web workers into the site instead of using
 * @monaco-editor/react's default CDN loader, so the playground works offline
 * and on GitHub Pages without external requests. Import this module only from
 * client-only code — it touches `self` at module scope.
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { SHIKI_THEME_REGISTRATIONS } from './shiki-theme.js';

const [githubLight, githubDark] = SHIKI_THEME_REGISTRATIONS;

self.MonacoEnvironment = {
	getWorker: (_workerId, label) => {
		if (label === 'typescript' || label === 'javascript') {
			return new Worker(
				new URL('monaco-editor/language/typescript/ts.worker.js', import.meta.url),
				{ type: 'module' },
			);
		}
		return new Worker(new URL('monaco-editor/editor/editor.worker.js', import.meta.url), {
			type: 'module',
		});
	},
};

loader.config({ monaco });

// Monaco binds Ctrl/Cmd+L to `expandLineSelection` and preventDefaults it,
// which stops the browser shortcut for focusing the address bar. A playground
// is not an IDE — give the shortcut back to the browser.
monaco.editor.addKeybindingRule({
	command: null,
	keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL,
});

const MONACO_COLOR_KEYS = [
	'editor.background',
	'editor.foreground',
	'editor.lineHighlightBackground',
	'editor.selectionBackground',
	'editorBracketMatch.background',
	'editorBracketMatch.border',
	'editorCursor.foreground',
	'editorHoverWidget.background',
	'editorLineNumber.activeForeground',
	'editorLineNumber.foreground',
	'editorSuggestWidget.selectedBackground',
	'editorWidget.background',
	'editorWidget.border',
	'scrollbarSlider.activeBackground',
	'scrollbarSlider.background',
	'scrollbarSlider.hoverBackground',
] as const;

/**
 * Monaco themes derived from the docs Shiki registrations, so the playground
 * matches highlighted code elsewhere on the site. The editor pane backgrounds
 * in `routes/playground/index.tsx` mirror each theme's `editor.background`.
 */
export const monacoThemes = {
	dark: 'github-dark-high-contrast',
	light: 'github-light-high-contrast',
} as const;

monaco.editor.defineTheme(monacoThemes.light, shikiToMonacoTheme(githubLight, 'vs'));
monaco.editor.defineTheme(monacoThemes.dark, shikiToMonacoTheme(githubDark, 'vs-dark'));

function shikiToMonacoTheme(
	theme: typeof githubLight,
	base: 'vs' | 'vs-dark',
): monaco.editor.IStandaloneThemeData {
	const themeColors = theme.colors ?? {};
	const colors: Record<string, string> = {};
	for (const key of MONACO_COLOR_KEYS) {
		const color = themeColors[key];
		if (color) colors[key] = color;
	}

	const rules: Array<monaco.editor.ITokenThemeRule> = [];
	const defaultForeground = themeColors['editor.foreground'];
	if (defaultForeground) {
		// Token rule colors are hex digits without the leading `#`.
		rules.push({ foreground: defaultForeground.replace('#', ''), token: '' });
	}
	for (const { scope, settings } of theme.tokenColors ?? []) {
		if (!settings?.foreground) continue;
		const foreground = settings.foreground.replace('#', '');
		const scopes = typeof scope === 'string' ? [scope] : (scope ?? []);
		for (const token of scopes) {
			rules.push({
				foreground,
				token,
				...(settings.fontStyle ? { fontStyle: settings.fontStyle } : {}),
			});
		}
	}

	return { base, colors, inherit: true, rules };
}

const { typescriptDefaults } = monaco.typescript;

const bundlerModuleResolution = 100 as monaco.typescript.ModuleResolutionKind;

typescriptDefaults.setCompilerOptions({
	allowNonTsExtensions: true,
	jsx: monaco.typescript.JsxEmit.ReactJSX,
	module: monaco.typescript.ModuleKind.ESNext,
	moduleResolution: bundlerModuleResolution,
	paths: {
		'#docs': ['file:///docs/docs.tsx'],
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
