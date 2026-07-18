import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { cx } from '../utils/index.js';
import type { TextInputVariants } from './text-input.js';
import { textInputAdornmentStart, textInputGroup } from './text-input.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('small and medium share the control geometry contract', () => {
	const { group: small } = mountGroup({ size: 'small' });
	const { group: medium } = mountGroup({ size: 'medium' });

	expect(getComputedStyle(small).blockSize).toBe('32px');
	expect(getComputedStyle(medium).blockSize).toBe('40px');
});

test('hover sets the accent border only when not disabled, read-only, or focus-within', () => {
	const { group: resting } = mountGroup();
	const { group: hovered } = mountGroup();
	hovered.dataset.hovered = 'true';

	const restingBorder = getComputedStyle(resting).borderColor;
	const hoveredBorder = getComputedStyle(hovered).borderColor;
	expect(hoveredBorder).not.toBe(restingBorder);

	const { group: disabledHover } = mountGroup();
	disabledHover.dataset.hovered = 'true';
	disabledHover.dataset.disabled = 'true';
	expect(getComputedStyle(disabledHover).borderColor).toBe(restingBorder);

	const { group: readOnlyHover } = mountGroup();
	readOnlyHover.dataset.hovered = 'true';
	readOnlyHover.dataset.readonly = 'true';
	expect(getComputedStyle(readOnlyHover).borderColor).not.toBe(hoveredBorder);

	const { group: focusWithinOnly } = mountGroup();
	focusWithinOnly.dataset.focusWithin = 'true';
	const { group: focusWithinHover } = mountGroup();
	focusWithinHover.dataset.focusWithin = 'true';
	focusWithinHover.dataset.hovered = 'true';
	expect(getComputedStyle(focusWithinHover).borderColor).toBe(
		getComputedStyle(focusWithinOnly).borderColor,
	);
});

test('focus-within shows the complete ring and the accent border', () => {
	const { group } = mountGroup();
	group.dataset.focusWithin = 'true';
	const style = getComputedStyle(group);

	expect(style.outlineStyle).toBe('solid');
	expect(style.outlineWidth).toBe('2px');
	expect(style.outlineOffset).toBe('2px');
	expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');

	const { group: resting } = mountGroup();
	expect(style.borderColor).not.toBe(getComputedStyle(resting).borderColor);
});

test('invalid shows the danger border even while focus-within, ring stays the same focus color', () => {
	const { group: invalid } = mountGroup();
	invalid.dataset.invalid = 'true';
	const invalidBorder = getComputedStyle(invalid).borderColor;

	const { group: focusRing } = mountGroup();
	focusRing.dataset.focusWithin = 'true';
	const focusOutline = getComputedStyle(focusRing).outlineColor;

	const { group: invalidFocus } = mountGroup();
	invalidFocus.dataset.invalid = 'true';
	invalidFocus.dataset.focusWithin = 'true';
	const invalidFocusStyle = getComputedStyle(invalidFocus);

	expect(invalidFocusStyle.borderColor).toBe(invalidBorder);
	expect(invalidFocusStyle.outlineColor).toBe(focusOutline);

	const { group: resting } = mountGroup();
	expect(invalidBorder).not.toBe(getComputedStyle(resting).borderColor);
});

test('disabled preserves resting background and border, only dropping opacity', () => {
	const { group: resting } = mountGroup();
	const { group: disabled } = mountGroup();
	disabled.dataset.disabled = 'true';
	disabled.dataset.hovered = 'true';

	expect(getComputedStyle(disabled).backgroundColor).toBe(
		getComputedStyle(resting).backgroundColor,
	);
	expect(getComputedStyle(disabled).borderColor).toBe(getComputedStyle(resting).borderColor);
	expect(getComputedStyle(disabled).opacity).toBe('0.55');
	expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
});

test('read-only flattens into canvas surface with a decorative border and ignores hover', () => {
	const { group: resting } = mountGroup();
	const { group: readOnly } = mountGroup();
	readOnly.dataset.readonly = 'true';
	const { group: readOnlyHover } = mountGroup();
	readOnlyHover.dataset.readonly = 'true';
	readOnlyHover.dataset.hovered = 'true';

	const readOnlyStyle = getComputedStyle(readOnly);

	expect(readOnlyStyle.borderColor).not.toBe(getComputedStyle(resting).borderColor);
	expect(readOnlyStyle.boxShadow).toBe('none');
	expect(getComputedStyle(readOnlyHover).borderColor).toBe(readOnlyStyle.borderColor);
});

test('read-only still shows the focus ring since read-only fields remain focusable', () => {
	const { group } = mountGroup();
	group.dataset.readonly = 'true';
	group.dataset.focusWithin = 'true';
	const style = getComputedStyle(group);

	expect(style.outlineStyle).toBe('solid');
	expect(style.outlineWidth).toBe('2px');
});

test('adornment divider uses the control border color and disabled text color follows the group', () => {
	const { group, root } = mountGroup();
	const adornment = group.appendChild(document.createElement('span'));
	adornment.className = textInputAdornmentStart({ size: 'medium' });

	const controlBorderProbe = root.appendChild(document.createElement('div'));
	controlBorderProbe.style.borderColor = 'var(--luke-color-border-control)';
	expect(getComputedStyle(adornment).borderInlineEndColor).toBe(
		getComputedStyle(controlBorderProbe).borderColor,
	);

	group.dataset.disabled = 'true';
	const disabledTextProbe = root.appendChild(document.createElement('div'));
	disabledTextProbe.style.color = 'var(--luke-color-text-disabled)';
	expect(getComputedStyle(adornment).color).toBe(getComputedStyle(disabledTextProbe).color);
});

function mountGroup(options: TextInputVariants = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = cx(themeRootClassName, tactileThemeClassName);
	root.dataset.colorMode = 'light';
	const group = root.appendChild(document.createElement('div'));
	group.className = textInputGroup(options);
	group.style.transition = 'none';
	mounted.push(root);
	return { group, root };
}
