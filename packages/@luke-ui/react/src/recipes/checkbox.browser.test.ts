import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { fontSizeSteps } from '../theme/contract.js';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { checkbox } from './checkbox.css.js';
import { field as fieldRecipe } from './field.css.js';
import { text } from './text.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('the control follows a Text line-height custom property and centres its indicator', () => {
	for (const size of fontSizeSteps) {
		const { content, control, indicator } = mountCheckbox(undefined, size);
		const contentRect = content.getBoundingClientRect();
		const controlRect = control.getBoundingClientRect();
		const indicatorRect = indicator.getBoundingClientRect();

		expect(Math.abs(controlRect.top - contentRect.top)).toBeLessThan(0.1);
		expect(controlRect.height).toBe(Number.parseFloat(getComputedStyle(content).lineHeight));
		expect(
			Math.abs(
				indicatorRect.top + indicatorRect.height / 2 - (controlRect.top + controlRect.height / 2),
			),
		).toBeLessThan(0.1);
	}
});

test('the standalone control uses the compact default line height', () => {
	const { control } = mountCheckbox();
	expect(control.getBoundingClientRect().height).toBe(24);
});

test('the fallback follows the label line height and centres the indicator with its first line', () => {
	const { content, control, indicator } = mountCheckbox();
	content.style.lineHeight = '28px';
	const label = content.lastChild;
	if (label?.nodeType !== Node.TEXT_NODE) throw new Error('Expected a text label.');

	const range = document.createRange();
	range.selectNodeContents(label);
	const labelRect = range.getBoundingClientRect();
	const indicatorRect = indicator.getBoundingClientRect();

	expect(control.getBoundingClientRect().height).toBe(28);
	expect(
		Math.abs(indicatorRect.top + indicatorRect.height / 2 - (labelRect.top + labelRect.height / 2)),
	).toBeLessThanOrEqual(0.5);
});

test('content spacing and field messages align with the visible label', () => {
	const { content, control, description, error } = mountCheckbox();
	const contentStyle = getComputedStyle(content);
	const expectedOffset =
		control.getBoundingClientRect().width + Number.parseFloat(contentStyle.columnGap);

	expect(contentStyle.columnGap).toBe('8px');
	expect(getComputedStyle(description).paddingInlineStart).toBe(`${expectedOffset}px`);
	// The error message's indent is the same reservation as `description`'s: the
	// message-leading icon (`invalidMessageIcon`) is sized to fill that space rather
	// than add to it, so both messages resume text at the same left edge as the
	// label above them (see `field.css.ts`).
	expect(getComputedStyle(error).paddingInlineStart).toBe(`${expectedOffset}px`);
});

test('sizes inherit from the root into the control, indicator, and field messages', () => {
	const sizes = [
		{ glyph: 12, indicator: 16, size: 'small', wrapper: 20 },
		{ glyph: 16, indicator: 20, size: 'medium', wrapper: 24 },
		{ glyph: 20, indicator: 24, size: 'large', wrapper: 28 },
	] as const;

	for (const { glyph, indicator: indicatorSize, size, wrapper } of sizes) {
		const { content, control, description, error, indicator } = mountCheckbox(size);
		const contentStyle = getComputedStyle(content);
		const expectedIndent = wrapper + Number.parseFloat(contentStyle.columnGap);

		expect(control.getBoundingClientRect().width).toBe(wrapper);
		expect(indicator.getBoundingClientRect().width).toBe(indicatorSize);
		expect(Number.parseFloat(getComputedStyle(indicator).fontSize)).toBe(glyph);
		expect(getComputedStyle(description).paddingInlineStart).toBe(`${expectedIndent}px`);
		// The error message shares `description`'s indent at every size: the
		// message-leading icon fills the reserved space instead of adding to it.
		expect(getComputedStyle(error).paddingInlineStart).toBe(`${expectedIndent}px`);
	}
});

test('ordinary field messages keep their zero indentation fallback', () => {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	const message = root.appendChild(document.createElement('span'));
	message.className = fieldRecipe({ tone: 'description' }).message();
	mounted.push(root);

	expect(getComputedStyle(message).paddingInlineStart).toBe('0px');
});

test('hover and pressed states change the control material', () => {
	const { content, indicator } = mountCheckbox();
	const restingFinish = getComputedStyle(indicator).backgroundImage;

	content.dataset.hovered = 'true';
	const hoveredFinish = getComputedStyle(indicator).backgroundImage;

	delete content.dataset.hovered;
	content.dataset.pressed = 'true';
	const pressedFinish = getComputedStyle(indicator).backgroundImage;

	expect(restingFinish).not.toBe('none');
	expect(hoveredFinish).not.toBe(restingFinish);
	expect(pressedFinish).not.toBe(restingFinish);
	expect(pressedFinish).not.toBe(hoveredFinish);
});

function mountCheckbox(
	size?: 'small' | 'medium' | 'large',
	textSize?: (typeof fontSizeSteps)[number],
) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	root.dataset.colorMode = 'light';
	root.style.lineHeight = '24px';
	const textElement = root.appendChild(document.createElement('span'));
	if (textSize != null) textElement.className = text({ shouldDisableTrim: true, size: textSize });

	const classes = checkbox({ size });
	const field = textElement.appendChild(document.createElement('div'));
	field.className = classes.root();
	const content = field.appendChild(document.createElement('label'));
	content.className = classes.content();
	const control = content.appendChild(document.createElement('span'));
	control.className = classes.control();
	const indicator = control.appendChild(document.createElement('span'));
	indicator.className = classes.indicator();
	content.append('Checkbox label');
	const description = field.appendChild(document.createElement('span'));
	description.className = fieldRecipe({ tone: 'description' }).message();
	description.slot = 'description';
	description.textContent = 'Description';
	const error = field.appendChild(document.createElement('span'));
	error.className = fieldRecipe({ tone: 'error' }).message();
	error.slot = 'errorMessage';
	error.textContent = 'Error';
	mounted.push(root);

	return { content, control, description, error, indicator, root };
}
