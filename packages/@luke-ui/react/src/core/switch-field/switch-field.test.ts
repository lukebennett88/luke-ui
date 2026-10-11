import { assertType, test } from 'vite-plus/test';
import type { SwitchFieldProps } from './switch-field.js';

test('SwitchField requires a visible label', () => {
	// @ts-expect-error — a composed switch always has a visible label
	assertType<SwitchFieldProps>({ name: 'notifications' });
	assertType<SwitchFieldProps>({ label: 'Notifications', name: 'notifications' });
});

test('SwitchField rejects external accessible names', () => {
	// @ts-expect-error — use the Switch primitive for an externally named switch
	assertType<SwitchFieldProps>({ 'aria-label': 'Enable setting', label: 'Notifications' });
	// @ts-expect-error — use the Switch primitive for an externally named switch
	assertType<SwitchFieldProps>({ 'aria-labelledby': 'setting-heading', label: 'Notifications' });
});

test('SwitchField does not take a collection slot', () => {
	// @ts-expect-error — a collection that names the switch needs the Switch primitive
	assertType<SwitchFieldProps>({ label: 'Notifications', slot: 'selection' });
});

test('SwitchField takes its label from the label prop, not children', () => {
	// @ts-expect-error — children are not the label
	assertType<SwitchFieldProps>({ children: 'Notifications', label: 'Notifications' });
});

test('SwitchField does not accept isInvalid', () => {
	// @ts-expect-error — a non-empty errorMessage marks the switch invalid
	assertType<SwitchFieldProps>({ isInvalid: true, label: 'Notifications' });
});
