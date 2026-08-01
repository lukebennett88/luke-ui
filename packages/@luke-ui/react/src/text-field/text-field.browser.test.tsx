import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { ComboboxField } from '../combobox-field/index.js';
import { ComboboxItem } from '../combobox-field/primitive/item.js';
import { inputGroup } from '../recipes/input-group.css.js';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { TextField } from './index.js';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from './primitive/index.js';

/**
 * The input is always a direct child of the styled group (prefix and suffix are
 * siblings, not wrappers), so `parentElement` is the group regardless of what else
 * the composition contains. The group carries `role="presentation"` under a
 * `TextField` (`RacTextField` supplies that through `GroupContext` when the field has
 * its own external `<label>`), so it cannot be found via `[role="group"]`.
 */
function groupFor(name: string): HTMLElement {
	const group = page.getByRole('textbox', { name }).element().parentElement;
	if (group == null) throw new Error(`Expected a text input group for "${name}".`);
	return group;
}

// `inputGroup().invalidIndicator()` returns one stable class list regardless of `size`
// (the slot's `marginInlineEnd` is a constant, see `input-group.css.ts`), but the lookup
// still keys on the first token only, matching the other slot lookups in this file.
const invalidIndicatorClass = inputGroup().invalidIndicator().split(' ')[0];

/**
 * The invalid indicator `InputGroup` renders itself, if it is present. Matched by the
 * recipe's own slot class rather than by tag name: a prefix or suffix can hold an
 * `<svg>` of its own.
 */
function indicatorFor(name: string): SVGSVGElement | null {
	return groupFor(name).querySelector<SVGSVGElement>(`.${invalidIndicatorClass}`);
}

afterEach(() => {
	cleanupVisual();
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional — the case #247 flags as otherwise colour-only and imperceptible. The
// border stays at the resting 1px (see `input-group.css.ts`): the in-control icon is the
// non-colour cue here, so the proof is the icon's presence plus the gated border colour,
// not a border-width change.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(
		<>
			<TextField label="Resting" name="resting" />
			<TextField isInvalid label="Invalid" name="invalid" />
		</>,
	);

	const invalidInput = page.getByRole('textbox', { name: 'Invalid' });
	await expect.element(invalidInput).toBeVisible();

	const restingGroup = groupFor('Resting');
	const invalidGroup = groupFor('Invalid');

	expect(indicatorFor('Resting')).toBe(null);
	expect(indicatorFor('Invalid')).not.toBe(null);

	expect(getComputedStyle(invalidGroup).borderWidth).toBe('1px');
	expect(getComputedStyle(invalidGroup).borderColor).not.toBe(
		getComputedStyle(restingGroup).borderColor,
	);
});

test('the indicator icon adds no text to the accessible name', async () => {
	renderVisual(<TextField isInvalid label="Invalid" name="invalid" />);

	const input = page.getByRole('textbox', { name: 'Invalid' });
	// The field's label is an external `<label>` associated via `aria-labelledby`,
	// not an ancestor of the group carrying the indicator, so the indicator is never
	// in this input's accessible-name computation regardless. It is `aria-hidden`
	// either way, so there is nothing for a label ancestor to pick up — see
	// `checkbox.browser.test.tsx` for the case where the indicator does sit inside a
	// `<label>`.
	await expect.element(input).toHaveAccessibleName('Invalid');
	expect(indicatorFor('Invalid')?.getAttribute('aria-hidden')).toBe('true');
});

// The indicator scales with the control's own `size` (`INPUT_GROUP_ICON_SIZE`), the
// same `medium` → 20px, `small` → 16px mapping Combobox uses, so it stays proportioned
// to the field it sits in rather than sitting at a constant.
test('the indicator icon matches the control size variant, not a constant', async () => {
	renderVisual(
		<>
			<TextField isInvalid label="Medium" name="medium" />
			<TextField isInvalid label="Small" name="small" size="small" />
		</>,
	);
	await expect.element(page.getByRole('textbox', { name: 'Medium' })).toBeVisible();

	const medium = indicatorFor('Medium');
	const small = indicatorFor('Small');
	if (medium == null || small == null) throw new Error('Expected both invalid indicators.');

	expect(getComputedStyle(medium).blockSize).toBe('20px');
	expect(getComputedStyle(small).blockSize).toBe('16px');
});

/**
 * Gap between an element's trailing edge and its ancestor control's inner (inside the
 * border) trailing edge, measured from rendered layout rather than CSS declarations.
 */
function trailingInsetFromControlBorder(control: Element, element: Element): number {
	const controlRect = control.getBoundingClientRect();
	const borderWidth = Number.parseFloat(getComputedStyle(control).borderRightWidth);
	const innerBorderRight = controlRect.right - borderWidth;
	return innerBorderRight - element.getBoundingClientRect().right;
}

// #247: the invalid icon is a trailing glyph in a field, and `ComboboxField`'s chevron
// is the system's existing trailing-glyph precedent — a constant inset from the control's
// inner border, not one that scales with the control's own horizontal padding the way
// text does. This locks the two together across components at both sizes, so the
// `invalidIndicator` slot's `marginInlineEnd` (`input-group.css.ts`) cannot drift back to
// matching `control`'s padding without this failing.
for (const size of ['medium', 'small'] as const) {
	test(`the invalid icon sits at the same trailing inset as the combobox chevron: ${size}`, async () => {
		renderVisual(
			<>
				<TextField isInvalid label="Invalid" name="invalid" size={size} />
				<ComboboxField
					defaultItems={[{ id: 'au', label: 'Australia' }]}
					label="Country"
					name="country"
					size={size}
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</>,
		);

		const textInput = page.getByRole('textbox', { name: 'Invalid' });
		await expect.element(textInput).toBeVisible();

		const textFieldGroup = groupFor('Invalid');
		const indicator = indicatorFor('Invalid');
		if (indicator == null) throw new Error('Expected the invalid indicator.');

		const comboboxInput = page.getByRole('combobox', { name: 'Country' });
		const comboboxGroup = comboboxInput.element().closest<HTMLElement>('[role="group"]');
		if (comboboxGroup == null) throw new Error('Expected the combobox control group.');

		const chevron = page
			.getByRole('button', { name: 'Toggle options' })
			.element()
			.querySelector('svg');
		if (chevron == null) throw new Error('Expected the combobox trigger chevron.');

		const indicatorInset = trailingInsetFromControlBorder(textFieldGroup, indicator);
		const chevronInset = trailingInsetFromControlBorder(comboboxGroup, chevron);

		expect(indicatorInset).toBeCloseTo(chevronInset, 0);
		expect(indicatorInset).toBeCloseTo(8, 0);
	});
}

// #247/#312: the invalid icon must land before a trailing suffix, not after it. The
// suffix's flex `order` is what puts it there, so the DOM position of the appended
// icon alone does not prove it — the rendered geometry does.
test('the indicator lands after the input and before a trailing suffix', async () => {
	renderVisual(
		<InputGroup isInvalid>
			<InputGroupPrefix>$</InputGroupPrefix>
			<InputGroupInput aria-label="Amount" defaultValue="0.00" />
			<InputGroupSuffix>USD</InputGroupSuffix>
		</InputGroup>,
	);

	const input = page.getByRole('textbox', { name: 'Amount' });
	await expect.element(input).toBeVisible();

	const indicator = indicatorFor('Amount');
	if (indicator == null) throw new Error('Expected the invalid indicator.');

	const inputRect = input.element().getBoundingClientRect();
	const indicatorRect = indicator.getBoundingClientRect();
	const prefixRect = page.getByText('$').element().getBoundingClientRect();
	const suffixRect = page.getByText('USD').element().getBoundingClientRect();

	expect(prefixRect.left).toBeLessThan(inputRect.left);
	expect(indicatorRect.left).toBeGreaterThanOrEqual(inputRect.right);
	expect(indicatorRect.left).toBeLessThan(suffixRect.left);
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

	expect(getComputedStyle(groupFor('Email')).borderColor).toBe(
		getComputedStyle(groupFor('Resting')).borderColor,
	);
	expect(indicatorFor('Email')).toBe(null);
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

	expect(getComputedStyle(groupFor('Email')).borderColor).not.toBe(
		getComputedStyle(groupFor('Resting')).borderColor,
	);
	expect(indicatorFor('Email')).not.toBe(null);
});
