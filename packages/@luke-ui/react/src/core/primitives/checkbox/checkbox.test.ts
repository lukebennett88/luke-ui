import type { ReactElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
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

test('CheckboxLabel keeps the React Aria label composition surface', () => {
	assertType<CheckboxLabelProps>({
		children: ({ isSelected }) => (isSelected ? 'On' : 'Off'),
		className: ({ isFocusVisible }) => (isFocusVisible ? 'focused' : ''),
		slot: 'example',
		style: ({ isPressed }) => ({ opacity: isPressed ? 0.5 : 1 }),
	});
	expectTypeOf<CheckboxLabelProps>().toHaveProperty('render');
	expectTypeOf<CheckboxLabelProps>().toHaveProperty('onHoverStart');
});

test('CheckboxLabel has no necessity indicator', () => {
	// @ts-expect-error — CheckboxField owns the required marker
	assertType<CheckboxLabelProps>({ children: 'Terms', necessityIndicator: 'label' });
});
