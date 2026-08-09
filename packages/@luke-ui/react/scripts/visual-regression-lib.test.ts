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
