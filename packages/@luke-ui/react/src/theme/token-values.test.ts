import { describe, expect, it } from 'vite-plus/test';
import { literalScale } from './literal-scale.js';
import { CONTROL_SIZE_VALUES } from './token-values.js';

describe('CONTROL_SIZE_VALUES', () => {
	it('derives controlSize paths from literalScale', () => {
		const scale = literalScale('', [32, 40] as const);

		expect(CONTROL_SIZE_VALUES).toEqual({
			'controlSize.32': scale['32'],
			'controlSize.40': scale['40'],
		});
	});

	it('preserves the control dimensions', () => {
		expect(CONTROL_SIZE_VALUES['controlSize.32']).toBe('2rem');
		expect(CONTROL_SIZE_VALUES['controlSize.40']).toBe('2.5rem');
	});
});
