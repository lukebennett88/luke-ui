import { tmpdir } from 'node:os';
import path from 'node:path';
import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { expect, test } from 'vite-plus/test';
import {
	formatVisualCaptureName,
	formatVisualViewport,
} from '../src/core/test-utils/visual-capture-id.js';
import { assertCapturesPainted, compareCaptures, countResults } from './visual-regression-lib.js';

const png = (red: number) => {
	const image = new PNG({ height: 1, width: 1 });
	image.data.set([red, 0, 0, 255]);
	return PNG.sync.write(image);
};

/**
 * Builds a `width` x `height` white PNG. When `withStroke`, adds a
 * `height - 20`px-tall, 3px-wide vertical stroke centred at `x` with
 * anti-aliased (blended grey, not solid black) edges - the shape of a thin
 * icon stroke, and of the kind of edge pixelmatch's `includeAA: false`
 * default discards as anti-aliasing rather than counting as a mismatch.
 */
const pngWithAAStroke = (width: number, height: number, x: number, withStroke: boolean) => {
	const image = new PNG({ height, width });
	image.data.fill(255);
	if (withStroke) {
		for (let y = 10; y < height - 10; y++) {
			for (const [offset, value] of [
				[-1, 220],
				[0, 180],
				[1, 220],
			] as const) {
				image.data.set([value, value, value, 255], (y * width + (x + offset)) * 4);
			}
		}
	}
	return PNG.sync.write(image);
};

/** Builds a `width` x `height` PNG whose bottom decile is `bandColor` and everything above it is `fillColor`. */
const pngWithBand = (
	width: number,
	height: number,
	fillColor: [number, number, number, number],
	bandColor: [number, number, number, number],
) => {
	const image = new PNG({ height, width });
	const bandHeight = Math.max(1, Math.round(height / 10));
	const bandStart = height - bandHeight;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;
			const color = y >= bandStart ? bandColor : fillColor;
			image.data.set(color, index);
		}
	}
	return PNG.sync.write(image);
};

async function captureDirs(prefix: string) {
	const root = await mkdtemp(path.join(tmpdir(), prefix));
	const expected = path.join(root, 'expected');
	const actual = path.join(root, 'actual');
	await Promise.all([expected, actual].map((directory) => mkdir(directory)));
	return { actual, expected, output: path.join(root, 'output') };
}

test('records the full viewport token produced by the capture-name helper', async () => {
	const { actual, expected, output } = await captureDirs('visual-viewport-');
	const relativeFile = `${formatVisualCaptureName('button/sink', formatVisualViewport(1024, 800))}.png`;
	await Promise.all(
		[expected, actual].map((directory) =>
			mkdir(path.join(directory, path.dirname(relativeFile)), { recursive: true }),
		),
	);
	await Promise.all([
		writeFile(path.join(expected, relativeFile), png(0)),
		writeFile(path.join(actual, relativeFile), png(0)),
	]);

	const [result] = await compareCaptures(expected, actual, output);

	expect(result).toMatchObject({
		actualViewport: '1024x800',
		expectedViewport: '1024x800',
		id: 'button/sink',
		status: 'unchanged',
	});
});

test('classifies matched, changed, added, and removed captures', async () => {
	const { actual, expected, output } = await captureDirs('visual-regression-');
	await Promise.all([
		writeFile(path.join(expected, 'same.png'), png(0)),
		writeFile(path.join(actual, 'same.png'), png(0)),
		writeFile(path.join(expected, 'changed.png'), png(0)),
		writeFile(path.join(actual, 'changed.png'), png(255)),
		writeFile(path.join(expected, 'removed.png'), png(0)),
		writeFile(path.join(actual, 'added.png'), png(0)),
	]);

	const results = await compareCaptures(expected, actual, output);

	expect(Object.fromEntries(results.map(({ id, status }) => [id, status]))).toEqual({
		added: 'added',
		changed: 'changed',
		removed: 'removed',
		same: 'unchanged',
	});
	expect(countResults(results)).toEqual({ added: 1, changed: 1, removed: 1, unchanged: 1 });
});

test('writes expected, actual, and diff PNGs for everything needing review', async () => {
	const { actual, expected, output } = await captureDirs('visual-outputs-');
	await Promise.all([
		writeFile(path.join(expected, 'same.png'), png(0)),
		writeFile(path.join(actual, 'same.png'), png(0)),
		writeFile(path.join(expected, 'changed.png'), png(0)),
		writeFile(path.join(actual, 'changed.png'), png(255)),
		writeFile(path.join(expected, 'removed.png'), png(0)),
		writeFile(path.join(actual, 'added.png'), png(0)),
	]);

	await compareCaptures(expected, actual, output);

	await expect(access(path.join(output, 'changed.expected.png'))).resolves.toBeUndefined();
	await expect(access(path.join(output, 'changed.actual.png'))).resolves.toBeUndefined();
	await expect(access(path.join(output, 'changed.diff.png'))).resolves.toBeUndefined();
	await expect(access(path.join(output, 'added.actual.png'))).resolves.toBeUndefined();
	await expect(access(path.join(output, 'removed.expected.png'))).resolves.toBeUndefined();
	// An unchanged capture needs no review, so it publishes nothing.
	await expect(access(path.join(output, 'same.actual.png'))).rejects.toThrow(/ENOENT/);
});

test('counts anti-aliased pixels and flags a removed thin stroke as a change', async () => {
	const { actual, expected, output } = await captureDirs('visual-regression-aa-');
	const width = 40;
	const height = 40;
	await Promise.all([
		writeFile(path.join(expected, 'stroke.png'), pngWithAAStroke(width, height, 20, true)),
		writeFile(path.join(actual, 'stroke.png'), pngWithAAStroke(width, height, 20, false)),
	]);

	const [result] = await compareCaptures(expected, actual, output);

	// `includeAA: true` counts the blended edge columns too, not just the solid centre.
	expect(result?.mismatchedPixels).toBe(60);
	expect(result?.status).toBe('changed');
});

test('reports a 16px icon on a large canvas as changed (#312)', async () => {
	// The defect: a visible icon-sized change scored 0.008% of the canvas, under
	// the old 0.1% mismatch-ratio gate, and was reported unchanged. There is no
	// canvas-wide ratio allowance any more, so any mismatched pixel counts.
	const { actual, expected, output } = await captureDirs('visual-regression-icon-');
	const width = 1024;
	const height = 800;
	const withIcon = new PNG({ height, width });
	withIcon.data.fill(255);
	for (let y = 0; y < 16; y++) {
		for (let x = 0; x < 16; x++) {
			withIcon.data.set([17, 17, 17, 255], ((y + 40) * width + (x + 40)) * 4);
		}
	}
	const blank = new PNG({ height, width });
	blank.data.fill(255);
	await Promise.all([
		writeFile(path.join(expected, 'icon.png'), PNG.sync.write(withIcon)),
		writeFile(path.join(actual, 'icon.png'), PNG.sync.write(blank)),
	]);

	const [result] = await compareCaptures(expected, actual, output);

	expect(result?.mismatchedPixels).toBe(256);
	// 256 / (1024 * 800) is 0.03%, well under the deleted 0.1% allowance.
	expect(result?.status).toBe('changed');
});

test('reports a single changed pixel as changed', async () => {
	const { actual, expected, output } = await captureDirs('visual-regression-pixel-');
	const width = 200;
	const height = 200;
	const blank = new PNG({ height, width });
	blank.data.fill(255);
	const speck = new PNG({ height, width });
	speck.data.fill(255);
	speck.data.set([0, 0, 0, 255], (100 * width + 100) * 4);
	await Promise.all([
		writeFile(path.join(expected, 'speck.png'), PNG.sync.write(blank)),
		writeFile(path.join(actual, 'speck.png'), PNG.sync.write(speck)),
	]);

	const [result] = await compareCaptures(expected, actual, output);

	expect(result?.mismatchedPixels).toBe(1);
	expect(result?.status).toBe('changed');
});

test('rejects a tall capture whose bottom decile never painted', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	const captureName = formatVisualCaptureName('tall', formatVisualViewport(1024, 800));
	await writeFile(
		path.join(root, `${captureName}.png`),
		pngWithBand(1024, 900, [0, 0, 0, 255], [10, 10, 10, 255]),
	);

	await expect(assertCapturesPainted(root)).rejects.toThrow(/#310.*tall \(1024x900\)/s);
});

test('accepts a tall capture whose bottom decile painted', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	const width = 1024;
	const height = 900;
	const image = new PNG({ height, width });
	const bandHeight = Math.max(1, Math.round(height / 10));
	const bandStart = height - bandHeight;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;
			// Vary the band by column so it is not a single uniform colour.
			const color: [number, number, number, number] =
				y >= bandStart && x % 2 === 0 ? [200, 200, 200, 255] : [0, 0, 0, 255];
			image.data.set(color, index);
		}
	}
	await writeFile(
		path.join(root, `${formatVisualCaptureName('tall', formatVisualViewport(1024, 800))}.png`),
		PNG.sync.write(image),
	);

	await expect(assertCapturesPainted(root)).resolves.toBeUndefined();
});

test('ignores a capture that fits its viewport even with a uniform bottom decile', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	await writeFile(
		path.join(root, `${formatVisualCaptureName('fits', formatVisualViewport(1024, 800))}.png`),
		pngWithBand(1024, 720, [0, 0, 0, 255], [0, 0, 0, 255]),
	);

	await expect(assertCapturesPainted(root)).resolves.toBeUndefined();
});

test('ignores a capture with no recorded viewport', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	await writeFile(
		path.join(root, 'legacy.png'),
		pngWithBand(4, 40, [0, 0, 0, 255], [0, 0, 0, 255]),
	);

	await expect(assertCapturesPainted(root)).resolves.toBeUndefined();
});
