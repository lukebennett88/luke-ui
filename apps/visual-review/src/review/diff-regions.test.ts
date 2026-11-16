import { expect, test } from 'vite-plus/test';
import { findDiffRegions } from './diff-regions.js';

const WIDTH = 100;
const HEIGHT = 100;

/** A diff image as the comparison paints it: faded grey, with pure red on each differing pixel. */
function diffImage(differing: Array<[x: number, y: number]>) {
	const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4).fill(230);
	for (const [x, y] of differing) data.set([255, 0, 0, 255], (y * WIDTH + x) * 4);
	return data;
}

test('finds no regions in an image without differences', () => {
	expect(findDiffRegions(diffImage([]), WIDTH, HEIGHT)).toEqual([]);
});

test('bounds nearby differing rows in one padded region', () => {
	const regions = findDiffRegions(
		diffImage([
			[20, 30],
			[40, 34],
			[30, 44],
		]),
		WIDTH,
		HEIGHT,
	);

	expect(regions).toEqual([{ height: 27, width: 33, x: 14, y: 24 }]);
});

test('separates differences that are many rows apart', () => {
	const regions = findDiffRegions(
		diffImage([
			[20, 20],
			[20, 80],
		]),
		WIDTH,
		HEIGHT,
	);

	expect(regions.map((region) => region.y)).toEqual([14, 74]);
});

test('keeps a region inside the image at its edges', () => {
	const regions = findDiffRegions(
		diffImage([
			[0, 0],
			[99, 99],
		]),
		WIDTH,
		HEIGHT,
	);

	expect(regions).toEqual([
		{ height: 7, width: 7, x: 0, y: 0 },
		{ height: 7, width: 7, x: 93, y: 93 },
	]);
});
