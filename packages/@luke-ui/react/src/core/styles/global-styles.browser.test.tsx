import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { Heading } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import { Link } from '@luke-ui/react/link';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { SelectItem } from '@luke-ui/react/primitives/select';
import { SelectField } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
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
			{/* Luke UI text is trimmed to its glyphs, so layout components own the spacing. */}
			<Stack alignItems="start" gap="space.16" marginBlockStart="space.24">
				<Heading data-testid="luke-heading" level={2}>
					Luke UI heading
				</Heading>
				<Text data-testid="luke-text" elementType="p">
					Luke UI paragraph.
				</Text>
				<Button data-testid="luke-button">Luke UI button</Button>
			</Stack>
		</div>
	);
}

test('keeps native presentation for application markup', () => {
	const { container } = render(<MixedHost />);
	const bodyFontSize = Number.parseFloat(getComputedStyle(document.body).fontSize);

	const h1 = getComputedStyle(byTestId(container, 'native-h1'));
	expect(Number.parseFloat(h1.fontSize)).toBeGreaterThan(bodyFontSize);
	expect(h1.fontWeight).toBe('700');
	expect(h1.marginBlockStart).not.toBe('0px');
	// Unitless, so the wrapped heading's lines are spaced for its own size.
	expect(Number.parseFloat(h1.lineHeight)).toBeCloseTo(Number.parseFloat(h1.fontSize) * 1.5, 1);

	expect(getComputedStyle(byTestId(container, 'native-p')).marginBlockStart).toBe(
		`${bodyFontSize}px`,
	);
	expect(getComputedStyle(byTestId(container, 'native-blockquote')).marginInlineStart).not.toBe(
		'0px',
	);

	const ul = getComputedStyle(byTestId(container, 'native-ul'));
	expect(ul.listStyleType).toBe('disc');
	expect(ul.paddingInlineStart).not.toBe('0px');
	expect(getComputedStyle(byTestId(container, 'native-ol')).listStyleType).toBe('lower-alpha');

	expect(getComputedStyle(byTestId(container, 'native-table')).borderSpacing).not.toBe('0px');
	expect(getComputedStyle(byTestId(container, 'native-td')).paddingInlineStart).not.toBe('0px');

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
});

for (const size of ['medium', 'small'] as const) {
	test(`gives a ${size} Button, IconButton, and button Link one box model without user agent padding`, () => {
		const { locator } = render(
			<div>
				<Button size={size}>Save</Button>
				<IconButton aria-label="Add" icon="add" size={size} />
				<Link appearance="button" href="#save" size={size}>
					Save
				</Link>
			</div>,
		);
		const button = locator.getByRole('button', { name: 'Save' }).element();
		const iconButton = locator.getByRole('button', { name: 'Add' }).element();
		const link = locator.getByRole('link', { name: 'Save' }).element();

		for (const element of [button, iconButton, link]) {
			expect(getComputedStyle(element).paddingBlock).toBe('0px');
			expect(element.getBoundingClientRect().height).toBe(link.getBoundingClientRect().height);
		}
		expect(getComputedStyle(button).paddingInline).toBe(getComputedStyle(link).paddingInline);
		expect(getComputedStyle(iconButton).paddingInline).toBe('0px');
	});
}

test('paints <body> with the theme baseline, and the canvas follows it', () => {
	render(<p>Short page</p>);
	const body = getComputedStyle(document.body);

	expect(body.margin).toBe('0px');
	expect(body.backgroundColor).toBe(resolvedColor(vars.color.background.surface.base));
	expect(body.color).toBe(resolvedColor(vars.color.foreground.primary));
	expect(body.accentColor).toBe(resolvedColor(vars.color.background.accent.solid.rest));
	const fontProbe = document.body.appendChild(document.createElement('span'));
	fontProbe.style.fontFamily = vars.font.body.fontFamily;
	added.push(fontProbe);
	expect(body.fontFamily).toBe(getComputedStyle(fontProbe).fontFamily);
	expect(Number.parseFloat(body.lineHeight)).toBeCloseTo(Number.parseFloat(body.fontSize) * 1.5, 1);
	// A transparent root lets the body background paint the canvas on short pages and overscroll.
	expect(getComputedStyle(document.documentElement).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('sets text-size-adjust to 100% on the document root', () => {
	render(<p>Document root</p>);
	const root = getComputedStyle(document.documentElement);

	// Mobile Safari used to inflate text after docs dropped Tailwind Preflight. `100%` keeps the
	// authored size without disabling user zoom (`none` would). Chromium may report either the
	// standard or prefixed property name.
	const textSizeAdjust =
		root.getPropertyValue('text-size-adjust') || root.getPropertyValue('-webkit-text-size-adjust');
	expect(textSizeAdjust).toBe('100%');
});

test('repaints <body> when the system colour mode changes', async () => {
	render(<p>System mode</p>);
	document.documentElement.removeAttribute('data-color-mode');

	await emulateColorScheme('light');
	const light = getComputedStyle(document.body).backgroundColor;
	await emulateColorScheme('dark');
	const dark = getComputedStyle(document.body).backgroundColor;

	expect(dark).not.toBe(light);
	expect(dark).toBe(resolvedColor(vars.color.background.surface.base));
});

test('lets application CSS override the document baseline', () => {
	render(<p>Overridden</p>);
	addStyle('body { background-color: rgb(1, 2, 3); color: rgb(4, 5, 6); margin: 8px; }');
	const body = getComputedStyle(document.body);

	expect(body.backgroundColor).toBe('rgb(1, 2, 3)');
	expect(body.color).toBe('rgb(4, 5, 6)');
	expect(body.margin).toBe('8px');
});

test('draws the native focus ring in the scope colour', async () => {
	const { container } = render(
		<div data-color-mode="dark" data-testid="scope">
			<button data-testid="first" type="button">
				First
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
	expect(ring.outlineColor).toBe(resolvedColor(vars.color.focus, scope));
	expect(ring.outlineColor).not.toBe(resolvedColor(vars.color.focus));
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
	{ control: <TextInputField label="Text input" />, name: 'TextInputField' },
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

test('shows virtual focus on a list box item with an inset outline beside the input ring', async () => {
	const { container } = render(
		<ComboboxField defaultItems={items} label="Combobox">
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>,
	);
	const input = page.getByRole('combobox').element();

	await userEvent.tab();
	await userEvent.keyboard('{ArrowDown}');
	const option = page.getByRole('option', { name: 'Option one' });
	await expect.element(option).toHaveAttribute('data-focus-visible', 'true');

	// DOM focus stays on the input (its ring). The active option uses a solid fill plus an inset
	// outline, not a second global focus ring.
	expect(input).toHaveFocus();
	const optionStyles = getComputedStyle(option.element());
	expect(optionStyles.outlineStyle).toBe('solid');
	expect(optionStyles.outlineWidth).toBe('2px');
	expect(optionStyles.outlineOffset).toBe('-2px');
	expect(optionStyles.backgroundColor).not.toBe(
		getComputedStyle(page.getByRole('option', { name: 'Option two' }).element()).backgroundColor,
	);
	// `visibleRings` skips clipped popover content, so it still reports only the input ring.
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
		</div>,
	);
	await emulateReducedMotion(true);

	const app = getComputedStyle(byTestId(container, 'app'));
	expect(app.animationName).toBe('app-spin');
	expect(app.transitionDuration).toBe('0.5s');
	expect(getComputedStyle(byTestId(container, 'luke-button')).transitionDuration).not.toBe('0s');
});

test('keeps overlay fades without movement under reduced motion', async () => {
	render(
		<SelectField items={items} label="Select">
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>,
	);
	await emulateReducedMotion(true);

	await userEvent.click(page.getByRole('button', { name: /Select/ }));
	await expect.poll(() => document.querySelector('[data-trigger="Select"]')).not.toBeNull();
	const popover = document.querySelector('[data-trigger="Select"]')!;

	expect(getComputedStyle(popover).transitionProperty).toBe('opacity');
	expect(getComputedStyle(popover).translate).toBe('none');
});

const selectField = (
	<SelectField items={items} label="Select">
		{(item) => <SelectItem>{item.label}</SelectItem>}
	</SelectField>
);

const comboboxField = (
	<ComboboxField defaultItems={items} label="Combobox">
		{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
	</ComboboxField>
);

/** The open dropdown popover, once it has finished entering. */
async function findRestingPopover() {
	await expect.poll(() => document.querySelector('[data-placement]')).not.toBeNull();
	const popover = document.querySelector<HTMLElement>('[data-placement]')!;
	await expect.poll(() => popover.hasAttribute('data-entering')).toBe(false);
	await expect.poll(() => popover.getAnimations().length).toBe(0);
	return popover;
}

async function openSelectPopover() {
	render(selectField);
	await userEvent.click(page.getByRole('button', { name: /Select/ }));
	return findRestingPopover();
}

/** Reads a state's resolved values without waiting for the transition to run. */
function resolveState(popover: HTMLElement, attributes: Record<string, string>) {
	const previous = popover.style.transition;
	popover.style.transition = 'none';
	// React Aria owns `data-placement`, so put back whatever it had set rather than removing it.
	const original = Object.keys(attributes).map(
		(name) => [name, popover.getAttribute(name)] as const,
	);
	for (const [name, value] of Object.entries(attributes)) popover.setAttribute(name, value);
	const { opacity, translate } = getComputedStyle(popover);
	for (const [name, value] of original) {
		if (value === null) popover.removeAttribute(name);
		else popover.setAttribute(name, value);
	}
	popover.style.transition = previous;
	return { opacity, translate };
}

/** The hidden values each placement enters from, and the motion a popover opened any way shares. */
function expectEntryStyles(popover: HTMLElement) {
	const entering = (side: string) =>
		resolveState(popover, { 'data-entering': 'true', 'data-placement': side });
	expect(entering('bottom')).toEqual({ opacity: '0', translate: '0px -4px' });
	expect(entering('top')).toEqual({ opacity: '0', translate: '0px 4px' });
	expect(entering('left')).toEqual({ opacity: '0', translate: '4px' });
	expect(entering('right')).toEqual({ opacity: '0', translate: '-4px' });
	expect(getComputedStyle(popover).transitionProperty).toBe('opacity, translate');
}

test('slides a dropdown popover in from the side facing its trigger', async () => {
	const popover = await openSelectPopover();
	expectEntryStyles(popover);
	expect(resolveState(popover, { 'data-exiting': 'true', 'data-placement': 'top' }).translate).toBe(
		'0px 4px',
	);
});

test('slides a flipped dropdown popover in from below', async () => {
	// No room under the trigger, so React Aria flips the popover above it.
	render(<div style={{ paddingBlockStart: 'calc(100vh - 64px)' }}>{selectField}</div>);
	await userEvent.click(page.getByRole('button', { name: /Select/ }));
	const popover = await findRestingPopover();
	expect(popover.dataset.placement).toBe('top');

	expect(resolveState(popover, { 'data-entering': 'true' })).toEqual({
		opacity: '0',
		translate: '0px 4px',
	});
	expect(popover.dataset.placement).toBe('top');
	expect(popover.hasAttribute('data-entering')).toBe(false);
});

test('leaves a dropdown popover faster than it enters', async () => {
	const popover = await openSelectPopover();
	const seconds = (value: string) => Number.parseFloat(value.split(',')[0]!);
	const enter = seconds(getComputedStyle(popover).transitionDuration);
	popover.setAttribute('data-exiting', 'true');
	const exit = seconds(getComputedStyle(popover).transitionDuration);
	popover.removeAttribute('data-exiting');
	expect(enter).toBeGreaterThan(0);
	expect(exit).toBeGreaterThan(0);
	expect(exit).toBeLessThan(enter);
});

test('drops dropdown popover movement under reduced motion', async () => {
	await emulateReducedMotion(true);
	const popover = await openSelectPopover();
	const states: Array<Record<string, string>> = [
		{ 'data-entering': 'true' },
		{ 'data-exiting': 'true' },
	];
	for (const attributes of states) {
		expect(resolveState(popover, { ...attributes, 'data-placement': 'top' })).toEqual({
			opacity: '0',
			translate: 'none',
		});
	}
});

test('shows a dropdown popover fully when it reopens during its exit', async () => {
	await openSelectPopover();
	const trigger = page.getByRole('button', { name: /Select/ });
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => document.querySelector('[data-exiting]')).not.toBeNull();
	await userEvent.click(trigger);

	const popover = await findRestingPopover();
	expect(document.querySelectorAll('[data-placement]')).toHaveLength(1);
	expect(popover.hasAttribute('data-exiting')).toBe(false);
	expect(getComputedStyle(popover).opacity).toBe('1');
	expect(['none', '0px']).toContain(getComputedStyle(popover).translate);
});

/** Records the entry transitions that start on any dropdown popover until `stop` is called. */
function recordPopoverTransitions() {
	const started: Array<string> = [];
	const listener = (event: TransitionEvent) => {
		const target = event.target as Element;
		if (target.hasAttribute('data-placement')) started.push(event.propertyName);
	};
	document.addEventListener('transitionrun', listener, true);
	return {
		started,
		stop: () => document.removeEventListener('transitionrun', listener, true),
	};
}

/** The popover as soon as it exists, without waiting for any entry motion. */
async function findOpenedPopover() {
	await expect.poll(() => document.querySelector('[data-placement]')).not.toBeNull();
	return document.querySelector<HTMLElement>('[data-placement]')!;
}

function expectAppearsAtOnce(popover: HTMLElement) {
	expect(popover.dataset.openedBy).toBe('keyboard');
	expect(getComputedStyle(popover).opacity).toBe('1');
	expect(getComputedStyle(popover).translate).toBe('none');
	expect(popover.getAnimations()).toHaveLength(0);
	expect(getComputedStyle(popover).transitionDuration).toBe('0s');
	expect(resolveState(popover, { 'data-entering': 'true', 'data-placement': 'top' })).toEqual({
		opacity: '1',
		translate: 'none',
	});
}

test('animates a dropdown popover opened by pointer', async () => {
	const popover = await openSelectPopover();
	expect(popover.dataset.openedBy).toBe('pointer');
	expect(getComputedStyle(popover).transitionDuration).toBe('0.15s, 0.15s');
	expectEntryStyles(popover);
});

const keyboardOpenings = [
	{ key: '{Enter}', name: 'Enter' },
	{ key: ' ', name: 'Space' },
	{ key: '{ArrowDown}', name: 'ArrowDown' },
];

for (const { key, name } of keyboardOpenings) {
	test(`shows a Select opened with ${name} at once`, async () => {
		render(selectField);
		await userEvent.tab();
		await expect.element(page.getByRole('button', { name: /Select/ })).toHaveFocus();
		const recorder = recordPopoverTransitions();
		await userEvent.keyboard(key);
		const popover = await findOpenedPopover();
		expectAppearsAtOnce(popover);
		await expect.poll(() => popover.hasAttribute('data-entering')).toBe(false);
		recorder.stop();
		expect(recorder.started).toEqual([]);
	});
}

test('shows a Combobox opened by typing at once', async () => {
	render(comboboxField);
	await userEvent.tab();
	await expect.element(page.getByRole('combobox')).toHaveFocus();
	const recorder = recordPopoverTransitions();
	await userEvent.keyboard('o');
	const popover = await findOpenedPopover();
	expectAppearsAtOnce(popover);
	await expect.poll(() => popover.hasAttribute('data-entering')).toBe(false);
	recorder.stop();
	expect(recorder.started).toEqual([]);
});

test('shows a Combobox opened with ArrowDown at once', async () => {
	render(comboboxField);
	await userEvent.tab();
	await expect.element(page.getByRole('combobox')).toHaveFocus();
	await userEvent.keyboard('{ArrowDown}');
	expectAppearsAtOnce(await findOpenedPopover());
});

test('keeps a keyboard-opened dropdown popover instant and movement-free under reduced motion', async () => {
	await emulateReducedMotion(true);
	render(selectField);
	await userEvent.tab();
	await userEvent.keyboard('{Enter}');
	expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
	expectAppearsAtOnce(await findOpenedPopover());
});

test('shows a dropdown popover at once when a keyboard reopen interrupts its exit', async () => {
	const popover = await openSelectPopover();
	expect(popover.dataset.openedBy).toBe('pointer');
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => document.querySelector('[data-exiting]')).not.toBeNull();
	await expect.element(page.getByRole('button', { name: /Select/ })).toHaveFocus();
	await userEvent.keyboard('{Enter}');

	const reopened = await findOpenedPopover();
	await expect.poll(() => reopened.hasAttribute('data-exiting')).toBe(false);
	expect(document.querySelectorAll('[data-placement]')).toHaveLength(1);
	expectAppearsAtOnce(reopened);
});

test('animates a dropdown popover that a pointer reopens after a keyboard open', async () => {
	render(selectField);
	await userEvent.tab();
	await userEvent.keyboard('{Enter}');
	expectAppearsAtOnce(await findOpenedPopover());
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => document.querySelector('[data-placement]')).toBeNull();

	await userEvent.click(page.getByRole('button', { name: /Select/ }));
	const popover = await findRestingPopover();
	expect(popover.dataset.openedBy).toBe('pointer');
	expect(getComputedStyle(popover).transitionDuration).toBe('0.15s, 0.15s');
	expectEntryStyles(popover);
});

for (const appearance of visualAppearances) {
	test(`mixed host: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator } = render(<MixedHost />, { appearance });

		await captureVisualAppearance(locator, 'global-styles/mixed-host', appearance);
	});
}
