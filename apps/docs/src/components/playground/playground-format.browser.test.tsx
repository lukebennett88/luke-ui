import '../../styles/app.css';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { decodeCodeHash, encodeCodeHash } from '../../lib/playground-hash';

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

test('monaco fills the editor pane and format updates source through onChange', async () => {
	const hashRef = { current: window.location.hash };
	renderPlayground(badlyFormatted, (code) => {
		hashRef.current = `#${encodeCodeHash(code)}`;
		history.replaceState(null, '', hashRef.current);
	});

	const formatButton = page.getByRole('button', { name: 'Format' });
	await expect.element(formatButton).toBeVisible();

	const monacoEditor = () => document.querySelector('.monaco-editor');
	await expect
		.poll(() => monacoEditor()?.getBoundingClientRect().height ?? 0, { timeout: 30_000 })
		.toBeGreaterThan(100);

	const editorPane = () => document.querySelector('.monaco-editor')?.parentElement;
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

	const viewText = () =>
		(document.querySelector('.view-lines')?.textContent ?? '').replace(/\u00a0/g, ' ');
	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain(formatted);
	await expect
		.poll(() => decodeCodeHash(hashRef.current) ?? '', { timeout: 10_000 })
		.toContain(formatted);

	await userEvent.click(monacoEditor()!);
	await userEvent.keyboard(ctrlCmd('z'));
	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain('playgroundFormatTest=(x)=>x');
}, 60_000);

test('the save shortcut formats through the Monaco provider and onChange', async () => {
	const onChangeCalls: Array<string> = [];
	renderPlayground(badlyFormatted, (code) => onChangeCalls.push(code));

	const monacoEditor = () => document.querySelector('.monaco-editor');
	await expect
		.poll(() => monacoEditor()?.getBoundingClientRect().height ?? 0, { timeout: 30_000 })
		.toBeGreaterThan(100);

	const viewText = () =>
		(document.querySelector('.view-lines')?.textContent ?? '').replace(/\u00a0/g, ' ');

	await userEvent.click(monacoEditor()!);
	await userEvent.keyboard(ctrlCmd('s'));

	await expect.poll(() => viewText(), { timeout: 10_000 }).toContain(formatted);
	await expect
		.poll(() => onChangeCalls.some((code) => code.includes(formatted)), { timeout: 10_000 })
		.toBe(true);
}, 60_000);

function renderPlayground(defaultValue: string, onChange: (code: string) => void) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = 'h-[480px] min-h-0 overflow-hidden';
	root = createRoot(container);

	act(() => {
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
		<div className="h-full min-h-0">
			<PlaygroundEditor defaultValue={defaultValue} onChange={onChange} showLoadingPill={false} />
		</div>
	);
}

// Monaco maps its CtrlCmd modifier to Cmd on macOS and Ctrl everywhere else, so
// a test that hardcodes one of them passes on a single platform.
function ctrlCmd(key: string): string {
	const modifier = navigator.userAgent.includes('Macintosh') ? 'Meta' : 'Control';
	return `{${modifier}>}${key}{/${modifier}}`;
}
