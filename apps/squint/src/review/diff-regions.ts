/** A rectangle in image pixels that bounds a cluster of differing pixels. */
export type DiffRegion = { height: number; width: number; x: number; y: number };

type DiffRegions = { height: number; regions: Array<DiffRegion>; width: number };

/** Rows of unchanged pixels that separate one region from the next. */
const ROW_GAP = 16;
/** Space around the differing pixels, so the outline does not cover them. */
const PADDING = 6;

const cache = new Map<string, Promise<DiffRegions | undefined>>();

/**
 * Finds where a diff image marks differences, so a few changed pixels in a tall screenshot can be
 * outlined. Resolves to `undefined` when the image cannot be read. Never rejects.
 */
export function loadDiffRegions(diffUrl: string): Promise<DiffRegions | undefined> {
	const cached = cache.get(diffUrl);
	if (cached) return cached;
	const result = readDiffRegions(diffUrl).catch(() => undefined);
	cache.set(diffUrl, result);
	return result;
}

/**
 * Groups the diff colour's pixels into regions. Rows with differences that sit within `ROW_GAP`
 * rows of each other share a region, which spans their leftmost to rightmost differing pixel.
 */
function findDiffRegions(
	data: Uint8ClampedArray,
	width: number,
	height: number,
): Array<DiffRegion> {
	const regions: Array<DiffRegion> = [];
	let band: { bottom: number; left: number; right: number; top: number } | undefined;

	for (let y = 0; y < height; y++) {
		let left = -1;
		let right = -1;
		for (let x = 0; x < width; x++) {
			if (!isDiffPixel(data, (y * width + x) * 4)) continue;
			if (left === -1) left = x;
			right = x;
		}
		if (left === -1) continue;
		if (band && y - band.bottom <= ROW_GAP) {
			band.bottom = y;
			band.left = Math.min(band.left, left);
			band.right = Math.max(band.right, right);
			continue;
		}
		if (band) regions.push(toRegion(band, width, height));
		band = { bottom: y, left, right, top: y };
	}
	if (band) regions.push(toRegion(band, width, height));
	return regions;
}

/** The comparison paints a differing pixel pure red and everything else a faded grey. */
function isDiffPixel(data: Uint8ClampedArray, index: number) {
	return data[index] === 255 && data[index + 1] === 0 && data[index + 2] === 0;
}

function toRegion(
	band: { bottom: number; left: number; right: number; top: number },
	width: number,
	height: number,
): DiffRegion {
	const x = Math.max(band.left - PADDING, 0);
	const y = Math.max(band.top - PADDING, 0);
	return {
		height: Math.min(band.bottom + PADDING + 1, height) - y,
		width: Math.min(band.right + PADDING + 1, width) - x,
		x,
		y,
	};
}

async function readDiffRegions(diffUrl: string): Promise<DiffRegions | undefined> {
	const image = new Image();
	// Published reports live on another origin. Reading their pixels needs a CORS-enabled request.
	image.crossOrigin = 'anonymous';
	image.src = diffUrl;
	await image.decode();
	const { naturalHeight: height, naturalWidth: width } = image;
	const context = new OffscreenCanvas(width, height).getContext('2d');
	if (!context) return undefined;
	context.drawImage(image, 0, 0);
	const regions = findDiffRegions(context.getImageData(0, 0, width, height).data, width, height);
	return { height, regions, width };
}
