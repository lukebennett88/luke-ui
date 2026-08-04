import { describe, expect, test } from 'vite-plus/test';
import { decodeCodeHash, encodeCodeHash } from './playground-hash.js';

describe('playground hash helpers', () => {
	test('round-trips code through the serialized hash', () => {
		const code = 'const demo = 1;';
		const hash = encodeCodeHash(code);

		expect(decodeCodeHash(hash)).toBe(code);
		expect(decodeCodeHash(`#${hash}`)).toBe(code);
	});
});
