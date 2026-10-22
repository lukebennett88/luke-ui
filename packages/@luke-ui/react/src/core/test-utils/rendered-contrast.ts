import { page } from 'vite-plus/test/context';
import { visibleTextElements } from './axe.js';

/**
 * The lowest WCAG contrast ratio between a visible text element's colour inside `element` and any
 * pixel painted behind that text. It screenshots `element` with its text hidden, so it measures
 * what axe cannot: text over a gradient or a translucent layer, such as the control finish.
 *
 * Hiding a text element also hides its own fill, so the text must sit inside the element that
 * paints the fill, as a Button's label does.
 */
export async function lowestRenderedTextContrast(element: HTMLElement): Promise<number> {
	const texts = visibleTextElements(element).filter((text) => text instanceof HTMLElement);
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
	let lowest = Number.POSITIVE_INFINITY;
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
				lowest = Math.min(lowest, contrastRatio(foreground, background));
			}
		}
	}
	return lowest;
}

type Rgb = [number, number, number];

async function decodePng(base64: string): Promise<ImageData> {
	const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
	const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
	const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
	if (!context) throw new Error('No 2D canvas context to decode the screenshot.');
	context.drawImage(bitmap, 0, 0);
	return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

/** The sRGB bytes the browser paints for a CSS colour, such as an `oklch()` computed value. */
function paintedColor(color: string): Rgb {
	const context = new OffscreenCanvas(1, 1).getContext('2d');
	if (!context) throw new Error('No 2D canvas context to resolve a colour.');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
	return [red, green, blue];
}

function relativeLuminance(rgb: Rgb): number {
	const [red, green, blue] = rgb.map((byte) => {
		const channel = byte / 255;
		return channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

function contrastRatio(first: number, second: number): number {
	return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
