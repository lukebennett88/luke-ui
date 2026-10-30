export type Rgb = [number, number, number];

/** The sRGB bytes the browser paints for a CSS colour, such as an `oklch()` computed value. */
export function paintedColor(color: string): Rgb {
	const context = new OffscreenCanvas(1, 1).getContext('2d');
	if (!context) throw new Error('No 2D canvas context to resolve a colour.');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
	return [red, green, blue];
}

/** The WCAG relative luminance of sRGB bytes. */
export function relativeLuminance(rgb: Rgb): number {
	const [red = 0, green = 0, blue = 0] = rgb.map((byte) => {
		const channel = byte / 255;
		return channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The WCAG contrast ratio between two relative luminances. */
export function contrastRatio(first: number, second: number): number {
	return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** The WCAG contrast ratio between two painted colours. */
export function contrast(first: Rgb, second: Rgb): number {
	return contrastRatio(relativeLuminance(first), relativeLuminance(second));
}
