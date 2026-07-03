import { afterEach, expect, test } from 'vite-plus/test';
import { themeClass, vars } from '../styles/vars.css.js';
import { comboboxControl, comboboxItem } from './combobox.css.js';
import { textInputAdornmentStart, textInputGroup } from './text-input.css.js';

let wrappers: Array<HTMLElement> = [];

function mount(control: HTMLElement): HTMLElement {
	// Token vars only resolve inside the theme class.
	const wrapper = document.body.appendChild(document.createElement('div'));
	wrapper.className = themeClass;
	wrappers.push(wrapper);
	wrapper.append(control);
	return control;
}

/** Resolves a token's `var()` reference to the computed color Chromium reports. */
function resolveColor(value: string): string {
	const probe = document.createElement('div');
	probe.style.backgroundColor = value;
	const mounted = mount(probe);
	return getComputedStyle(mounted).backgroundColor;
}

function comboboxControlElement() {
	const control = document.createElement('div');
	control.className = comboboxControl({ size: 'medium' });
	control.append(document.createElement('input'), document.createElement('button'));
	return control;
}

afterEach(() => {
	for (const wrapper of wrappers) {
		wrapper.remove();
	}
	wrappers = [];
});

test('a resting combobox control is not styled as read-only by its trigger button', () => {
	const control = mount(comboboxControlElement());

	// `:has(:read-only)` would match the trigger button; `:has(input:read-only)` must not.
	expect(getComputedStyle(control).backgroundColor).toBe(resolveColor(vars.backgroundColor.input));
});

test('a resting text input group is not styled as read-only by its adornment', () => {
	const group = document.createElement('div');
	group.className = textInputGroup({ size: 'medium' });
	const adornment = document.createElement('span');
	adornment.className = textInputAdornmentStart({ size: 'medium' });
	group.append(adornment, document.createElement('input'));
	mount(group);

	expect(getComputedStyle(group).backgroundColor).toBe(resolveColor(vars.backgroundColor.input));
});

test('a combobox control with a read-only input gets the read-only treatment', () => {
	const control = comboboxControlElement();
	control.querySelector('input')?.setAttribute('readonly', '');
	mount(control);

	expect(getComputedStyle(control).backgroundColor).toBe(resolveColor(vars.backgroundColor.subtle));
});

test('disabled beats read-only on a combobox control', () => {
	const control = comboboxControlElement();
	// A disabled input also matches `:read-only`; the disabled treatment must win.
	control.querySelector('input')?.setAttribute('disabled', '');
	mount(control);

	const style = getComputedStyle(control);
	expect(style.backgroundColor).toBe(resolveColor(vars.backgroundColor.inputDisabled));
	expect(style.borderColor).toBe(resolveColor(vars.border.default));
});

test('text input and combobox share the same focus ring color', () => {
	const group = document.createElement('div');
	group.className = textInputGroup({ size: 'medium' });
	group.append(document.createElement('input'));
	mount(group);
	const control = mount(comboboxControlElement());

	group.querySelector('input')?.focus();
	const groupOutline = getComputedStyle(group).outlineColor;
	control.querySelector('input')?.focus();
	const controlOutline = getComputedStyle(control).outlineColor;

	expect(groupOutline).toBe(resolveColor(vars.themeColor.focusRingColor));
	expect(controlOutline).toBe(groupOutline);
});

test('keyboard-focused combobox items are indicated by background, not a second ring', () => {
	const item = document.createElement('li');
	item.className = comboboxItem({ size: 'medium' });
	// RAC marks the keyboard-active option with both attributes.
	item.setAttribute('data-focused', 'true');
	item.setAttribute('data-focus-visible', 'true');
	mount(item);

	const style = getComputedStyle(item);
	expect(style.outlineStyle).toBe('none');
	expect(style.backgroundColor).toBe(resolveColor(vars.backgroundColor.pressed));
	// The keyboard indicator carries the whole job without a ring, so it must
	// stay distinguishable from a plain hover highlight.
	expect(style.backgroundColor).not.toBe(resolveColor(vars.backgroundColor.hover));
});
