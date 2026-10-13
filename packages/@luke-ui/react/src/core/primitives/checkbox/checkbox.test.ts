import type { ReactElement } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { CheckboxLabelProps, CheckboxRootProps } from './checkbox.js';

test('CheckboxRoot keeps external naming and controlled invalid state', () => {
	assertType<CheckboxRootProps>({ 'aria-label': 'Example', children: null });
	assertType<CheckboxRootProps>({ 'aria-labelledby': 'example-label', children: null });
	assertType<CheckboxRootProps>({ children: null, isInvalid: true, slot: 'selection' });
});

test('CheckboxRoot owns ids through id and inputId, not render', () => {
	assertType<CheckboxRootProps>({ children: null, id: 'root', inputId: 'input' });
	// @ts-expect-error — the root keeps React Aria's render seam for its own id handling
	assertType<CheckboxRootProps>({ children: null, render: (props) => props as ReactElement });
});

test('CheckboxLabel has no necessity indicator', () => {
	// @ts-expect-error — CheckboxField owns the required marker
	assertType<CheckboxLabelProps>({ children: 'Terms', necessityIndicator: 'required-label' });
});
