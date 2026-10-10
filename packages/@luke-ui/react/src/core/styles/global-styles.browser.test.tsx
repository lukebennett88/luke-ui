import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { Heading } from '@luke-ui/react/heading';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { SelectItem } from '@luke-ui/react/primitives/select';
import { SelectField } from '@luke-ui/react/select-field';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	emulateColorScheme,
	emulateForcedColors,
	emulateReducedMotion,
} from '../test-utils/emulate-media.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

const added: Array<Element> = [];

afterEach(async () => {
	for (const element of added) element.remove();
	added.length = 0;
	await emulateForcedColors('none');
	await emulateReducedMotion(false);
	await emulateColorScheme('light');
});

function addStyle(css: string) {
	const style = document.head.appendChild(document.createElement('style'));
	style.textContent = css;
	added.push(style);
}

/** The computed colour `value` resolves to inside `parent`, for comparing with computed styles. */
function resolvedColor(value: string, parent: Element = document.body): string {
	const probe = parent.appendChild(document.createElement('span'));
	probe.style.color = value;
	const color = getComputedStyle(probe).color;
	probe.remove();
	return color;
}

function byTestId(container: HTMLElement, id: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (element === null) throw new Error(`Expected [data-testid="${id}"].`);
	return element;
}

/** Elements that paint an outline. A visually hidden input's outline is clipped away. */
function visibleRings(root: Element): Array<Element> {
	return [...root.querySelectorAll('*')].filter((element) => {
		const style = getComputedStyle(element);
		if (style.outlineStyle === 'none' || style.outlineWidth === '0px') return false;
		return !isClipped(element);
	});
}

function isClipped(element: Element): boolean {
	for (let node: Element | null = element; node !== null; node = node.parentElement) {
		const style = getComputedStyle(node);
		if (style.clip !== 'auto' || style.clipPath !== 'none') return true;
	}
	return false;
}

function MixedHost() {
	return (
		<div style={{ inlineSize: '24rem', padding: '1rem' }}>
			<h1 data-testid="native-h1">A native heading that wraps across more than one line</h1>
			<p data-testid="native-p">A native paragraph with a native link to the next page.</p>
			<blockquote data-testid="native-blockquote">A native blockquote.</blockquote>
			<ul data-testid="native-ul">
				<li>First</li>
				<li>Second</li>
			</ul>
			<ol data-testid="native-ol" type="a">
				<li>Alpha</li>
			</ol>
			<table data-testid="native-table">
				<tbody>
					<tr>
						<th>Key</th>
						<td data-testid="native-td">Value</td>
					</tr>
				</tbody>
			</table>
			<p>
				<a data-testid="native-link" href="#next">
					Native link
				</a>
			</p>
			<button data-testid="native-button" type="button">
				Native button
			</button>
			<input aria-label="Native input" data-testid="native-input" defaultValue="Native" />
			<Heading data-testid="luke-heading" level={2}>
				Luke UI heading
			</Heading>
			<Text data-testid="luke-text" elementType="p">
				Luke UI paragraph.
			</Text>
			<Button data-testid="luke-button">Luke UI button</Button>
		</div>
	);
}

test('keeps native presentation for application markup', () => {
	const { container } = render(<MixedHost />);
	const bodyFontSize = Number.parseFloat(getComputedStyle(document.body).fontSize);

	const h1 = getComputedStyle(byTestId(container, 'native-h1'));
	expect(Number.parseFloat(h1.fontSize)).toBe(bodyFontSize * 2);
	expect(h1.fontWeight).toBe('700');
	expect(h1.marginBlockStart).not.toBe('0px');
	// Unitless, so the wrapped heading's lines are spaced for its own size.
	expect(Number.parseFloat(h1.lineHeight)).toBeCloseTo(Number.parseFloat(h1.fontSize) * 1.5, 1);

	expect(getComputedStyle(byTestId(container, 'native-p')).marginBlockStart).toBe(
		`${bodyFontSize}px`,
	);
	expect(getComputedStyle(byTestId(container, 'native-blockquote')).marginInlineStart).toBe('40px');

	const ul = getComputedStyle(byTestId(container, 'native-ul'));
	expect(ul.listStyleType).toBe('disc');
	expect(ul.paddingInlineStart).toBe('40px');
	expect(getComputedStyle(byTestId(container, 'native-ol')).listStyleType).toBe('lower-alpha');

	expect(getComputedStyle(byTestId(container, 'native-table')).borderSpacing).toBe('2px');
	expect(getComputedStyle(byTestId(container, 'native-td')).paddingInlineStart).toBe('1px');

	expect(getComputedStyle(byTestId(container, 'native-link')).textDecorationLine).toBe('underline');

	const button = getComputedStyle(byTestId(container, 'native-button'));
	expect(button.appearance).toBe('auto');
	expect(button.paddingInlineStart).not.toBe('0px');
	expect(button.fontFamily).toBe(getComputedStyle(document.body).fontFamily);
	expect(button.margin).toBe('0px');

	const input = byTestId(container, 'native-input');
	expect(getComputedStyle(input).fontFamily).toBe(getComputedStyle(document.body).fontFamily);
	// Native controls keep their system text colour, which follows `color-scheme`.
	expect(getComputedStyle(input).color).toBe(resolvedColor('FieldText', input.parentElement!));

	addStyle('[data-testid="native-p"]::before { content: ""; }');
	expect(getComputedStyle(byTestId(container, 'native-p')).boxSizing).toBe('border-box');
	expect(getComputedStyle(byTestId(container, 'native-p'), '::before').boxSizing).toBe(
		'border-box',
	);
});

test('lets Luke UI components keep their own appearance beside native markup', () => {
	const { container } = render(<MixedHost />);

	expect(getComputedStyle(byTestId(container, 'luke-heading')).marginBlockStart).toBe('0px');
	expect(getComputedStyle(byTestId(container, 'luke-text')).marginBlockStart).toBe('0px');
	const button = getComputedStyle(byTestId(container, 'luke-button'));
	expect(button.appearance).toBe('none');
	expect(button.borderTopStyle).toBe('solid');
	expect(button.borderTopWidth).toBe('0px');
	expect(button.cursor).not.toBe('not-allowed');
});

test('paints <body> with the theme baseline, and the canvas follows it', () => {
	render(<p>Short page</p>);
	const body = getComputedStyle(document.body);

	expect(body.margin).toBe('0px');
	expect(body.backgroundColor).toBe(resolvedColor(vars.color.surface.base));
	expect(body.color).toBe(resolvedColor(vars.color.text.primary));
	expect(body.accentColor).toBe(resolvedColor(vars.color.background.accent.solid.rest));
	const fontProbe = document.body.appendChild(document.createElement('span'));
	fontProbe.style.fontFamily = vars.font.body.fontFamily;
	added.push(fontProbe);
	expect(body.fontFamily).toBe(getComputedStyle(fontProbe).fontFamily);
	expect(Number.parseFloat(body.lineHeight)).toBeCloseTo(Number.parseFloat(body.fontSize) * 1.5, 1);
	// A transparent root lets the body background paint the canvas on short pages and overscroll.
	expect(getComputedStyle(document.documentElement).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('repaints <body> when the system colour mode changes', async () => {
	render(<p>System mode</p>);
	document.documentElement.removeAttribute('data-color-mode');

	await emulateColorScheme('light');
	const light = getComputedStyle(document.body).backgroundColor;
	await emulateColorScheme('dark');
	const dark = getComputedStyle(document.body).backgroundColor;

	expect(dark).not.toBe(light);
	expect(dark).toBe(resolvedColor(vars.color.surface.base));
});

test('lets application CSS override the document baseline', () => {
	render(<p>Overridden</p>);
	addStyle('body { background-color: rgb(1, 2, 3); color: rgb(4, 5, 6); margin: 8px; }');
	const body = getComputedStyle(document.body);

	expect(body.backgroundColor).toBe('rgb(1, 2, 3)');
	expect(body.color).toBe('rgb(4, 5, 6)');
	expect(body.margin).toBe('8px');
});

test('draws the native focus ring in the scope colour, by keyboard and programmatic focus', async () => {
	const { container } = render(
		<div data-color-mode="dark" data-testid="scope">
			<button data-testid="first" type="button">
				First
			</button>
			<button data-testid="second" type="button">
				Second
			</button>
		</div>,
	);
	const scope = byTestId(container, 'scope');
	const first = byTestId(container, 'first');

	await userEvent.tab();
	expect(first).toHaveFocus();
	const ring = getComputedStyle(first);
	expect(ring.outlineStyle).toBe('solid');
	expect(ring.outlineWidth).toBe('2px');
	expect(ring.outlineOffset).toBe('2px');
	expect(ring.outlineColor).toBe(resolvedColor(vars.color.border.focus, scope));
	expect(ring.outlineColor).not.toBe(resolvedColor(vars.color.border.focus));

	// After keyboard use, a scripted focus move keeps showing the ring.
	byTestId(container, 'second').focus();
	expect(getComputedStyle(byTestId(container, 'second')).outlineStyle).toBe('solid');
});

test('draws no ring for a pointer focus', async () => {
	const { container } = render(<button type="button">Clicked</button>);
	const button = container.querySelector('button')!;

	await userEvent.click(button);

	expect(button).toHaveFocus();
	expect(getComputedStyle(button).outlineStyle).toBe('none');
});

test('uses the system highlight for the ring in forced colours', async () => {
	const { container } = render(<button type="button">Forced</button>);
	await emulateForcedColors('active');

	await userEvent.tab();

	const button = container.querySelector('button')!;
	expect(getComputedStyle(button).outlineColor).toBe(resolvedColor('Highlight'));
});

const items = [
	{ id: 'one', label: 'Option one' },
	{ id: 'two', label: 'Option two' },
];

const wrappedControls = [
	{ control: <CheckboxField label="Checkbox" />, name: 'CheckboxField' },
	{
		control: (
			<SelectField items={items} label="Select">
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		),
		name: 'SelectField',
	},
	{
		control: (
			<ComboboxField defaultItems={items} label="Combobox">
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		),
		name: 'ComboboxField',
	},
];

for (const { control, name } of wrappedControls) {
	test(`shows exactly one ring for ${name}, whose wrapper carries data-focus-visible`, async () => {
		const { container } = render(control);

		await userEvent.tab();

		// React Aria marks a wrapper as well as the focused element.
		expect(container.querySelectorAll('[data-focus-visible="true"]').length).toBeGreaterThan(0);
		expect(visibleRings(container)).toHaveLength(1);
	});
}

test('shows virtual focus on a list box item without a second ring', async () => {
	// Padding keeps the trigger-width popover inside the narrow test frame. An overflowing popover
	// would scroll the page, and React Aria closes popovers on scroll.
	const { container } = render(
		<div style={{ padding: '1rem' }}>
			<ComboboxField defaultItems={items} label="Combobox">
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		</div>,
	);
	const input = page.getByRole('combobox').element();

	await userEvent.tab();
	await userEvent.keyboard('{ArrowDown}');
	const option = page.getByRole('option', { name: 'Option one' });
	await expect.element(option).toHaveAttribute('data-focus-visible', 'true');

	// DOM focus stays on the input, so the option shows focus with its background alone.
	expect(input).toHaveFocus();
	expect(input).toHaveAttribute('aria-activedescendant', option.element().id);
	expect(getComputedStyle(option.element()).outlineStyle).toBe('none');
	expect(getComputedStyle(option.element()).backgroundColor).not.toBe(
		getComputedStyle(page.getByRole('option', { name: 'Option two' }).element()).backgroundColor,
	);
	expect(visibleRings(container)).toHaveLength(1);
});

test('leaves application animations and Luke UI feedback running under reduced motion', async () => {
	addStyle(`
@keyframes app-spin { to { rotate: 1turn; } }
.app-animated { animation: app-spin 1s linear infinite; transition: opacity 0.5s; }
`);
	const { container } = render(
		<div>
			<div className="app-animated" data-testid="app" />
			<Button data-testid="luke-button">Save</Button>
			<LoadingSpinner aria-label="Loading" />
		</div>,
	);
	await emulateReducedMotion(true);

	const app = getComputedStyle(byTestId(container, 'app'));
	expect(app.animationName).toBe('app-spin');
	expect(app.transitionDuration).toBe('0.5s');
	expect(getComputedStyle(byTestId(container, 'luke-button')).transitionDuration).not.toBe('0s');
	// The spinner keeps turning, so a busy state still reads as busy.
	expect(getComputedStyle(page.getByLabelText('Loading').element()).animationName).not.toBe('none');
});

for (const appearance of visualAppearances) {
	test(`mixed host: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator } = render(<MixedHost />, { appearance });

		await captureVisualAppearance(locator, 'global-styles/mixed-host', appearance);
	});
}
