import '../../styles/app.css';
import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import { act, Suspense } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { encodeDocsPlaygroundHash } from '../../lib/docs-playground-hash.js';

const PlaygroundEditor = (await import('./editor.js')).default;

const badlyFormatted = 'const playgroundFormatTest=(x)=>x';
const formatted = 'const playgroundFormatTest = (x) => x;';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
});

function monacoEditor(): Element | null {
	return document.querySelector('.monaco-editor');
}

function viewText(): string {
	return (document.querySelector('.view-lines')?.textContent ?? '').replace(/\u00a0/g, ' ');
}

// Cold-loading the real Monaco editor (core, workers, tokenizer) is the
// slow integration step in CI, so readiness gets one generous failure
// deadline. It is a deadline only: the test proceeds as soon as the editor
// is ready, and nothing sits through it.
const MONACO_READY_TIMEOUT_MS = 30_000;
// Editor readiness does not load the formatter: Prettier and its plugins
// are dynamically imported on the first format (see
// `@luke-ui/playground-core/format`), so format outcomes keep their own
// deadline for that cold load in CI. Later formats reuse the loaded modules.
const FORMAT_TIMEOUT_MS = 10_000;
// Covers the readiness deadline plus the format/undo round-trips after it.
const MONACO_TEST_TIMEOUT_MS = MONACO_READY_TIMEOUT_MS + 15_000;

/** Waits until Monaco has mounted, filled its pane, and shown the source. */
async function expectEditorReady() {
	const editorPane = () => monacoEditor()?.parentElement;
	await expect
		.poll(
			() => {
				const editorHeight = monacoEditor()?.getBoundingClientRect().height ?? 0;
				const paneHeight = editorPane()?.getBoundingClientRect().height ?? 0;
				const fillsPane = paneHeight > 0 && editorHeight / paneHeight > 0.8;
				const showsSource = viewText().includes('playgroundFormatTest');
				return fillsPane && showsSource;
			},
			{ timeout: MONACO_READY_TIMEOUT_MS },
		)
		.toBe(true);
}

test(
	'monaco fills the editor pane and format updates source through onChange',
	async () => {
		let hash = window.location.hash;
		await renderPlayground(badlyFormatted, (code) => {
			hash = `#${encodeDocsPlaygroundHash(code)}`;
			history.replaceState(null, '', hash);
		});

		const formatButton = page.getByRole('button', { name: 'Format' });
		await expect.element(formatButton).toBeVisible();
		await expectEditorReady();

		await userEvent.click(formatButton);

		await expect.poll(() => viewText(), { timeout: FORMAT_TIMEOUT_MS }).toContain(formatted);
		await expect
			.poll(() => decodeCodeHash(hash) ?? '', { timeout: FORMAT_TIMEOUT_MS })
			.toContain(formatted);

		const editor = monacoEditor();
		assert(editor, 'expected the Monaco editor to be mounted');
		await userEvent.click(editor);
		await userEvent.keyboard(ctrlCmd('z'));
		await expect
			.poll(() => viewText(), { timeout: FORMAT_TIMEOUT_MS })
			.toContain('playgroundFormatTest=(x)=>x');
	},
	MONACO_TEST_TIMEOUT_MS,
);

test(
	'the save shortcut formats through the Monaco provider and onChange',
	async () => {
		const onChangeCalls: Array<string> = [];
		await renderPlayground(badlyFormatted, (code) => onChangeCalls.push(code));

		await expectEditorReady();

		const editor = monacoEditor();
		assert(editor, 'expected the Monaco editor to be mounted');
		await userEvent.click(editor);
		await userEvent.keyboard(ctrlCmd('s'));

		await expect.poll(() => viewText(), { timeout: FORMAT_TIMEOUT_MS }).toContain(formatted);
		await expect
			.poll(() => onChangeCalls.some((code) => code.includes(formatted)), {
				timeout: FORMAT_TIMEOUT_MS,
			})
			.toBe(true);
	},
	MONACO_TEST_TIMEOUT_MS,
);

async function renderPlayground(defaultValue: string, onChange: (code: string) => void) {
	container = document.body.appendChild(document.createElement('div'));
	container.style.cssText = 'block-size: 480px; min-block-size: 0; overflow: hidden';
	root = createRoot(container);

	await act(async () => {
		root?.render(<Harness defaultValue={defaultValue} onChange={onChange} />);
	});
}

function Harness({
	defaultValue,
	onChange,
}: {
	defaultValue: string;
	onChange: (code: string) => void;
}) {
	return (
		<div style={{ blockSize: '100%', minBlockSize: 0 }}>
			{/* The editor suspends until Monaco's themes and tokenizer are ready. */}
			<Suspense fallback={null}>
				<PlaygroundEditor defaultValue={defaultValue} onChange={onChange} showLoadingPill={false} />
			</Suspense>
		</div>
	);
}

// Monaco maps its CtrlCmd modifier to Cmd on macOS and Ctrl everywhere else, so
// a test that hardcodes one of them passes on a single platform.
function ctrlCmd(key: string): string {
	const modifier = navigator.userAgent.includes('Macintosh') ? 'Meta' : 'Control';
	return `{${modifier}>}${key}{/${modifier}}`;
}
