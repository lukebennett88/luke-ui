import type * as Monaco from 'monaco-editor';
import type * as EstreePlugin from 'prettier/plugins/estree';
import type * as TypeScriptPlugin from 'prettier/plugins/typescript';
import type * as Prettier from 'prettier/standalone';

const FORMAT_DOCUMENT_ACTION_ID = 'editor.action.formatDocument';
const FORMAT_SHORTCUT_ACTION_ID = 'luke-ui.playground.formatDocumentShortcut';

type PrettierModules = {
	estree: typeof EstreePlugin;
	prettier: typeof Prettier;
	typescript: typeof TypeScriptPlugin;
};

function createPrettierLoader(
	load: () => Promise<PrettierModules>,
): () => Promise<PrettierModules> {
	let modulesPromise: Promise<PrettierModules> | undefined;
	return () => {
		if (!modulesPromise) {
			modulesPromise = load().catch((error: unknown) => {
				modulesPromise = undefined;
				throw error;
			});
		}
		return modulesPromise;
	};
}

const loadPrettier = createPrettierLoader(async () => {
	const [prettier, typescript, estree] = await Promise.all([
		import('prettier/standalone'),
		import('prettier/plugins/typescript'),
		import('prettier/plugins/estree'),
	]);
	return { estree, prettier, typescript };
});

export async function formatPlaygroundSource(source: string): Promise<string | null> {
	const { prettier, typescript, estree } = await loadPrettier();
	try {
		return await prettier.format(source, {
			arrowParens: 'always',
			bracketSameLine: false,
			bracketSpacing: true,
			jsxSingleQuote: false,
			parser: 'typescript',
			plugins: [typescript, estree],
			printWidth: 100,
			quoteProps: 'as-needed',
			semi: true,
			singleAttributePerLine: false,
			singleQuote: true,
			tabWidth: 2,
			trailingComma: 'all',
			useTabs: true,
		});
	} catch {
		return null;
	}
}

export function documentFormattingEdits(
	original: string,
	formatted: string | null,
	fullRange: Monaco.IRange,
): Array<Monaco.languages.TextEdit> {
	if (formatted === null || formatted === original) return [];
	return [{ range: fullRange, text: formatted }];
}

function createPrettierFormattingProvider(): Monaco.languages.DocumentFormattingEditProvider {
	return {
		displayName: 'Prettier',
		async provideDocumentFormattingEdits(model) {
			const original = model.getValue();
			try {
				const formatted = await formatPlaygroundSource(original);
				return documentFormattingEdits(original, formatted, model.getFullModelRange());
			} catch (error) {
				// oxlint-disable-next-line no-console
				console.warn('[playground] Format failed: Prettier could not load.', error);
				return [];
			}
		},
	};
}

const FORMATTER_REGISTERED = Symbol.for('luke-ui.playground.prettierFormatterRegistered');

type FormatterRegistry = typeof Monaco.languages & {
	[FORMATTER_REGISTERED]?: Monaco.IDisposable;
};

export function registerPlaygroundFormatter(monaco: typeof Monaco): Monaco.IDisposable {
	const registry = monaco.languages as FormatterRegistry;
	const existing = registry[FORMATTER_REGISTERED];
	if (existing) return existing;

	const disposable = monaco.languages.registerDocumentFormattingEditProvider(
		['typescript', 'javascript'],
		createPrettierFormattingProvider(),
	);
	registry[FORMATTER_REGISTERED] = disposable;
	return disposable;
}

export function registerFormatDocumentKeybinding(
	editor: Monaco.editor.IStandaloneCodeEditor,
	monaco: typeof Monaco,
): Monaco.IDisposable {
	return editor.addAction({
		id: FORMAT_SHORTCUT_ACTION_ID,
		label: 'Format Document',
		keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
		run: (ed) => {
			const action = ed.getAction(FORMAT_DOCUMENT_ACTION_ID);
			if (!action) return;
			return action.run();
		},
	});
}

export async function runFormatDocument(
	editor: Monaco.editor.IStandaloneCodeEditor | null,
): Promise<void> {
	const action = editor?.getAction(FORMAT_DOCUMENT_ACTION_ID);
	if (!action) return;
	try {
		await action.run();
	} catch (error) {
		// oxlint-disable-next-line no-console
		console.warn('[playground] Format document action failed.', error);
	}
}
