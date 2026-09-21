import { expect, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

const withRef: ButtonProps = { ref: null };

// @ts-expect-error — text Buttons do not use control sizing
const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
// @ts-expect-error — text Buttons do not use block layout
const textButtonBlock: ButtonProps = { appearance: 'text', isBlock: true };
// @ts-expect-error — critical text Buttons do not have high prominence
const criticalHighText: ButtonProps = {
	appearance: 'text',
	tone: 'critical',
	prominence: 'high',
};

test('primitive Button supports ref and rejects unsupported prop combinations', () => {
	expect([withRef, textButtonSize, textButtonBlock, criticalHighText]).toHaveLength(4);
});
