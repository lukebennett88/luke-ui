import type * as Monaco from 'monaco-editor';

const FORMAT_DOCUMENT_ACTION_ID = 'editor.action.formatDocument';
const FORMAT_SHORTCUT_ACTION_ID = 'luke-ui.playground.formatDocumentShortcut';

type FormatPlaygroundSourceResult = { status: 'formatted'; code: string } | { status: 'no-edit' };

async function formatPlaygroundSource(source: string): Promise<FormatPlaygroundSourceResult> {
	const { formatPlaygroundCode } = await import('./playground-format-fn.js');
	const result = await formatPlaygroundCode({ data: { source } });
	if (!result.ok) return { status: 'no-edit' };
	return { status: 'formatted', code: result.code };
}

export function documentFormattingEdits(
	original: string,
	formatted: string | null,
	fullRange: Monaco.IRange,
): Array<Monaco.languages.TextEdit> {
	if (formatted === null || formatted === original) return [];
	return [{ range: fullRange, text: formatted }];
}

function createOxfmtFormattingProvider(): Monaco.languages.DocumentFormattingEditProvider {
	return {
		displayName: 'Oxfmt',
		async provideDocumentFormattingEdits(model) {
			const original = model.getValue();
			try {
				const result = await formatPlaygroundSource(original);
				if (result.status === 'no-edit') return [];
				return documentFormattingEdits(original, result.code, model.getFullModelRange());
			} catch (error) {
				// oxlint-disable-next-line no-console
				console.warn('[playground] Format failed: Oxfmt server request failed.', error);
				return [];
			}
		},
	};
}

const FORMATTER_REGISTERED = Symbol.for('luke-ui.playground.oxfmtFormatterRegistered');

type FormatterRegistry = typeof Monaco.languages & {
	[FORMATTER_REGISTERED]?: Monaco.IDisposable;
};

export function registerPlaygroundFormatter(monaco: typeof Monaco): Monaco.IDisposable {
	const registry = monaco.languages as FormatterRegistry;
	const existing = registry[FORMATTER_REGISTERED];
	if (existing) return existing;

	const disposable = monaco.languages.registerDocumentFormattingEditProvider(
		['typescript', 'javascript'],
		createOxfmtFormattingProvider(),
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
