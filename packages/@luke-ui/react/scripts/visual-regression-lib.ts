import path from 'node:path';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { parseVisualCaptureIdentity } from '../src/core/test-utils/visual-capture-id.js';

export type VisualStatus = 'added' | 'changed' | 'removed' | 'unchanged';

export type VisualResult = {
	id: string;
	status: VisualStatus;
	expected?: string;
	actual?: string;
	diff?: string;
	mismatchedPixels?: number;
	height?: number;
	width?: number;
	expectedViewport?: string;
	actualViewport?: string;
};

export type VisualCounts = Record<VisualStatus, number>;

type CaptureFile = { file: string; viewport?: string };

async function listPngs(root: string) {
	const result = new Map<string, CaptureFile>();
	await walkPngs(root, (file, captureName) => {
		const identity = parseVisualCaptureIdentity(captureName);
		const id = identity?.id ?? captureName;
		if (result.has(id)) throw new Error(`Duplicate visual capture ID: ${id}`);
		result.set(id, { file, viewport: identity?.viewport });
	});
	return result;
}

/** Walks `root` for `.png` files, calling `visitor` with each file's path and its capture name (the path relative to `root`, without the extension). */
async function walkPngs(root: string, visitor: (file: string, captureName: string) => void) {
	async function visit(directory: string) {
		await Promise.all(
			(await readdir(directory, { withFileTypes: true }).catch(() => [])).map(async (entry) => {
				const file = path.join(directory, entry.name);
				if (entry.isDirectory()) await visit(file);
				else if (entry.name.endsWith('.png')) {
					const captureName = path
						.relative(root, file)
						.replace(/\.png$/, '')
						.split(path.sep)
						.join('/');
					visitor(file, captureName);
				}
			}),
		);
	}
	await visit(root);
}

/**
 * Fails captures taller than their recorded viewport whose bottom decile is a
 * single uniform colour, meaning the scene grew but that region never
 * painted. See #310 for why `captureVisual` has to grow both the page and the
 * test iframe for a tall scene to paint in full.
 */
export async function assertCapturesPainted(directory: string) {
	const viewportCaptures: Array<{ file: string; id: string; viewportHeight: number }> = [];
	await walkPngs(directory, (file, captureName) => {
		const identity = parseVisualCaptureIdentity(captureName);
		if (identity === undefined) return;
		viewportCaptures.push({
			file,
			id: identity.id,
			viewportHeight: identity.viewportHeight,
		});
	});

	const offenders: Array<string> = [];
	await Promise.all(
		viewportCaptures.map(async ({ file, id, viewportHeight }) => {
			const png = PNG.sync.read(await readFile(file));
			if (png.height <= viewportHeight) return;
			if (isBottomBandUniform(png)) {
				offenders.push(`${id} (${png.width}x${png.height})`);
			}
		}),
	);

	if (offenders.length > 0) {
		offenders.sort();
		throw new Error(
			`Visual captures painted only part of their height (see #310): ${offenders.join(', ')}`,
		);
	}
}

function isBottomBandUniform(png: PNG) {
	const bandHeight = Math.max(1, Math.round(png.height / 10));
	const firstRowStart = (png.height - bandHeight) * png.width * 4;
	const [r, g, b, a] = png.data.subarray(firstRowStart, firstRowStart + 4);
	for (let index = firstRowStart; index < png.data.length; index += 4) {
		if (
			png.data[index] !== r ||
			png.data[index + 1] !== g ||
			png.data[index + 2] !== b ||
			png.data[index + 3] !== a
		) {
			return false;
		}
	}
	return true;
}

/**
 * Compares the baseline captures in `expectedDir` with the freshly rendered
 * captures in `actualDir`, writing `expected`, `actual`, and `diff` PNGs for
 * everything that is not unchanged into `outputDir`.
 *
 * There is no canvas-wide mismatch allowance: any pixel pixelmatch counts as
 * different makes the capture `changed`. The only tolerance is pixelmatch's own
 * per-pixel colour `threshold`. `includeAA: true` keeps anti-aliased edges in
 * the count rather than discarding them, so a thin icon stroke on a large
 * canvas still registers (see #312).
 */
export async function compareCaptures(expectedDir: string, actualDir: string, outputDir: string) {
	const [expected, actual] = await Promise.all([listPngs(expectedDir), listPngs(actualDir)]);
	const ids = [...new Set([...expected.keys(), ...actual.keys()])].sort();
	const results = await Promise.all(
		ids.map((id) => compareCapture(id, expected.get(id), actual.get(id), outputDir)),
	);
	return results;
}

async function compareCapture(
	id: string,
	expectedCapture: CaptureFile | undefined,
	actualCapture: CaptureFile | undefined,
	outputDir: string,
): Promise<VisualResult> {
	if (!expectedCapture) {
		return {
			actual: await publish(outputDir, id, 'actual', actualCapture?.file),
			actualViewport: actualCapture?.viewport,
			id,
			status: 'added',
		};
	}
	if (!actualCapture) {
		return {
			expected: await publish(outputDir, id, 'expected', expectedCapture.file),
			expectedViewport: expectedCapture.viewport,
			id,
			status: 'removed',
		};
	}

	const [expectedPng, actualPng] = await Promise.all([
		readPng(expectedCapture.file),
		readPng(actualCapture.file),
	]);
	const width = Math.max(expectedPng.width, actualPng.width);
	const height = Math.max(expectedPng.height, actualPng.height);
	const diffPng = new PNG({ height, width });
	let mismatchedPixels: number;
	if (expectedPng.width !== actualPng.width || expectedPng.height !== actualPng.height) {
		mismatchedPixels = width * height;
		for (let index = 0; index < diffPng.data.length; index += 4) {
			diffPng.data.set([255, 0, 0, 255], index);
		}
	} else {
		mismatchedPixels = pixelmatch(expectedPng.data, actualPng.data, diffPng.data, width, height, {
			includeAA: true,
			threshold: 0.1,
		});
	}
	const status: VisualStatus =
		mismatchedPixels > 0 || expectedCapture.viewport !== actualCapture.viewport
			? 'changed'
			: 'unchanged';

	const result: VisualResult = {
		actualViewport: actualCapture.viewport,
		expectedViewport: expectedCapture.viewport,
		height,
		id,
		mismatchedPixels,
		status,
		width,
	};
	if (status === 'unchanged') return result;

	const [expectedOut, actualOut, diffOut] = await Promise.all([
		publish(outputDir, id, 'expected', expectedCapture.file),
		publish(outputDir, id, 'actual', actualCapture.file),
		writePng(outputDir, id, 'diff', diffPng),
	]);
	return { ...result, actual: actualOut, diff: diffOut, expected: expectedOut };
}

async function readPng(file: string) {
	return PNG.sync.read(await readFile(file));
}

function outputPath(outputDir: string, id: string, kind: string) {
	return path.join(outputDir, `${id}.${kind}.png`);
}

async function publish(outputDir: string, id: string, kind: string, source?: string) {
	if (source === undefined) return undefined;
	const destination = outputPath(outputDir, id, kind);
	await mkdir(path.dirname(destination), { recursive: true });
	await copyFile(source, destination);
	return destination;
}

async function writePng(outputDir: string, id: string, kind: string, png: PNG) {
	const destination = outputPath(outputDir, id, kind);
	await mkdir(path.dirname(destination), { recursive: true });
	await writeFile(destination, PNG.sync.write(png));
	return destination;
}

export function countResults(results: Array<VisualResult>): VisualCounts {
	const counts: VisualCounts = { added: 0, changed: 0, removed: 0, unchanged: 0 };
	for (const result of results) counts[result.status] += 1;
	return counts;
}
