/**
 * Registers Prettier as the playground's Monaco document formatting provider.
 *
 * Docs is the only Monaco host, so the provider registration, the save
 * keybinding, and the dedupe live here. The docs Prettier style lives in
 * `lib/playground-format.ts`, and `@luke-ui/playground-core/format` loads
 * Prettier and runs it.
 */
import type * as Monaco from 'monaco-editor';
import { formatDocsPlaygroundSource } from '../../lib/playground-format.js';

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
				const formatted = await formatDocsPlaygroundSource(original);
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
	[FORMATTER_REGISTERED]?: true;
};

export function registerPlaygroundFormatter(monaco: typeof Monaco): void {
	const registry = monaco.languages as FormatterRegistry;
	if (registry[FORMATTER_REGISTERED]) return;

	monaco.languages.registerDocumentFormattingEditProvider(
		['typescript', 'javascript'],
		createPrettierFormattingProvider(),
	);
	registry[FORMATTER_REGISTERED] = true;
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
