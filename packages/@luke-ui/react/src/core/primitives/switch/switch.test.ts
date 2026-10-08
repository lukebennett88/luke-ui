import type { ReactElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { SwitchLabelProps, SwitchRootProps } from './switch.js';

test('SwitchRoot keeps external naming and controlled invalid state', () => {
	assertType<SwitchRootProps>({ 'aria-label': 'Example', children: null });
	assertType<SwitchRootProps>({ 'aria-labelledby': 'example-label', children: null });
	assertType<SwitchRootProps>({ children: null, isInvalid: true, slot: 'selection' });
});

test('SwitchRoot owns ids through id and inputId, not render', () => {
	assertType<SwitchRootProps>({ children: null, id: 'root', inputId: 'input' });
	// @ts-expect-error — the root keeps React Aria's render seam for its own id handling
	assertType<SwitchRootProps>({ children: null, render: (props) => props as ReactElement });
});

test('SwitchLabel keeps the React Aria label composition surface', () => {
	assertType<SwitchLabelProps>({
		children: ({ isSelected }) => (isSelected ? 'On' : 'Off'),
		className: ({ isFocusVisible }) => (isFocusVisible ? 'focused' : ''),
		slot: 'example',
		style: ({ isPressed }) => ({ opacity: isPressed ? 0.5 : 1 }),
	});
	expectTypeOf<SwitchLabelProps>().toHaveProperty('render');
	expectTypeOf<SwitchLabelProps>().toHaveProperty('onHoverStart');
});

test('SwitchLabel has no necessity indicator', () => {
	// @ts-expect-error — SwitchField owns the required marker
	assertType<SwitchLabelProps>({ children: 'Notifications', necessityIndicator: 'label' });
});
