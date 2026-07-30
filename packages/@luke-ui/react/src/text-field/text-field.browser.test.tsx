import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { TextField } from './index.js';

afterEach(() => {
	cleanupVisual();
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional — the case #247 flags as otherwise colour-only and imperceptible.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(<TextField isInvalid label="Invalid" name="invalid" />);

	const input = page.getByRole('textbox', { name: 'Invalid' });
	await expect.element(input).toBeVisible();

	// The input is always a direct child of the styled group (adornments are
	// siblings, not wrappers), so `parentElement` is the group regardless of
	// whether adornments are present. The group carries `role="presentation"`
	// here (`RacTextField` supplies that through `GroupContext` when the field
	// has its own external `<label>`), so it cannot be found via `[role="group"]`.
	const group = input.element().parentElement;
	if (group == null) throw new Error('Expected the text input group.');

	const badge = getComputedStyle(group, '::after');
	expect(badge.content).not.toBe('none');
	expect(badge.content).toContain('!');

	expect(getComputedStyle(group).borderWidth).toBe('2px');
});

test('valid group keeps the 1px boundary the invalid state widens', async () => {
	renderVisual(<TextField label="Valid" name="valid" />);

	const input = page.getByRole('textbox', { name: 'Valid' });
	await expect.element(input).toBeVisible();

	const group = input.element().parentElement;
	if (group == null) throw new Error('Expected the text input group.');

	expect(getComputedStyle(group).borderWidth).toBe('1px');
});

test('the badge glyph stays out of the accessible name', async () => {
	renderVisual(<TextField isInvalid label="Invalid" name="invalid" />);

	const input = page.getByRole('textbox', { name: 'Invalid' });
	// The field's label is an external `<label>` associated via `aria-labelledby`,
	// not an ancestor of the group carrying the badge, so the badge's `::after`
	// content is never in this input's accessible-name computation regardless of
	// whether the runtime honours the CSS alt-text (`content: "x" / "alt"`)
	// syntax. See `checkbox.browser.test.tsx` for the case where that syntax
	// actually matters (the badge sits inside the label there).
	await expect.element(input).toHaveAccessibleName('Invalid');
});
