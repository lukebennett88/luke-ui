import { expect, test } from 'vite-plus/test';
import { encodeShape, toSkeletonLines } from './playground-editor-shape.js';

test('measures indent with tabs expanded to the editor tab size', () => {
	expect(toSkeletonLines('if (a) {\n\treturn b;  \n\n}')).toEqual([
		{ indent: 0, length: 8 },
		{ indent: 2, length: 9 },
		{ indent: 0, length: 0 },
		{ indent: 0, length: 1 },
	]);
});

test('caps the skeleton at 60 rows', () => {
	expect(toSkeletonLines('x\n'.repeat(100))).toHaveLength(60);
});

test('encodes each line as an indent.length pair', () => {
	expect(encodeShape('a\n\tbc\n')).toBe('0.1,2.2,0.0');
});
