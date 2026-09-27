import { describe, expect, test } from 'vite-plus/test';
import { decodeCodeHash, encodeCodeHash } from './hash.js';

describe('playground hash helpers', () => {
	test('round-trips code through the serialized hash', () => {
		const code = 'const demo = 1;';
		const hash = encodeCodeHash(code);

		expect(decodeCodeHash(hash)).toBe(code);
		expect(decodeCodeHash(`#${hash}`)).toBe(code);
	});

	test('writes code first, then extra params in insertion order', () => {
		const hash = encodeCodeHash('const demo = 1;', { zeta: 'z,1', alpha: 'a' });

		expect([...new URLSearchParams(hash).keys()]).toEqual(['code', 'zeta', 'alpha']);
		expect(hash).toContain('zeta=z%2C1');
		expect(decodeCodeHash(hash)).toBe('const demo = 1;');
	});

	test('rejects an extra param that would replace the code', () => {
		expect(() => encodeCodeHash('const demo = 1;', { code: 'other' })).toThrow(/reserved/);
	});
});
