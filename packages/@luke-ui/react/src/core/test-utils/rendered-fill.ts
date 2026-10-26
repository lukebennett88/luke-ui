import { parseColor } from '../../theme/color.js';
import { renderedPixels } from './autofill.js';
import { visibleTextElements } from './axe.js';

/**
 * The fill a control paints, with its text hidden so a screenshot's own text colour cannot bias
 * the sample.
 */
export async function renderedFill(element: HTMLElement) {
	const texts = visibleTextElements(element).filter((text) => text instanceof HTMLElement);
	const visibilities = texts.map((text) => text.style.visibility);
	for (const text of texts) text.style.visibility = 'hidden';
	try {
		const pixels = await renderedPixels(element);
		const x = Math.floor(pixels.width / 2);
		const y = Math.floor(pixels.height / 2);
		const offset = (y * pixels.width + x) * 4;
		const hex = [0, 1, 2]
			.map((channel) => (pixels.data[offset + channel] ?? 0).toString(16).padStart(2, '0'))
			.join('');
		return parseColor(`#${hex}`);
	} finally {
		for (const [index, text] of texts.entries()) text.style.visibility = visibilities[index] ?? '';
	}
}
