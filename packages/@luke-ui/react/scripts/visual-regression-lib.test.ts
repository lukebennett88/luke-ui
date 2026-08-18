import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { expect, test } from 'vite-plus/test';
import {
	formatVisualCaptureName,
	formatVisualViewport,
} from '../src/test-utils/visual-capture-id.js';
import { assertCapturesPainted, compareCaptures, renderReport } from './visual-regression-lib.js';

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

test('records the full viewport token produced by the capture-name helper', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-viewport-'));
	const base = path.join(root, 'base');
	const current = path.join(root, 'current');
	await Promise.all([base, current].map((directory) => mkdir(directory)));
	const captureName = formatVisualCaptureName('button/sink', formatVisualViewport(1024, 800));
	const relativeFile = `${captureName}.png`;
	await Promise.all(
		[base, current].map((directory) =>
			mkdir(path.join(directory, path.dirname(relativeFile)), { recursive: true }),
		),
	);
	await Promise.all([
		writeFile(path.join(base, relativeFile), png(0)),
		writeFile(path.join(current, relativeFile), png(0)),
	]);
	const [result] = await compareCaptures(base, current, path.join(root, 'diff'));
	expect(result).toMatchObject({
		baseViewport: '1024x800',
		currentViewport: '1024x800',
		id: 'button/sink',
		status: 'unchanged',
	});
});

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

test('counts anti-aliased pixels and flags a removed thin stroke as a change', async () => {
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
	// `includeAA: true` counts the blended edge columns too, not just the solid centre.
	expect(result?.mismatchedPixels).toBe(60);
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
