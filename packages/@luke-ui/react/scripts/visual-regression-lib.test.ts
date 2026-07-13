import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { expect, test } from 'vite-plus/test';
import { compareCaptures, renderReport, validateCaptureIds } from './visual-regression-lib.js';

const png = (red: number) => {
	const image = new PNG({ height: 1, width: 1 });
	image.data.set([red, 0, 0, 255]);
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

test('rejects duplicate explicit capture IDs', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-ids-'));
	await writeFile(path.join(root, 'one.visual.test.tsx'), "captureVisual(scene, 'button/default')");
	await writeFile(path.join(root, 'two.visual.test.tsx'), "captureVisual(scene, 'button/default')");
	await expect(validateCaptureIds(root)).rejects.toThrow(
		'Duplicate visual capture ID button/default',
	);
});

test('accepts multiline calls with trailing commas', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-ids-'));
	await writeFile(
		path.join(root, 'one.visual.test.tsx'),
		"captureVisual(\n\tpage.elementLocator(document.body),\n\t'button/multiline',\n)",
	);
	const owners = await validateCaptureIds(root);
	expect([...owners.keys()]).toEqual(['button/multiline']);
});

test('expands appearance capture IDs and rejects collisions with explicit captures', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-ids-'));
	await writeFile(
		path.join(root, 'matrix.visual.test.tsx'),
		"captureVisualAppearance(scene, 'button/tones', appearance)",
	);
	await writeFile(
		path.join(root, 'single.visual.test.tsx'),
		"captureVisual(scene, 'button/tones-elmo-dark')",
	);

	await expect(validateCaptureIds(root)).rejects.toThrow(
		'Duplicate visual capture ID button/tones-elmo-dark',
	);
});

test('registers every independently named appearance capture', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-ids-'));
	await writeFile(
		path.join(root, 'matrix.visual.test.tsx'),
		"captureVisualAppearance(scene, 'button/tones', appearance)",
	);

	const owners = await validateCaptureIds(root);

	expect([...owners.keys()]).toEqual([
		'button/tones-machined-edge-light',
		'button/tones-machined-edge-dark',
		'button/tones-elmo-light',
		'button/tones-elmo-dark',
	]);
});
