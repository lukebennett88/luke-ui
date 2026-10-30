import { page } from 'vite-plus/test/context';
import { visibleTextElements } from './axe.js';
import { contrastRatio, paintedColor, relativeLuminance } from './painted-color.js';

/**
 * The lowest WCAG contrast ratio between a visible text element's colour inside `element` and any
 * pixel painted behind that text. It screenshots `element` with its text hidden, so it measures
 * what axe cannot: text over a gradient or a translucent layer, such as the control finish.
 *
 * Hiding a text element also hides its own fill, so the text must sit inside the element that
 * paints the fill, as a Button's label does. It throws when `element` has no descendant that holds
 * visible text, or when none of the text's box falls inside `element`'s screenshot, because a ratio
 * over no pixels would pass vacuously.
 */
export async function lowestRenderedTextContrast(element: HTMLElement): Promise<number> {
	return (await lowestRenderedTextContrastAt(element)).contrast;
}

/** Where the lowest contrast was measured, in CSS pixels from `element`'s top-left corner. */
export interface LowestTextContrast {
	contrast: number;
	x: number;
	y: number;
}

/** `lowestRenderedTextContrast`, with the pixel where the lowest ratio occurred. */
export async function lowestRenderedTextContrastAt(
	element: HTMLElement,
): Promise<LowestTextContrast> {
	const texts = visibleTextElements(element).filter((text) => text instanceof HTMLElement);
	if (texts.length === 0) throw new Error('No descendant of the element holds visible text.');
	const visibilities = texts.map((text) => text.style.visibility);
	for (const text of texts) text.style.visibility = 'hidden';
	let screenshot: string;
	try {
		screenshot = await page.screenshot({ element, save: false });
	} finally {
		for (const [index, text] of texts.entries()) text.style.visibility = visibilities[index] ?? '';
	}

	const pixels = await decodePng(screenshot);
	const bounds = element.getBoundingClientRect();
	const scale = pixels.width / bounds.width;
	const lowest: LowestTextContrast = { contrast: Number.POSITIVE_INFINITY, x: 0, y: 0 };
	for (const text of texts) {
		const foreground = relativeLuminance(paintedColor(getComputedStyle(text).color));
		const rect = text.getBoundingClientRect();
		const left = Math.max(0, Math.floor((rect.left - bounds.left) * scale));
		const right = Math.min(pixels.width, Math.ceil((rect.right - bounds.left) * scale));
		const top = Math.max(0, Math.floor((rect.top - bounds.top) * scale));
		const bottom = Math.min(pixels.height, Math.ceil((rect.bottom - bounds.top) * scale));
		for (let y = top; y < bottom; y++) {
			for (let x = left; x < right; x++) {
				const offset = (y * pixels.width + x) * 4;
				const background = relativeLuminance([
					pixels.data[offset] ?? 0,
					pixels.data[offset + 1] ?? 0,
					pixels.data[offset + 2] ?? 0,
				]);
				const ratio = contrastRatio(foreground, background);
				if (ratio < lowest.contrast) {
					lowest.contrast = ratio;
					lowest.x = (x + 0.5) / scale;
					lowest.y = (y + 0.5) / scale;
				}
			}
		}
	}
	if (!Number.isFinite(lowest.contrast)) {
		throw new Error('No pixels were sampled behind the text, so no contrast was measured.');
	}
	return lowest;
}

async function decodePng(base64: string): Promise<ImageData> {
	const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
	const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
	const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
	if (!context) throw new Error('No 2D canvas context to decode the screenshot.');
	context.drawImage(bitmap, 0, 0);
	return context.getImageData(0, 0, bitmap.width, bitmap.height);
}
