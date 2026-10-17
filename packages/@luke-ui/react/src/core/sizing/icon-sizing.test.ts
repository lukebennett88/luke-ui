import { describe, expect, it } from 'vite-plus/test';
import { literalScale } from '../../theme/literal-scale.js';
import { ICON_SIZES } from './icon-sizing.js';

describe('ICON_SIZES', () => {
	it('matches literalScale so keys cannot drift from rem values', () => {
		expect(ICON_SIZES).toEqual(literalScale('px', [16, 20, 24, 32] as const));
	});
});
