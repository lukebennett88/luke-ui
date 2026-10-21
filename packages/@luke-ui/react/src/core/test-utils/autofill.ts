import { expect } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';

/** Rendered text, excluding the border and inset depth at the edges of the input. */
export async function inputTextPixels(element: HTMLInputElement): Promise<Uint8ClampedArray> {
	const { context, width, height } = await renderedCanvas(element);
	const inset = 6 * window.devicePixelRatio;
	return context.getImageData(inset, inset, width - inset * 2, height - inset * 2).data;
}

/** Border and field cross-sections stay visible over an unlayered extension background. */
export async function expectAutofillBackgroundHidden(input: HTMLInputElement, control: Element) {
	const before = await renderedCanvas(control);
	input.style.setProperty('background-color', 'rgb(160, 200, 255)', 'important');
	try {
		const after = await renderedCanvas(control);
		// The cross-sections include the outer border, invalid ring, field fill, and text. They avoid
		// double antialiasing where the rounded inset shadow meets the input's rounded background.
		const x = Math.floor(before.width / 2);
		const y = Math.floor(before.height / 2);
		expect(after.context.getImageData(x, 0, 1, after.height).data).toEqual(
			before.context.getImageData(x, 0, 1, before.height).data,
		);
		expect(after.context.getImageData(0, y, after.width, 1).data).toEqual(
			before.context.getImageData(0, y, before.width, 1).data,
		);
	} finally {
		input.style.removeProperty('background-color');
	}
}

/** Apply Chromium's native autofill pseudo-state, including its user-agent paint rules. */
export async function forceAutofill(inputs: Array<HTMLInputElement>) {
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

export function expectSameInputText(
	actual: Uint8ClampedArray,
	expected: Uint8ClampedArray,
	name: string,
) {
	const pixelsMatch =
		actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
	expect({ name, pixelsMatch }).toEqual({ name, pixelsMatch: true });
}

async function renderedCanvas(element: Element) {
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
	return { context, width: image.width, height: image.height };
}
