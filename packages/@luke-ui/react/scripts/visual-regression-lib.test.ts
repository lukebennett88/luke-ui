import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { expect, test } from 'vite-plus/test';
import { assertCapturesPainted, compareCaptures, renderReport } from './visual-regression-lib.js';

const png = (red: number) => {
	const image = new PNG({ height: 1, width: 1 });
	image.data.set([red, 0, 0, 255]);
	return PNG.sync.write(image);
};

/** Builds a `width` x `height` white PNG with a black pixel at each `[x, y]` in `dots`. */
const pngWithDots = (width: number, height: number, dots: Array<[number, number]>) => {
	const image = new PNG({ width, height });
	image.data.fill(255);
	for (const [x, y] of dots) {
		image.data.set([0, 0, 0, 255], (y * width + x) * 4);
	}
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
	const image = new PNG({ width, height });
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

test('classifies matched, changed, added, and removed captures', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-regression-'));
	const base = path.join(root, 'base');
	const current = path.join(root, 'current');
	await Promise.all([base, current].map((directory) => mkdir(directory)));
	await Promise.all([
		writeFile(path.join(base, 'same.png'), png(0)),
		writeFile(path.join(current, 'same.png'), png(0)),
		writeFile(path.join(base, 'changed.png'), png(0)),
		writeFile(path.join(current, 'changed.png'), png(255)),
		writeFile(path.join(base, 'removed.png'), png(0)),
		writeFile(path.join(current, 'added.png'), png(0)),
	]);
	const results = await compareCaptures(base, current, path.join(root, 'diff'));
	expect(Object.fromEntries(results.map(({ id, status }) => [id, status]))).toEqual({
		added: 'added',
		changed: 'changed',
		removed: 'removed',
		same: 'unchanged',
	});
	const report = path.join(root, 'report.html');
	await renderReport(results, { base: 'abc', current: 'working tree', platform: 'test' }, report);
	expect(await readFile(report, 'utf8')).toContain('Visual regression report');
});

test('classifies a small, localized, high-contrast change on a large canvas as changed (#249, PR #312)', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-regression-icon-'));
	const base = path.join(root, 'base');
	const current = path.join(root, 'current');
	await Promise.all([base, current].map((directory) => mkdir(directory)));
	const width = 600;
	const height = 400;
	// 16 scattered pixels within a 16x16 bounding box on a 240,000px canvas -
	// the reported PR #312 shape (16 mismatched pixels on a 199,152px canvas,
	// concentrated in roughly a 16x16 region). The old ratio-of-canvas gate
	// (mismatchRatio > 0.001) reported this as "unchanged".
	const dots: Array<[number, number]> = Array.from({ length: 16 }, (_, i) => [100 + i, 100 + i]);
	await Promise.all([
		writeFile(path.join(base, 'icon.png'), pngWithDots(width, height, [])),
		writeFile(path.join(current, 'icon.png'), pngWithDots(width, height, dots)),
	]);
	const [result] = await compareCaptures(base, current, path.join(root, 'diff'));
	expect(result?.mismatchedPixels).toBe(16);
	// Confirms this is exactly the scenario the ratio-based gate missed: a
	// tiny fraction of a large canvas.
	expect(result?.mismatchRatio).toBeLessThan(0.001);
	expect(result?.mismatchBoundingBoxArea).toBe(256);
	expect(result?.status).toBe('changed');
});

test('no longer discards an anti-aliased thin-stroke change, but still filters a stroke-sized cluster as noise', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-regression-aa-'));
	const base = path.join(root, 'base');
	const current = path.join(root, 'current');
	await Promise.all([base, current].map((directory) => mkdir(directory)));
	const width = 40;
	const height = 40;
	await Promise.all([
		writeFile(path.join(base, 'stroke.png'), pngWithAAStroke(width, height, 20, true)),
		writeFile(path.join(current, 'stroke.png'), pngWithAAStroke(width, height, 20, false)),
	]);
	const [result] = await compareCaptures(base, current, path.join(root, 'diff'));
	// Under the old `includeAA: false` default, this stroke's blended
	// (anti-aliased-looking) edge columns are excluded, leaving only the
	// solid centre column - 20 of the 60 differing pixels. `includeAA: true`
	// now counts every one of them.
	expect(result?.mismatchedPixels).toBe(60);
	// The stroke's bounding box (3 x 20px = 60px²) is smaller than the
	// measured noise ceiling (88px², see MISMATCH_BBOX_AREA_THRESHOLD), so it
	// stays "unchanged" rather than flipping every anti-aliased pixel into a
	// false positive.
	expect(result?.mismatchBoundingBoxArea).toBe(60);
	expect(result?.status).toBe('unchanged');
});

test('classifies identical large captures as unchanged with the tightened comparator', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-regression-identical-'));
	const base = path.join(root, 'base');
	const current = path.join(root, 'current');
	await Promise.all([base, current].map((directory) => mkdir(directory)));
	const width = 600;
	const height = 400;
	const dots: Array<[number, number]> = Array.from({ length: 16 }, (_, i) => [100 + i, 100 + i]);
	await Promise.all([
		writeFile(path.join(base, 'icon.png'), pngWithDots(width, height, dots)),
		writeFile(path.join(current, 'icon.png'), pngWithDots(width, height, dots)),
	]);
	const [result] = await compareCaptures(base, current, path.join(root, 'diff'));
	expect(result?.mismatchedPixels).toBe(0);
	expect(result?.status).toBe('unchanged');
});

test('rejects a tall capture whose bottom decile never painted', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	await writeFile(
		path.join(root, 'tall__viewport-1024x800.png'),
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
	await writeFile(path.join(root, 'tall__viewport-1024x800.png'), PNG.sync.write(image));

	await expect(assertCapturesPainted(root)).resolves.toBeUndefined();
});

test('ignores a capture that fits its viewport even with a uniform bottom decile', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-painted-'));
	await writeFile(
		path.join(root, 'fits__viewport-1024x800.png'),
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
