import { expect, test } from 'vite-plus/test';
import { vars } from '../../theme/contract.css.js';
import { isSpaceToken, spaceTokens } from './space-tokens.js';

const expectedTokens = {
	'space.4': vars.space['4'],
	'space.8': vars.space['8'],
	'space.12': vars.space['12'],
	'space.16': vars.space['16'],
	'space.24': vars.space['24'],
	'space.32': vars.space['32'],
	'space.40': vars.space['40'],
	'space.48': vars.space['48'],
	'space.64': vars.space['64'],
	'space.96': vars.space['96'],
};

test('maps every curated public spacing token to its matching variable', () => {
	expect(spaceTokens).toEqual(expectedTokens);
});

test('recognises every supported spacing token', () => {
	for (const token of Object.keys(expectedTokens)) {
		expect(isSpaceToken(token)).toBe(true);
	}
});

for (const value of [
	'0',
	0,
	'space.0',
	'space.20',
	'sp16',
	'16',
	16,
	'1rem',
	'constructor',
	'toString',
	'__proto__',
]) {
	test(`rejects unsupported spacing token ${JSON.stringify(value)}`, () => {
		expect(isSpaceToken(value)).toBe(false);
	});
}
