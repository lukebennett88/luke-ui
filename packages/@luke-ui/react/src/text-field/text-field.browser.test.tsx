import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { TextField } from './index.js';

afterEach(() => {
	cleanupVisual();
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional — the case #247 flags as otherwise colour-only and imperceptible. The
// border stays at the resting 1px (see `text-input.css.ts`): the in-control icon is the
// non-colour cue here, so the proof is the icon's presence plus the gated border colour,
// not a border-width change.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(
		<>
			<TextField label="Resting" name="resting" />
			<TextField isInvalid label="Invalid" name="invalid" />
		</>,
	);

	const restingInput = page.getByRole('textbox', { name: 'Resting' });
	const invalidInput = page.getByRole('textbox', { name: 'Invalid' });
	await expect.element(invalidInput).toBeVisible();

	// The input is always a direct child of the styled group (adornments are
	// siblings, not wrappers), so `parentElement` is the group regardless of
	// whether adornments are present. The group carries `role="presentation"`
	// here (`RacTextField` supplies that through `GroupContext` when the field
	// has its own external `<label>`), so it cannot be found via `[role="group"]`.
	const restingGroup = restingInput.element().parentElement;
	const invalidGroup = invalidInput.element().parentElement;
	if (restingGroup == null || invalidGroup == null) {
		throw new Error('Expected both text input groups.');
	}

	const indicator = getComputedStyle(invalidGroup, '::after');
	expect(indicator.content).toBe('""');
	expect(indicator.maskImage).not.toBe('none');

	expect(getComputedStyle(invalidGroup).borderWidth).toBe('1px');
	expect(getComputedStyle(invalidGroup).borderColor).not.toBe(
		getComputedStyle(restingGroup).borderColor,
	);
});

test('the indicator icon adds no text to the accessible name', async () => {
	renderVisual(<TextField isInvalid label="Invalid" name="invalid" />);

	const input = page.getByRole('textbox', { name: 'Invalid' });
	// The field's label is an external `<label>` associated via `aria-labelledby`,
	// not an ancestor of the group carrying the indicator, so the indicator's
	// `::after` is never in this input's accessible-name computation regardless.
	// The indicator's `content` is empty (a mask, not a glyph) either way, so
	// there is nothing for a label ancestor to pick up — see
	// `checkbox.browser.test.tsx` for the case where the indicator does sit
	// inside a `<label>`.
	await expect.element(input).toHaveAccessibleName('Invalid');
});

// #247: `inputStates.invalid` used to include `:has(:invalid)`, which matches a
// required, empty input from first render — before any interaction or submit —
// while `aria-invalid` stays null. That painted an untouched required field
// invalid though assistive technology was told it was fine. These two tests are
// the regression guard for the fix: the group only picks up the invalid
// treatment once React Aria has recorded a real validation failure. The border
// stays 1px in both the untouched and the invalid case now that the in-control
// icon (not a width change) is the invalid cue, so the proof is the border colour
// and the icon's presence, not a width comparison.
test('a required field with no value is not painted invalid before validation runs', async () => {
	renderVisual(
		<>
			<TextField label="Resting" name="resting" />
			<TextField isRequired label="Email" name="email" />
		</>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();
	await expect.element(input).not.toHaveAttribute('aria-invalid');

	const restingGroup = page.getByRole('textbox', { name: 'Resting' }).element().parentElement;
	const group = input.element().parentElement;
	if (restingGroup == null || group == null) throw new Error('Expected the text input groups.');

	expect(getComputedStyle(group).borderColor).toBe(getComputedStyle(restingGroup).borderColor);
	expect(getComputedStyle(group, '::after').maskImage).toBe('none');
});

test('a required field is painted invalid once a real submit fails validation', async () => {
	// A plain `<form>`, not react-aria-components' `Form`: the latter fails to
	// resolve in this browser test environment. React Aria's own field
	// validation listens for the browser's native `invalid` event regardless of
	// an ancestor `Form`, so a native submit is enough to trigger it.
	renderVisual(
		<form>
			<TextField label="Resting" name="resting" />
			<TextField isRequired label="Email" name="email" />
			<button type="submit">Submit</button>
		</form>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();
	await expect.element(input).not.toHaveAttribute('aria-invalid');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.element(input).toHaveAttribute('aria-invalid', 'true');

	const restingGroup = page.getByRole('textbox', { name: 'Resting' }).element().parentElement;
	const group = input.element().parentElement;
	if (restingGroup == null || group == null) throw new Error('Expected the text input groups.');

	expect(getComputedStyle(group).borderColor).not.toBe(getComputedStyle(restingGroup).borderColor);
	expect(getComputedStyle(group, '::after').maskImage).not.toBe('none');
});
