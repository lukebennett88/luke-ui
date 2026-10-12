import * as monaco from 'monaco-editor';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { ensurePlaygroundMonaco, monacoThemes } from './monaco-setup.js';

const SOURCE = ['const answer = 42;', 'const label = "text";'].join('\n');

// GitHub high-contrast token colours, not Monaco's `vs` / `vs-dark` defaults.
const palettes = {
	dark: { keyword: '#ff9492', number: '#91cbff', string: '#addcff' },
	light: { keyword: '#a0111f', number: '#023b95', string: '#032563' },
} as const;

let container: HTMLElement | undefined;
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

afterEach(() => {
	editor?.dispose();
	editor?.getModel()?.dispose();
	container?.remove();
	editor = undefined;
	container = undefined;
});

function hexToRgb(hex: string): string {
	const [red, green, blue] = [1, 3, 5].map((start) =>
		Number.parseInt(hex.slice(start, start + 2), 16),
	);
	return `rgb(${red}, ${green}, ${blue})`;
}

async function renderEditor(mode: keyof typeof palettes) {
	await ensurePlaygroundMonaco();
	container = document.body.appendChild(document.createElement('div'));
	container.style.height = '200px';
	container.style.width = '400px';
	const created = monaco.editor.create(container, {
		language: 'typescript',
		theme: monacoThemes[mode],
		value: SOURCE,
	});
	editor = created;
	const root = container;

	function colourOf(text: string): string {
		const token = [...root.querySelectorAll('.view-line span span')].find((element) =>
			element.textContent?.includes(text),
		);
		if (!token) throw new Error(`No rendered token "${text}"`);
		return getComputedStyle(token).color;
	}

	return { colourOf, root };
}

for (const mode of ['light', 'dark'] as const) {
	test(`playground ${mode} tokens use the GitHub high-contrast palette`, async () => {
		const { colourOf, root } = await renderEditor(mode);
		const palette = palettes[mode];

		// Monaco tokenizes lazily, so retry until the viewport is coloured.
		await vi.waitFor(() => {
			expect(colourOf('const')).toBe(hexToRgb(palette.keyword));
			expect(colourOf('42')).toBe(hexToRgb(palette.number));
			expect(colourOf('text')).toBe(hexToRgb(palette.string));
		});
		// High-contrast base, so Monaco applies `editor.selectionForeground`.
		expect(root.querySelector(mode === 'light' ? '.hc-light' : '.hc-black')).not.toBeNull();
	});
}
