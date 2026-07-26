/**
 * Test-only helpers for reading a compiled theme stylesheet: the bundled foundations the engine tests
 * compile, plus the two readers every theme test needs — one to split the emitted CSS into its rule
 * blocks, one to pull a declaration's value out of a block.
 *
 * NOT imported by production code. The bundled themes are authored as `defineTheme` inputs, so each is
 * resolved here into the `ThemeFoundation` the `buildTheme` pipeline consumes.
 */

import { normalizeTheme } from '../theme/define-theme.js';
import { paperTheme, tactileTheme } from '../theme/foundations.js';

/** The bundled Tactile theme, resolved into the foundation `buildTheme` consumes. */
export const tactileFoundation = normalizeTheme(tactileTheme);

/** The bundled Paper theme, resolved into the foundation `buildTheme` consumes. */
export const paperFoundation = normalizeTheme(paperTheme);

/**
 * Splits the generated stylesheet into its five rule blocks: identity, base light, media-query
 * dark, explicit light, and explicit dark.
 */
export function splitBlocks(css: string) {
	const blocks = css.split('\n\n').filter((block) => block.trim() !== '');
	if (blocks.length !== 5) throw new Error(`expected 5 rule blocks, found ${blocks.length}`);
	const [identity, baseLight, mediaDark, explicitLight, explicitDark] = blocks;
	if (
		identity === undefined ||
		baseLight === undefined ||
		mediaDark === undefined ||
		explicitLight === undefined ||
		explicitDark === undefined
	) {
		throw new Error('expected every generated theme rule block to be defined');
	}
	return { baseLight, explicitDark, explicitLight, identity, mediaDark };
}

/** Reads one custom property's value out of a single rule block. */
export function extractValue(block: string, varName: string): string {
	const match = new RegExp(`${varName}: ([^;]+);`).exec(block);
	if (match === null || match[1] === undefined) {
		throw new Error(`missing ${varName} in block`);
	}
	return match[1];
}
