/**
 * Bundles Monaco and its web workers into the site instead of using
 * @monaco-editor/react's default CDN loader, so the playground works offline
 * and on GitHub Pages without external requests. Import this module only from
 * client-only code — it touches `self` at module scope.
 */
import { loader } from '@monaco-editor/react';
import { shikiToMonaco } from '@shikijs/monaco';
import * as monaco from 'monaco-editor';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import tsx from 'shiki/langs/tsx.mjs';
import { toHighContrastMonacoTheme } from './monaco-theme.js';
import { SHIKI_THEME_REGISTRATIONS } from './shiki-theme.js';

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

/**
 * Monaco themes derived from the docs Shiki registrations, so the playground
 * matches highlighted code elsewhere on the site. Pane and skeleton chrome use
 * `monacoChromeColors` from the same registrations.
 * Defined by {@link ensurePlaygroundMonaco}.
 */
export const monacoThemes = {
	dark: 'github-dark-high-contrast',
	light: 'github-light-high-contrast',
} as const;

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

let ready: Promise<void> | undefined;

/**
 * Tokenizes Monaco with Shiki's TSX grammar and defines {@link monacoThemes}.
 * Await it before creating an editor. Runs once.
 */
export function ensurePlaygroundMonaco(): Promise<void> {
	ready ??= setUpHighlighting().catch((error: unknown) => {
		ready = undefined;
		throw error;
	});
	return ready;
}

async function setUpHighlighting(): Promise<void> {
	const highlighter = await createHighlighterCore({
		engine: createJavaScriptRegexEngine(),
		// Playground models use Monaco's `typescript` language with a `.tsx` path,
		// so the TSX grammar is registered under that language id.
		langs: tsx.map((lang) => ({ ...lang, name: 'typescript' })),
		themes: SHIKI_THEME_REGISTRATIONS,
	});
	shikiToMonaco(highlighter, monaco);

	// `shikiToMonaco` defines `vs` / `vs-dark` themes. Redefine them on
	// high-contrast bases so selected text stays readable.
	for (const name of Object.values(monacoThemes)) {
		monaco.editor.defineTheme(name, toHighContrastMonacoTheme(highlighter.getTheme(name)));
	}
}
