import type * as Monaco from 'monaco-editor';

const FORMAT_DOCUMENT_ACTION_ID = 'editor.action.formatDocument';

async function formatPlaygroundSource(source: string): Promise<string | null> {
	try {
		const { formatPlaygroundCode } = await import('./playground-format-fn.js');
		const result = await formatPlaygroundCode({ data: { source } });
		if (!result.ok) return null;
		return result.code;
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

function createOxfmtFormattingProvider(): Monaco.languages.DocumentFormattingEditProvider {
	return {
		displayName: 'Oxfmt',
		async provideDocumentFormattingEdits(model) {
			const original = model.getValue();
			let formatted: string | null;
			try {
				formatted = await formatPlaygroundSource(original);
			} catch (error) {
				// oxlint-disable-next-line no-console
				console.warn('[playground] Format failed: Oxfmt server request failed.', error);
				return [];
			}
			return documentFormattingEdits(original, formatted, model.getFullModelRange());
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
