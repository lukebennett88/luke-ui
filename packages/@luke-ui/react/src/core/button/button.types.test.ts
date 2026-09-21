import { expect, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

const withRef: ButtonProps = { ref: null };

// @ts-expect-error — text Buttons wrap and do not use control sizing
const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
// @ts-expect-error — accent is not a consumer-selectable tone
const accentLowButton: ButtonProps = { tone: 'accent', prominence: 'low' };
// @ts-expect-error — critical text Buttons do not have high prominence
const criticalHighText: ButtonProps = {
	appearance: 'text',
	tone: 'critical',
	prominence: 'high',
};

test('Button supports ref and rejects unsupported prop combinations', () => {
	expect([withRef, textButtonSize, accentLowButton, criticalHighText]).toHaveLength(4);
});
