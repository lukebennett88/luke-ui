import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { spinnerOverlay } from '../button/styles.js';
import { loadingSpinnerRecipe } from '../loading-spinner/recipe.js';
import { spinnerOverlayBase } from './spinner-overlay.js';

/**
 * `Button` and `LoadingSpinner` render the same absolutely positioned, centred pending surface.
 * A compiled `stylex.create` style is the only thing that crosses a module boundary intact — it
 * cannot be spread into another `stylex.create` call ("Could not resolve the path to the imported
 * file"), so it is composed at the recipe instead. These tests pin that composition.
 */

const baseClasses = new Set(stylex.props(spinnerOverlayBase).className?.split(' ') ?? []);

test('the shared overlay base compiles to at least one class', () => {
	expect(baseClasses.size).toBeGreaterThan(0);
});

test('LoadingSpinner uses the shared base verbatim', () => {
	const slotClasses = loadingSpinnerRecipe().spinnerOverlay().split(' ');
	expect(new Set(slotClasses)).toEqual(baseClasses);
});

test('Button layers its forced-colors rule on top of the same base', () => {
	const buttonClasses = spinnerOverlay().split(' ');

	// Every base class survives, so the two components position their spinner identically…
	for (const baseClass of baseClasses) {
		expect(buttonClasses).toContain(baseClass);
	}
	// …and Button contributes exactly one class of its own for the forced-colors override.
	expect(buttonClasses.filter((name) => !baseClasses.has(name))).toHaveLength(1);
});
