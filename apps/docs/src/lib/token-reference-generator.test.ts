import { expect, test } from 'vite-plus/test';
import { generateTokenReference } from '../../scripts/generate-token-reference.js';
import {
	themeTokenFamilyDescriptions,
	themeTokens,
} from '../generated/token-reference.generated.js';

test('generates one runtime entry per public contract leaf', () => {
	const reference = generateTokenReference();

	expect(reference).toContain(
		"{ family: 'color', path: 'color.surface.canvas', variable: '--luke-color-surface-canvas' },",
	);
	expect(reference).toContain(
		"{ family: 'motion', path: 'motion.easing.exit', variable: '--luke-motion-easing-exit' },",
	);
	expect(reference).toContain('export const themeTokens: ReadonlyArray<ThemeToken> = [');
	expect(reference).not.toContain('MapLeafNodes');
});

test('declares the family union the token entries are keyed by', () => {
	const reference = generateTokenReference();

	expect(reference).toContain('export type ThemeTokenFamily =');
	for (const family of new Set(themeTokens.map((token) => token.family))) {
		expect(reference).toContain(`| '${family}'`);
	}
});

test('carries the contract summary of every family as one line', () => {
	const reference = generateTokenReference();

	expect(reference).toContain(
		'Semantic colours for surfaces, content, borders, and loading, plus the six shared semantic roles',
	);
	for (const [family, description] of Object.entries(themeTokenFamilyDescriptions)) {
		expect(description, `${family} has no contract summary`).not.toBe('');
		expect(description, `${family} summary spans several lines`).not.toContain('\n');
	}
});

test('emits the generated file on disk that the docs app imports', () => {
	const emitted = generateTokenReference();

	for (const token of themeTokens) {
		expect(emitted).toContain(`path: '${token.path}'`);
	}
	expect(themeTokens.length).toBe(emitted.match(/\bvariable: '--luke-/g)?.length);
});
