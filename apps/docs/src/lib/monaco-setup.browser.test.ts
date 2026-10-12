import * as monaco from 'monaco-editor';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { ensurePlaygroundMonaco, monacoThemes } from './monaco-setup.js';

const SOURCE = ['const answer = 42;', 'const label = "text";'].join('\n');

// GitHub high-contrast token colours, not Monaco's `vs` / `vs-dark` defaults.
const palettes = {
	dark: { keyword: '#ff9492', number: '#91cbff', string: '#addcff' },
	light: { keyword: '#a0111f', number: '#023b95', string: '#032563' },
} as const;

// GitHub high-contrast selection colours: opaque background plus a readable foreground.
const selections = {
	dark: { background: '#ffffff', foreground: '#0a0c10' },
	light: { background: '#0e1116', foreground: '#ffffff' },
} as const;

let container: HTMLElement | undefined;
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

afterEach(() => {
	const model = editor?.getModel();
	editor?.dispose();
	model?.dispose();
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

	// Monaco may render a literal as one span or split it (e.g. quotes apart from the text).
	// Match consecutive leaf spans on one line, so an untokenized whole-line span never matches.
	function colourOf(text: string): string {
		for (const line of root.querySelectorAll('.view-line')) {
			const leaves = [...line.querySelectorAll('span')].filter(
				(span) => span.children.length === 0,
			);
			for (let start = 0; start < leaves.length; start++) {
				let joined = '';
				for (let end = start; end < leaves.length && text.startsWith(joined); end++) {
					joined += leaves[end]?.textContent ?? '';
					if (joined !== text) continue;
					const colours = new Set(
						leaves.slice(start, end + 1).map((span) => getComputedStyle(span).color),
					);
					const [colour] = colours;
					if (colours.size === 1 && colour) return colour;
					break;
				}
			}
		}
		throw new Error(`No uniformly coloured rendered token "${text}"`);
	}

	return { colourOf, created, root };
}

for (const mode of ['light', 'dark'] as const) {
	test(`playground ${mode} tokens use the GitHub high-contrast palette`, async () => {
		const { colourOf, root } = await renderEditor(mode);
		const palette = palettes[mode];

		// Monaco tokenizes lazily, so retry until the viewport is coloured.
		await vi.waitFor(() => {
			expect(colourOf('const')).toBe(hexToRgb(palette.keyword));
			expect(colourOf('42')).toBe(hexToRgb(palette.number));
			expect(colourOf('"text"')).toBe(hexToRgb(palette.string));
		});
		// High-contrast base, so Monaco applies `editor.selectionForeground`.
		expect(root.querySelector(mode === 'light' ? '.hc-light' : '.hc-black')).not.toBeNull();
	});
}

for (const mode of ['light', 'dark'] as const) {
	test(`playground ${mode} selection is readable`, async () => {
		const { created, root } = await renderEditor(mode);
		const selection = selections[mode];

		created.focus();
		created.setSelection(new monaco.Selection(1, 1, 1, 6));

		// Selection rendering is async, so retry until Monaco paints it.
		await vi.waitFor(() => {
			const selected = root.querySelector('.view-line span.inline-selected-text');
			const background = root.querySelector('.selected-text');
			if (!selected || !background) throw new Error('Selection not rendered yet');
			expect(selected.textContent).toBe('const');
			expect(getComputedStyle(selected).color).toBe(hexToRgb(selection.foreground));
			expect(getComputedStyle(background).backgroundColor).toBe(hexToRgb(selection.background));
		});
	});
}
