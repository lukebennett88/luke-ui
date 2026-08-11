import type { format as wasmFormat } from '@wasm-fmt/oxc_fmt';
import type * as Monaco from 'monaco-editor';
import { repoFmtOptions } from './repo-fmt-options.js';

type WasmFmtConfig = NonNullable<Parameters<typeof wasmFormat>[2]>;

const FORMAT_DOCUMENT_ACTION_ID = 'editor.action.formatDocument';

const PLAYGROUND_FILE = 'file:///playground/index.tsx';

/**
 * Maps shared repo formatter options to `@wasm-fmt/oxc_fmt` config. Omits
 * `singleAttributePerLine: false` because the WASM binding rejects explicit
 * false values.
 */
export function toPlaygroundWasmFmtConfig(): WasmFmtConfig {
	return {
		arrowParens: repoFmtOptions.arrowParens,
		bracketSameLine: repoFmtOptions.bracketSameLine,
		bracketSpacing: repoFmtOptions.bracketSpacing,
		indentStyle: repoFmtOptions.useTabs ? 'tab' : 'space',
		indentWidth: repoFmtOptions.tabWidth,
		jsxSingleQuote: repoFmtOptions.jsxSingleQuote,
		lineWidth: repoFmtOptions.printWidth,
		quoteProps: repoFmtOptions.quoteProps,
		singleQuote: repoFmtOptions.singleQuote,
		sortImports: repoFmtOptions.sortImports,
		trailingComma: repoFmtOptions.trailingComma,
	};
}

type WasmFmt = {
	format: (code: string, filename: string, config?: WasmFmtConfig | null) => string;
};

let wasmFmtPromise: Promise<WasmFmt> | null = null;

async function loadWasmFmt(): Promise<WasmFmt> {
	if (!wasmFmtPromise) {
		wasmFmtPromise = (async () => {
			if (typeof window === 'undefined') {
				const { format } = await import('@wasm-fmt/oxc_fmt/node');
				return { format };
			}
			const viteModule = (await import('@wasm-fmt/oxc_fmt/vite')) as {
				default: () => Promise<unknown>;
				format: WasmFmt['format'];
			};
			await viteModule.default();
			return { format: viteModule.format };
		})().catch((error) => {
			wasmFmtPromise = null;
			throw error;
		});
	}
	return wasmFmtPromise;
}

export async function formatPlaygroundSource(source: string): Promise<string | null> {
	const { format } = await loadWasmFmt();
	try {
		return format(source, PLAYGROUND_FILE, toPlaygroundWasmFmtConfig());
	} catch {
		return null;
	}
}

export function createOxfmtFormattingProvider(): Monaco.languages.DocumentFormattingEditProvider {
	return {
		displayName: 'Oxfmt',
		async provideDocumentFormattingEdits(model) {
			const original = model.getValue();
			let formatted: string | null;
			try {
				formatted = await formatPlaygroundSource(original);
			} catch (error) {
				// Infrastructure failure — leave editor source unchanged.
				// oxlint-disable-next-line no-console
				console.warn('[playground] Format failed: Oxfmt runtime could not load.', error);
				return [];
			}
			if (formatted === null || formatted === original) {
				return [];
			}
			return [{ range: model.getFullModelRange(), text: formatted }];
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
	if (existing) {
		return existing;
	}

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
