import '../../styles/app.css';
import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import { act, Suspense } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
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

test('monaco fills the editor pane and format updates source through onChange', async () => {
	let hash = window.location.hash;
	await renderPlayground(badlyFormatted, (code) => {
		hash = `#${encodeDocsPlaygroundHash(code)}`;
		history.replaceState(null, '', hash);
	});

	const formatButton = page.getByRole('button', { name: 'Format' });
	await expect.element(formatButton).toBeVisible();

	await expect
		.poll(() => monacoEditor()?.getBoundingClientRect().height ?? 0, { timeout: 30_000 })
		.toBeGreaterThan(100);

	const editorPane = () => monacoEditor()?.parentElement;
	await expect
		.poll(
			() => {
				const editorHeight = monacoEditor()?.getBoundingClientRect().height ?? 0;
				const paneHeight = editorPane()?.getBoundingClientRect().height ?? 0;
				return paneHeight > 0 ? editorHeight / paneHeight : 0;
			},
			{ timeout: 30_000 },
		)
		.toBeGreaterThan(0.8);

	await expect
		.poll(() => document.querySelector('.view-lines')?.textContent ?? '', { timeout: 30_000 })
		.toContain('playgroundFormatTest');

	await userEvent.click(formatButton);

	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain(formatted);
	await expect.poll(() => decodeCodeHash(hash) ?? '', { timeout: 10_000 }).toContain(formatted);

	await userEvent.click(monacoEditor()!);
	await userEvent.keyboard(ctrlCmd('z'));
	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain('playgroundFormatTest=(x)=>x');
}, 60_000);

test('the save shortcut formats through the Monaco provider and onChange', async () => {
	const onChangeCalls: Array<string> = [];
	await renderPlayground(badlyFormatted, (code) => onChangeCalls.push(code));

	await expect
		.poll(() => monacoEditor()?.getBoundingClientRect().height ?? 0, { timeout: 30_000 })
		.toBeGreaterThan(100);

	await userEvent.click(monacoEditor()!);
	await userEvent.keyboard(ctrlCmd('s'));

	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain(formatted);
	await expect
		.poll(() => onChangeCalls.some((code) => code.includes(formatted)), { timeout: 10_000 })
		.toBe(true);
}, 60_000);

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
