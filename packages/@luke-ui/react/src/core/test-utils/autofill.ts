import { expect } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';

/** Square paint an unlayered extension stylesheet adds to a filled input. */
const extensionPaint = 'rgb(160, 200, 255)';

/** Mark inputs as 1Password does and add its square paint, for a capture of the filled state. */
export function fillAsPasswordManager(inputs: Array<HTMLInputElement>, mode: string) {
	for (const input of inputs) {
		input.setAttribute('data-com-onepassword-filled', mode);
		input.style.setProperty('background-color', extensionPaint, 'important');
	}
}

/**
 * Fill `inputs` from `source` (1Password's marker, or Chromium's native `:autofill` state), paint
 * each as an extension stylesheet does, and compare `scene` with its unfilled render.
 *
 * Away from the text, every pixel must be unchanged: the fill shows nowhere, and borders, depth,
 * rings, state styles, and adornments stay as they were. Each input's solid glyph pixels keep their
 * colour, so the text stays legible. Glyph edges blend with what is under the text and aren't
 * compared.
 */
export async function expectFillPreservesControls(
	scene: Element,
	inputs: Array<HTMLInputElement>,
	source: 'password-manager' | 'native',
) {
	const unfilled = await renderedPixels(scene);
	const textless = await withTextFill(inputs, 'transparent', () => renderedPixels(scene));
	const marked = await withTextFill(inputs, markerText, () => renderedPixels(scene));
	if (source === 'native') await forceAutofill(inputs);
	for (const input of inputs) {
		if (source === 'password-manager') input.setAttribute('data-com-onepassword-filled', 'light');
		input.style.setProperty('background-color', extensionPaint, 'important');
	}
	const filled = await renderedPixels(scene);
	expect([filled.width, filled.height], 'filled scene size').toEqual([
		unfilled.width,
		unfilled.height,
	]);

	const sceneBox = scene.getBoundingClientRect();
	const scale = unfilled.width / sceneBox.width;
	const regions = inputs.map((input) => {
		const box = input.getBoundingClientRect();
		return {
			name: inputName(input),
			tolerance: Number(getComputedStyle(input).opacity) < 1 ? 2 : rasterNoise,
			left: Math.floor((box.left - sceneBox.left) * scale),
			top: Math.floor((box.top - sceneBox.top) * scale),
			right: Math.ceil((box.right - sceneBox.left) * scale),
			bottom: Math.ceil((box.bottom - sceneBox.top) * scale),
		};
	});
	const text = textMask(marked, textless);

	const changedAwayFromText = new Set<string>();
	for (let index = 0; index < text.length; index++) {
		if (text[index] === 1 || samePixel(unfilled.data, filled.data, index)) continue;
		const x = index % unfilled.width;
		const y = Math.floor(index / unfilled.width);
		const region = regions.find(
			({ left, top, right, bottom }) => x >= left && x < right && y >= top && y < bottom,
		);
		const tolerance = region?.tolerance ?? rasterNoise;
		if (pixelDistance(unfilled.data, filled.data, index) <= tolerance) continue;
		changedAwayFromText.add(region?.name ?? 'outside the inputs');
	}
	expect([...changedAwayFromText], 'controls changed away from the text').toEqual([]);

	const recolouredText = regions
		.filter((region) => !solidTextKept(region, marked, textless, unfilled, filled))
		.map(({ name }) => name);
	expect(recolouredText, 'inputs whose solid text changed').toEqual([]);
}

/**
 * Chromium can re-rasterise an antialiased border or ring a level away after the fill changes the
 * inputs' paint, and a translucent (disabled) input by up to two. A visible fill differs by dozens
 * of levels, even at disabled opacity.
 */
const rasterNoise = 1;

interface Pixels {
	data: Uint8ClampedArray;
	width: number;
	height: number;
}

interface Region {
	name: string;
	tolerance: number;
	left: number;
	top: number;
	right: number;
	bottom: number;
}

function inputName(input: HTMLInputElement): string {
	const labelledBy = input.getAttribute('aria-labelledby')?.split(' ')[0];
	return (
		input.getAttribute('aria-label') ??
		(labelledBy ? document.getElementById(labelledBy)?.textContent : undefined) ??
		'Input'
	);
}

/** Text colour far from every surface, so faint glyph edges still show in the text mask. */
const markerText = 'rgb(255, 0, 255)';

/**
 * Render with the inputs' text in `fill`. Forced colours would replace the fill, so these renders
 * opt out of them. Only renders made the same way are compared with each other.
 */
async function withTextFill<T>(
	inputs: Array<HTMLInputElement>,
	fill: string,
	run: () => Promise<T>,
) {
	for (const input of inputs) {
		input.style.setProperty('-webkit-text-fill-color', fill, 'important');
		input.style.setProperty('forced-color-adjust', 'none', 'important');
	}
	try {
		return await run();
	} finally {
		for (const input of inputs) {
			input.style.removeProperty('-webkit-text-fill-color');
			input.style.removeProperty('forced-color-adjust');
		}
	}
}

/** Pixels the text touches, grown by one pixel so antialiased edges count as text. */
function textMask(marked: Pixels, textless: Pixels): Uint8Array {
	const { width, height } = marked;
	const mask = new Uint8Array(width * height);
	for (let index = 0; index < mask.length; index++) {
		if (samePixel(marked.data, textless.data, index)) continue;
		const x = index % width;
		const y = Math.floor(index / width);
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < width && ny >= 0 && ny < height) mask[ny * width + nx] = 1;
			}
		}
	}
	return mask;
}

/**
 * The pixels where the marker text is strongest are fully covered by glyphs, so nothing under the
 * text shows through them. There the filled text must match the unfilled text exactly.
 */
function solidTextKept(
	region: Region,
	marked: Pixels,
	textless: Pixels,
	unfilled: Pixels,
	filled: Pixels,
) {
	let strongest = 0;
	const solid: Array<number> = [];
	for (let y = region.top; y < region.bottom; y++) {
		for (let x = region.left; x < region.right; x++) {
			const index = y * marked.width + x;
			const strength = pixelDistance(marked.data, textless.data, index);
			if (strength > strongest) {
				strongest = strength;
				solid.length = 0;
			}
			if (strength === strongest && strength > 0) solid.push(index);
		}
	}
	return solid.length > 0 && solid.every((index) => samePixel(unfilled.data, filled.data, index));
}

function pixelDistance(a: Uint8ClampedArray, b: Uint8ClampedArray, index: number): number {
	const offset = index * 4;
	return Math.max(
		Math.abs(a[offset]! - b[offset]!),
		Math.abs(a[offset + 1]! - b[offset + 1]!),
		Math.abs(a[offset + 2]! - b[offset + 2]!),
	);
}

function samePixel(a: Uint8ClampedArray, b: Uint8ClampedArray, index: number): boolean {
	const offset = index * 4;
	return (
		a[offset] === b[offset] &&
		a[offset + 1] === b[offset + 1] &&
		a[offset + 2] === b[offset + 2] &&
		a[offset + 3] === b[offset + 3]
	);
}

/** Apply Chromium's native autofill pseudo-state, including its user-agent paint rules. */
async function forceAutofill(inputs: Array<HTMLInputElement>) {
	const session = cdp();
	await session.send('DOM.enable');
	await session.send('CSS.enable');
	// Populate nodes across the Vitest iframe before searching them.
	await session.send('DOM.getDocument', { depth: -1, pierce: true });
	await Promise.all(
		inputs.map(async (input, index) => {
			input.setAttribute('data-native-autofill-test', String(index));
			const { searchId, resultCount } = await session.send('DOM.performSearch', {
				query: `[data-native-autofill-test="${index}"]`,
			});
			try {
				expect(resultCount).toBe(1);
				const { nodeIds } = await session.send('DOM.getSearchResults', {
					searchId,
					fromIndex: 0,
					toIndex: 1,
				});
				const nodeId = nodeIds[0];
				if (nodeId === undefined) throw new Error('Expected the autofill input node.');
				await session.send('CSS.forcePseudoState', {
					nodeId,
					forcedPseudoClasses: ['autofill'],
				});
				expect(input.matches(':autofill')).toBe(true);
			} finally {
				await session.send('DOM.discardSearchResults', { searchId });
				input.removeAttribute('data-native-autofill-test');
			}
		}),
	);
}

async function renderedPixels(element: Element): Promise<Pixels> {
	const { base64 } = await page.elementLocator(element).screenshot({ base64: true });
	const image = new Image();
	image.src = `data:image/png;base64,${base64}`;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d');
	if (context === null) throw new Error('Expected a 2D canvas context.');
	context.drawImage(image, 0, 0);
	return {
		data: context.getImageData(0, 0, image.width, image.height).data,
		width: image.width,
		height: image.height,
	};
}
