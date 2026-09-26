/**
 * Registers Prettier as the playground's Monaco document formatting provider.
 *
 * Docs is the only Monaco host, so the provider registration, the save
 * keybinding, and the dedupe live here. `@luke-ui/playground-core` keeps the
 * host-agnostic formatting logic that `formatPlaygroundSource` wraps.
 */
import { formatPlaygroundSource } from '@luke-ui/playground-core';
import type * as Monaco from 'monaco-editor';

const FORMAT_DOCUMENT_ACTION_ID = 'editor.action.formatDocument';
const FORMAT_SHORTCUT_ACTION_ID = 'luke-ui.playground.formatDocumentShortcut';

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
