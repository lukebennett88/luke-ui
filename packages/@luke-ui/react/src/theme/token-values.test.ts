import { describe, expect, it } from 'vite-plus/test';
import { literalScale } from './literal-scale.js';
import { CONTROL_SIZE_VALUES } from './token-values.js';

describe('CONTROL_SIZE_VALUES', () => {
	it('derives controlSize paths from literalScale', () => {
		const scale = literalScale('px', [32, 40] as const);

		expect(CONTROL_SIZE_VALUES).toEqual({
			'controlSize.px32': scale.px32,
			'controlSize.px40': scale.px40,
		});
	});
});
