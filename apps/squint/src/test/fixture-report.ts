import { crc32, deflateSync } from 'node:zlib';

/**
 * The small report the browser tests review through `?source=local`. Each screenshot is a few flat
 * rectangles, so the report is drawn here instead of committed as binary files.
 */

type Rgb = readonly [number, number, number];
type Rect = { color: Rgb; height: number; width: number; x: number; y: number };
type Drawing = { background: Rgb; height: number; rects: ReadonlyArray<Rect>; width: number };

const WHITE: Rgb = [255, 255, 255];
const INK: Rgb = [30, 40, 60];
/** The comparison paints a differing pixel pure red. See `diff-regions.ts`. */
const DIFF: Rgb = [255, 0, 0];
const DIFF_BACKGROUND: Rgb = [220, 220, 220];
const VIEWPORT = '1024x800';

const ink = (x: number, y: number, width: number, height: number): Rect => {
	return { color: INK, height, width, x, y };
};
const page = (rects: ReadonlyArray<Rect>, width = 200): Drawing => {
	return { background: WHITE, height: 300, rects, width };
};
const diff = (rects: ReadonlyArray<Omit<Rect, 'color'>>, width = 200): Drawing => {
	return {
		background: DIFF_BACKGROUND,
		height: 300,
		rects: rects.map((rect) => ({ ...rect, color: DIFF })),
		width,
	};
};

const button = ink(20, 20, 90, 40);
/** A 13 by 20 pixel change, away from the start, so stepping to it scrolls a zoomed capture. */
const smallChange = { height: 20, width: 13, x: 170, y: 160 };

type Capture = {
	fingerprint?: string;
	id: string;
	images: Partial<Record<'actual' | 'diff' | 'expected', Drawing>>;
	status: 'added' | 'changed' | 'removed';
};

const CAPTURES: ReadonlyArray<Capture> = [
	{
		fingerprint: '1'.repeat(64),
		id: 'button/primary',
		images: {
			actual: page([
				button,
				ink(smallChange.x, smallChange.y, smallChange.width, smallChange.height),
			]),
			diff: diff([smallChange]),
			expected: page([button]),
		},
		status: 'changed',
	},
	{
		// Actual is wider than Expected, and every pixel differs, so nothing is outlined.
		id: 'button/secondary',
		images: {
			actual: page([ink(72, 20, 125, 40)], 640),
			diff: diff([{ height: 300, width: 640, x: 0, y: 0 }], 640),
			expected: page([button]),
		},
		status: 'changed',
	},
	...(['paper-dark', 'paper-light'] as const).map((theme) => ({
		fingerprint: '2'.repeat(64),
		id: `checkbox/states-${theme}`,
		images: {
			actual: page([ink(20, 20, 20, 20), ink(96, 190, 13, 20)]),
			diff: diff([{ height: 20, width: 13, x: 96, y: 190 }]),
			expected: page([ink(20, 20, 20, 20)]),
		},
		status: 'changed' as const,
	})),
	{ id: 'text/added-case', images: { actual: page([ink(20, 20, 80, 10)]) }, status: 'added' },
	{ id: 'text/removed-case', images: { expected: page([ink(20, 20, 80, 10)]) }, status: 'removed' },
];

/** Every file in the report by its path under the report route, such as `/summary.json`. */
export function fixtureReportFiles(): Map<string, Buffer> {
	const files = new Map<string, Buffer>();
	for (const capture of CAPTURES) {
		for (const [kind, drawing] of Object.entries(capture.images)) {
			files.set(`/diff/${capture.id}.${kind}.png`, encodePng(drawing));
		}
	}
	files.set('/summary.json', Buffer.from(JSON.stringify(summary())));
	return files;
}

function summary() {
	const results = CAPTURES.map(({ fingerprint, id, images, status }) => {
		const { actual, diff: difference, expected } = images;
		const result: Record<string, number | string> = { id, status };
		if (fingerprint) result.fingerprint = fingerprint;
		if (actual) result.actualViewport = VIEWPORT;
		if (expected) result.expectedViewport = VIEWPORT;
		const size = actual ?? expected;
		if (status === 'changed' && size && difference) {
			result.height = size.height;
			result.mismatchedPixels = countDiffPixels(difference);
			result.width = size.width;
		}
		return result;
	});
	return { counts: { added: 1, changed: 4, removed: 1, unchanged: 5 }, results };
}

function countDiffPixels(drawing: Drawing) {
	return drawing.rects.reduce((total, rect) => total + rect.width * rect.height, 0);
}

/** An 8-bit RGBA PNG of the drawing. Later rectangles paint over earlier ones. */
function encodePng({ background, height, rects, width }: Drawing): Buffer {
	const stride = width * 4 + 1;
	// Each row starts with its filter type, which stays 0 for none.
	const pixels = Buffer.alloc(stride * height);
	const paint = ({ color, height: h, width: w, x: left, y: top }: Rect) => {
		for (let y = top; y < top + h; y++) {
			for (let x = left; x < left + w; x++) pixels.set([...color, 255], y * stride + 1 + x * 4);
		}
	};
	paint({ color: background, height, width, x: 0, y: 0 });
	for (const rect of rects) paint(rect);
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	// Bit depth 8, colour type 6 (RGBA), then default compression, filter, and no interlace.
	header.set([8, 6, 0, 0, 0], 8);
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(pixels)),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

function chunk(type: string, data: Buffer): Buffer {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const checksum = Buffer.alloc(4);
	checksum.writeUInt32BE(crc32(typeAndData));
	return Buffer.concat([length, typeAndData, checksum]);
}
