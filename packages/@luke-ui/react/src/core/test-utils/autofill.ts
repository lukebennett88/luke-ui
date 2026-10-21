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
 * Fill each input from `source` (1Password's marker, or Chromium's native `:autofill` state). Its
 * text must not move or change colour, and the extension paint must stay inside its control's
 * border. The paint stays on afterwards.
 */
export async function expectFillKeepsTextAndBorder(
	inputs: Array<HTMLInputElement>,
	source: 'password-manager' | 'native',
) {
	const references = new Map<HTMLInputElement, Uint8ClampedArray>();
	for (const input of inputs) {
		// eslint-disable-next-line no-await-in-loop -- element screenshots are taken one at a time
		references.set(input, await inputTextPixels(input));
	}
	if (source === 'native') await forceAutofill(inputs);
	for (const input of inputs) {
		const text = references.get(input);
		if (text === undefined) throw new Error('Expected reference text pixels.');
		// eslint-disable-next-line no-await-in-loop -- element screenshots are taken one at a time
		await expectFilledInput(input, text, source);
	}
}

async function expectFilledInput(
	input: HTMLInputElement,
	text: Uint8ClampedArray,
	source: 'password-manager' | 'native',
) {
	if (source === 'password-manager') input.setAttribute('data-com-onepassword-filled', 'light');
	expectSameInputText(
		await inputTextPixels(input),
		text,
		input.getAttribute('aria-label') ?? input.getAttribute('aria-labelledby') ?? 'Input',
	);
	await expectAutofillBackgroundHidden(input, input.closest('[role="group"]') ?? input);
	input.style.setProperty('background-color', extensionPaint, 'important');
}

/** Rendered text, excluding the border and inset depth at the edges of the input. */
async function inputTextPixels(element: HTMLInputElement): Promise<Uint8ClampedArray> {
	const { context, width, height } = await renderedCanvas(element);
	const inset = 6 * window.devicePixelRatio;
	return context.getImageData(inset, inset, width - inset * 2, height - inset * 2).data;
}

/** Border and field cross-sections stay visible over an unlayered extension background. */
async function expectAutofillBackgroundHidden(input: HTMLInputElement, control: Element) {
	const before = await renderedCanvas(control);
	input.style.setProperty('background-color', extensionPaint, 'important');
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

function expectSameInputText(actual: Uint8ClampedArray, expected: Uint8ClampedArray, name: string) {
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
