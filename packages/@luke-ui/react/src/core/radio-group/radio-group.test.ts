import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { RadioGroupRootProps, RadioIndicatorProps } from '../primitives/radio/radio.js';
import type { RadioFieldProps, RadioGroupProps } from './radio-group.js';

test('RadioGroup requires a visible label or one accessible name', () => {
	// @ts-expect-error — a group without a label requires aria-label or aria-labelledby
	assertType<RadioGroupProps>({ children: null });
	assertType<RadioGroupProps>({ children: null, label: 'Plan' });
	assertType<RadioGroupProps>({ 'aria-label': 'Plan', children: null });
	assertType<RadioGroupProps>({ 'aria-labelledby': 'plan-heading', children: null });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<RadioGroupProps>({
		'aria-label': 'Plan',
		'aria-labelledby': 'plan-heading',
		children: null,
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<RadioGroupProps>({ 'aria-label': 'Plan', children: null, label: 'Plan' });
});

test('RadioField requires a visible label and a value', () => {
	// @ts-expect-error — every option needs a visible label
	assertType<RadioFieldProps>({ value: 'starter' });
	// @ts-expect-error — every option needs a value
	assertType<RadioFieldProps>({ label: 'Starter' });
	assertType<RadioFieldProps>({ label: 'Starter', value: 'starter' });
	// @ts-expect-error — group validation is not a radio option prop
	assertType<RadioFieldProps>({ label: 'Starter', validate: () => null, value: 'starter' });
	assertType<RadioFieldProps>({
		// @ts-expect-error — group errors are not option errors
		errorMessage: 'Choose a plan.',
		label: 'Starter',
		value: 'starter',
	});
	assertType<RadioGroupProps>({ children: null, label: 'Plan', validate: () => null });
});

test('RadioGroup keeps its public orientation and size choices narrow', () => {
	expectTypeOf<RadioGroupProps['orientation']>().toEqualTypeOf<
		'vertical' | 'horizontal' | undefined
	>();
	expectTypeOf<RadioGroupProps['size']>().toEqualTypeOf<'small' | 'medium' | undefined>();
	// @ts-expect-error — orientation is limited to the two supported layouts
	assertType<RadioGroupProps>({ children: null, label: 'Plan', orientation: 'diagonal' });
	// @ts-expect-error — radio options share the same size scale as the group
	assertType<RadioFieldProps>({ label: 'Starter', size: 'large', value: 'starter' });
});

test('RadioGroup omits read-only, which the primitives keep', () => {
	// @ts-expect-error — read-only presentation is not part of the composed API
	assertType<RadioGroupProps>({ children: null, isReadOnly: true, label: 'Plan' });
	assertType<RadioGroupRootProps>({ children: null, 'aria-label': 'Plan', isReadOnly: true });
	// @ts-expect-error — read-only is a group state, not an option prop
	assertType<RadioFieldProps>({ isReadOnly: true, label: 'Starter', value: 'starter' });
});

test('RadioIndicator draws its own mark and rejects children', () => {
	assertType<RadioIndicatorProps>({ className: 'indicator' });
	// @ts-expect-error — the indicator renders the dot, so it takes no children
	assertType<RadioIndicatorProps>({ children: 'Custom' });
});
