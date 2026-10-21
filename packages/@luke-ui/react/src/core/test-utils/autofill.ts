import { expect } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';

/** Square paint an unlayered extension stylesheet adds to a filled input. */
const extensionPaint = 'rgb(160, 200, 255)';

/**
 * Chromium can re-rasterise an antialiased edge, or anything in a translucent (disabled) layer, a
 * level or two away when an input's paint changes. A visible fill moves pixels by dozens of levels.
 */
const rasterNoise = 2;

/**
 * Fill inputs as `source` does (1Password's marker, or Chromium's native `:autofill` state), then
 * add the square paint an extension stylesheet puts on a filled input.
 */
export async function fillInputs(
	inputs: Array<HTMLInputElement>,
	source: 'password-manager' | 'native',
) {
	if (source === 'native') await forceAutofill(inputs);
	for (const input of inputs) {
		if (source === 'password-manager') input.setAttribute('data-com-onepassword-filled', 'light');
		input.style.setProperty('background-color', extensionPaint, 'important');
	}
}

/** Expect `element` to render the same after `change`, apart from raster noise. */
export async function expectRenderUnchanged(element: Element, change: () => Promise<void>) {
	const before = await renderedPixels(element);
	await change();
	const after = await renderedPixels(element);
	expect([after.width, after.height], 'rendered size').toEqual([before.width, before.height]);
	let largest = 0;
	for (let index = 0; index < before.data.length; index++) {
		largest = Math.max(largest, Math.abs(before.data[index]! - after.data[index]!));
	}
	expect(largest, 'largest colour change, in levels').toBeLessThanOrEqual(rasterNoise);
}

/** A screenshot of `element` as RGBA pixels, with its scale from CSS pixels. */
export async function renderedPixels(element: Element) {
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
		scale: image.width / element.getBoundingClientRect().width,
	};
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
