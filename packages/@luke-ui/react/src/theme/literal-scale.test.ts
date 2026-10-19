import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { literalScale } from './literal-scale.js';
import { rem } from './rem.js';

describe('literalScale', () => {
	it('derives px keys and rem values from the same numbers', () => {
		const scale = literalScale('px', [16, 20, 24, 32] as const);

		expect(scale).toEqual({
			px16: rem(16),
			px20: rem(20),
			px24: rem(24),
			px32: rem(32),
		});
		expect(Object.keys(scale)).toEqual(['px16', 'px20', 'px24', 'px32']);
	});

	it('keeps key unions tied to the numeric steps', () => {
		const scale = literalScale('px', [32, 40] as const);

		expectTypeOf(scale).toEqualTypeOf<{
			readonly px32: `${string}rem`;
			readonly px40: `${string}rem`;
		}>();
		expectTypeOf<keyof typeof scale>().toEqualTypeOf<'px32' | 'px40'>();
	});

	it('accepts another prefix so spacing can reuse the same helper', () => {
		const scale = literalScale('space.', [4, 8] as const);

		expect(scale).toEqual({
			'space.4': rem(4),
			'space.8': rem(8),
		});
		expectTypeOf(scale).toEqualTypeOf<{
			readonly 'space.4': `${string}rem`;
			readonly 'space.8': `${string}rem`;
		}>();
	});
});

it('derives bare spacing variable keys and exact reference values together', () => {
	const scale = literalScale('', [4, 16, 96] as const);
	expect(scale).toEqual({ '4': '0.25rem', '16': '1rem', '96': '6rem' });
	expectTypeOf<keyof typeof scale>().toEqualTypeOf<'4' | '16' | '96'>();
});
