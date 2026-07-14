import '@luke-ui/react/themes/machined-edge.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { themeRootClassName } from '../theme/index.js';
import { machinedEdgeThemeClassName } from '../themes/index.js';
import { cx } from '../utils/index.js';
import {
	comboboxClearButton,
	comboboxControl,
	comboboxItem,
	comboboxPopover,
	comboboxTrigger,
} from './combobox.css.js';

let wrappers: Array<HTMLElement> = [];

afterEach(async () => {
	await setEmulatedMedia();
	for (const wrapper of wrappers) wrapper.remove();
	wrappers = [];
});

test('the control uses the recessed field material and semantic state grammar', () => {
	const { control: resting, root } = mountControl();
	const restingStyle = getComputedStyle(resting);

	expect(restingStyle.backgroundColor).toBe(resolveColor(root, '--luke-color-surface-recessed'));
	expect(restingStyle.borderColor).toBe(resolveColor(root, '--luke-color-border-control'));
	expect(restingStyle.boxShadow).toBe(resolveValue(root, 'boxShadow', '--luke-depth-recessed'));

	const { control: hovered } = mountControl();
	hovered.dataset.hovered = 'true';
	expect(getComputedStyle(hovered).borderColor).toBe(
		resolveColor(root, '--luke-color-intent-accent-border'),
	);

	const { control: focused } = mountControl();
	focused.dataset.focusWithin = 'true';
	const focusedStyle = getComputedStyle(focused);
	expect(focusedStyle.outlineStyle).toBe('solid');
	expect(focusedStyle.outlineWidth).toBe('2px');
	expect(focusedStyle.outlineOffset).toBe('2px');
	expect(focusedStyle.outlineColor).toBe(resolveColor(root, '--luke-color-border-focus'));

	const { control: invalid } = mountControl();
	invalid.dataset.invalid = 'true';
	expect(getComputedStyle(invalid).borderColor).toBe(
		resolveColor(root, '--luke-color-intent-danger-border'),
	);
});

test('disabled and read-only controls preserve their non-interactive material', () => {
	const { control: resting } = mountControl();
	const restingStyle = getComputedStyle(resting);

	const { control: disabled } = mountControl();
	disabled.dataset.disabled = 'true';
	disabled.dataset.hovered = 'true';
	const disabledStyle = getComputedStyle(disabled);
	expect(disabledStyle.backgroundColor).toBe(restingStyle.backgroundColor);
	expect(disabledStyle.borderColor).toBe(restingStyle.borderColor);
	expect(disabledStyle.boxShadow).toBe(restingStyle.boxShadow);
	expect(disabledStyle.opacity).toBe('0.55');

	const { control: readOnly, root } = mountControl();
	readOnly.querySelector('input')?.setAttribute('readonly', '');
	readOnly.dataset.hovered = 'true';
	const readOnlyStyle = getComputedStyle(readOnly);
	expect(readOnlyStyle.backgroundColor).toBe(resolveColor(root, '--luke-color-surface-canvas'));
	expect(readOnlyStyle.borderColor).toBe(resolveColor(root, '--luke-color-border-decorative'));
	expect(readOnlyStyle.boxShadow).toBe('none');
});

test('in-field actions are quiet inset squares without a permanent divider or travel', () => {
	const { root } = mountControl();
	for (const { className, expectedSize, isTrigger } of [
		{ className: comboboxClearButton({ size: 'small' }), expectedSize: 24, isTrigger: false },
		{ className: comboboxTrigger({ size: 'small' }), expectedSize: 24, isTrigger: true },
		{ className: comboboxClearButton({ size: 'medium' }), expectedSize: 28, isTrigger: false },
		{ className: comboboxTrigger({ size: 'medium' }), expectedSize: 28, isTrigger: true },
	]) {
		const action = root.appendChild(document.createElement('button'));
		action.className = className;
		action.style.transitionDuration = '0s';
		const restingStyle = getComputedStyle(action);
		expect(Number.parseFloat(restingStyle.blockSize)).toBe(expectedSize);
		expect(Number.parseFloat(restingStyle.inlineSize)).toBe(expectedSize);
		expect(Number.parseFloat(restingStyle.minBlockSize)).toBeGreaterThanOrEqual(24);
		expect(Number.parseFloat(restingStyle.minInlineSize)).toBeGreaterThanOrEqual(24);
		expect(restingStyle.paddingInlineStart).toBe('0px');
		expect(restingStyle.paddingInlineEnd).toBe('0px');
		expect(restingStyle.boxShadow).toBe('none');
		expect(Number.parseFloat(restingStyle.marginInlineEnd) > 0).toBe(isTrigger);
		expect(getComputedStyle(action, '::before').content).toBe('none');

		action.dataset.hovered = 'true';
		const hoveredStyle = getComputedStyle(action);
		expect(hoveredStyle.backgroundColor).toBe(
			resolveColor(root, '--luke-color-intent-accent-surface-subtle-hover'),
		);
		expect(hoveredStyle.boxShadow).toBe('none');
		expect(hoveredStyle.transform).toBe('none');

		delete action.dataset.hovered;
		action.dataset.pressed = 'true';
		const pressedStyle = getComputedStyle(action);
		expect(pressedStyle.backgroundColor).toBe(
			resolveColor(root, '--luke-color-intent-accent-surface-subtle-pressed'),
		);
		expect(pressedStyle.boxShadow).toBe('none');
		expect(pressedStyle.transform).toBe('none');
	}
});

test('options keep hover, keyboard focus, selected, and disabled states distinct', () => {
	const { root } = mountControl();
	const resting = mountItem(root);
	const hovered = mountItem(root, { hovered: 'true' });
	const focused = mountItem(root, { focused: 'true' });
	const hoveredAndFocused = mountItem(root, { focused: 'true', hovered: 'true' });
	const keyboardFocused = mountItem(root, {
		focusVisible: 'true',
		focused: 'true',
		hovered: 'true',
	});
	const selected = mountItem(root, { selected: 'true' });
	const disabled = mountItem(root, { disabled: 'true', focused: 'true' });

	expect(getComputedStyle(focused).backgroundColor).toBe(
		resolveColor(root, '--luke-color-intent-neutral-surface-subtle'),
	);
	expect(getComputedStyle(hoveredAndFocused).backgroundColor).toBe(
		resolveColor(root, '--luke-color-intent-neutral-surface-subtle-hover'),
	);
	expect(getComputedStyle(keyboardFocused).backgroundColor).toBe(
		resolveColor(root, '--luke-color-intent-accent-surface-subtle-hover'),
	);

	const interactiveBackgrounds = [resting, hovered, keyboardFocused, selected].map((item) => {
		return getComputedStyle(item).backgroundColor;
	});
	expect(new Set(interactiveBackgrounds)).toHaveLength(interactiveBackgrounds.length);
	expect(getComputedStyle(hovered).backgroundColor).not.toBe(
		getComputedStyle(disabled).backgroundColor,
	);
	expect(getComputedStyle(selected).fontWeight).not.toBe(getComputedStyle(resting).fontWeight);
	expect(getComputedStyle(disabled).backgroundColor).toBe(
		getComputedStyle(resting).backgroundColor,
	);
	expect(getComputedStyle(disabled).opacity).toBe('0.55');
});

test('the portalled surface uses floating surface and depth', () => {
	const { root } = mountControl();
	const popover = root.appendChild(document.createElement('div'));
	popover.className = comboboxPopover();
	const style = getComputedStyle(popover);

	expect(style.backgroundColor).toBe(resolveColor(root, '--luke-color-surface-floating'));
	expect(style.boxShadow).toContain(resolveValue(root, 'boxShadow', '--luke-depth-floating'));
});

test('forced colors remove authored depth and preserve system state colors', async () => {
	await setEmulatedMedia('forced-colors', 'active');

	const { control: resting, root } = mountControl();
	const restingStyle = getComputedStyle(resting);
	expect(restingStyle.backgroundColor).toBe(resolveSystemColor(root, 'Field'));
	expect(restingStyle.borderColor).toBe(resolveSystemColor(root, 'FieldText'));
	expect(restingStyle.boxShadow).toBe('none');

	const { control: disabled } = mountControl();
	disabled.dataset.disabled = 'true';
	const disabledStyle = getComputedStyle(disabled);
	expect(disabledStyle.borderColor).toBe(resolveSystemColor(root, 'GrayText'));
	expect(disabledStyle.color).toBe(resolveSystemColor(root, 'GrayText'));
	expect(disabledStyle.opacity).toBe('1');

	const { control: focused } = mountControl();
	focused.dataset.focusWithin = 'true';
	expect(getComputedStyle(focused).outlineColor).toBe(resolveSystemColor(root, 'Highlight'));

	const action = root.appendChild(document.createElement('button'));
	action.className = comboboxTrigger({ size: 'medium' });
	expect(getComputedStyle(action).boxShadow).toBe('none');

	const popover = root.appendChild(document.createElement('div'));
	popover.className = comboboxPopover();
	expect(getComputedStyle(popover).boxShadow).toBe('none');

	const disabledItem = mountItem(root, { disabled: 'true' });
	const disabledItemStyle = getComputedStyle(disabledItem);
	expect(disabledItemStyle.color).toBe(resolveSystemColor(root, 'GrayText'));
	expect(disabledItemStyle.opacity).toBe('1');

	const focusedItem = mountItem(root, { focusVisible: 'true' });
	expect(getComputedStyle(focusedItem).outlineColor).toBe(resolveSystemColor(root, 'Highlight'));
});

test('reduced motion makes control, action, option, and popover state changes immediate', async () => {
	await setEmulatedMedia('prefers-reduced-motion', 'reduce');

	const { control, root } = mountControl();
	const action = root.appendChild(document.createElement('button'));
	action.className = comboboxClearButton({ size: 'medium' });
	action.dataset.hovered = 'true';
	const item = mountItem(root, { hovered: 'true' });
	const popover = root.appendChild(document.createElement('div'));
	popover.className = comboboxPopover();
	popover.dataset.entering = '';

	for (const element of [control, action, item, popover]) {
		expect(getComputedStyle(element).transitionDuration).toBe('0s');
	}
	expect(getComputedStyle(action).transform).toBe('none');
	expect(getComputedStyle(item).transform).toBe('none');
	expect(getComputedStyle(popover).opacity).toBe('1');
	expect(getComputedStyle(popover).translate).toBe('none');
});

function mountControl() {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = cx(themeRootClassName, machinedEdgeThemeClassName);
	root.dataset.colorMode = 'light';
	wrappers.push(root);
	const control = root.appendChild(document.createElement('div'));
	control.className = comboboxControl({ size: 'medium' });
	control.append(document.createElement('input'), document.createElement('button'));
	return { control, root };
}

function mountItem(root: HTMLElement, states: Record<string, string> = {}) {
	const item = root.appendChild(document.createElement('div'));
	item.className = comboboxItem({ size: 'medium' });
	for (const [state, value] of Object.entries(states)) item.dataset[state] = value;
	return item;
}

function resolveColor(root: HTMLElement, variable: string) {
	return resolveValue(root, 'backgroundColor', variable);
}

async function setEmulatedMedia(name?: string, value?: string) {
	const session = cdp();
	await session.send('Emulation.setEmulatedMedia', {
		features: name === undefined || value === undefined ? [] : [{ name, value }],
	});
}

function resolveSystemColor(root: HTMLElement, color: string) {
	const probe = root.appendChild(document.createElement('div'));
	probe.style.color = color;
	const value = getComputedStyle(probe).color;
	probe.remove();
	return value;
}

function resolveValue(
	root: HTMLElement,
	property: 'backgroundColor' | 'boxShadow',
	variable: string,
) {
	const probe = root.appendChild(document.createElement('div'));
	probe.style[property] = `var(${variable})`;
	const value = getComputedStyle(probe)[property];
	probe.remove();
	return value;
}
