import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Field } from '@luke-ui/react/primitives/field';
import type { SelectRootProps } from '@luke-ui/react/primitives/select';
import {
	SelectIndicator,
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '@luke-ui/react/primitives/select';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { createRef } from 'react';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import { SelectContext } from 'react-aria-components/Select';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import { setInteractionState, settledSurfaceColors } from '../../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
	Stack,
} from '../../test-utils/visual.js';
import { waitForOverlayEnter } from '../../test-utils/wait-for-overlay-enter.js';

type ExampleSelectProps = SelectRootProps & {
	description?: ReactNode;
	errorMessage?: ReactNode;
	label: string;
};

function ExampleSelect(props: ExampleSelectProps) {
	const { description, errorMessage, label, ...rootProps } = props;

	return (
		<SelectRoot {...rootProps}>
			<Field description={description} errorMessage={errorMessage} label={label}>
				<SelectTrigger>
					<SelectValue />
					<SelectIndicator />
				</SelectTrigger>
				<SelectPopover>
					<SelectListBox>
						<SelectItem id="one">Example one</SelectItem>
						<SelectItem id="two">Example two</SelectItem>
						<SelectItem id="three">Example three</SelectItem>
					</SelectListBox>
				</SelectPopover>
			</Field>
		</SelectRoot>
	);
}

function SelectScene() {
	return (
		<Stack>
			<ExampleSelect label="Resting" placeholder="Choose an option" />
			<ExampleSelect defaultValue="two" description="Example description" label="With a value" />
			<ExampleSelect
				defaultValue="two"
				errorMessage="Choose a different option."
				isInvalid
				label="Invalid"
			/>
			<ExampleSelect isInvalid label="Invalid, no message" placeholder="Choose an option" />
			<ExampleSelect defaultValue="two" isDisabled label="Disabled" />
			<ExampleSelect isDisabled label="Disabled empty" />
			<ExampleSelect defaultValue="two" label="Small" size="small" />
			<ExampleSelect
				defaultValue="two"
				errorMessage="Choose a different option."
				isInvalid
				label="Invalid small"
				size="small"
			/>
			<ExampleSelect isRequired label="Required" name="required" placeholder="Choose an option" />
		</Stack>
	);
}

function trigger(name: RegExp | string): HTMLButtonElement {
	const element = page.getByRole('button', { name }).element();
	if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected a button named ${name}.`);
	return element;
}

/** The label that names a trigger, outside the trigger itself. */
function labelFor(element: HTMLButtonElement): HTMLElement {
	const label = element
		.getAttribute('aria-labelledby')
		?.split(' ')
		.map((id) => document.getElementById(id))
		.find((candidate) => candidate != null && !element.contains(candidate));
	if (label == null) throw new Error('Expected a label for the trigger.');
	return label;
}

/** The hidden native `<select>` React Aria renders in a select root for form submission. */
function nativeSelect(rootId: string): HTMLSelectElement {
	const select = document.getElementById(rootId)?.querySelector('select');
	if (select == null) throw new Error(`Expected a native select in "${rootId}".`);
	return select;
}

test('SelectRoot puts id and ref on its root element, and triggerId and the trigger ref on the button', () => {
	const rootRef = createRef<HTMLDivElement>();
	const triggerRef = createRef<HTMLButtonElement>();
	render(
		<SelectRoot
			aria-label="Example field"
			className="example-root"
			id="example-root"
			ref={rootRef}
			triggerId="example-trigger"
		>
			<SelectTrigger ref={triggerRef}>
				<SelectValue />
			</SelectTrigger>
			<SelectPopover>
				<SelectListBox>
					<SelectItem id="one">Example one</SelectItem>
				</SelectListBox>
			</SelectPopover>
		</SelectRoot>,
	);
	const element = trigger(/Example field/);
	const root = document.getElementById('example-root');

	expect(element.id).toBe('example-trigger');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(element)).toBe(true);
	expect(rootRef.current).toBe(root);
	expect(triggerRef.current).toBe(element);
});

test('a SelectRoot is wired to its label and description with no manual ids', async () => {
	render(
		<ExampleSelect defaultValue="two" description="Example description" label="Example field" />,
	);

	// The trigger is named by its value and its label.
	await expect
		.element(page.getByRole('button', { exact: true, name: 'Example two Example field' }))
		.toBeVisible();
	expect(getDescribedText(trigger(/Example field/))).toBe('Example description');
});

// The marker is hidden from assistive technology, so the label's text shows it and the name does not.
test('a FieldLabel marks a required SelectRoot', () => {
	render(
		<>
			<ExampleSelect id="required-root" isRequired label="Required" />
			<ExampleSelect id="optional-root" label="Optional" />
		</>,
	);

	// The trigger is a button, so the hidden native select carries the required state.
	expect(nativeSelect('required-root')).toBeRequired();
	expect(labelFor(trigger(/Required/)).textContent).toBe('Required\u00A0*');
	expect(nativeSelect('optional-root')).not.toBeRequired();
	expect(labelFor(trigger(/Optional/)).textContent).toBe('Optional');
});

test('SelectIndicator shows a chevron and sets data-open while open, and children replace the chevron', async () => {
	render(
		<>
			<ExampleSelect label="Default indicator" />
			<SelectRoot aria-label="Custom indicator">
				<SelectTrigger>
					<SelectValue />
					<SelectIndicator className="example-indicator">
						<Icon name="add" />
					</SelectIndicator>
				</SelectTrigger>
				<SelectPopover>
					<SelectListBox>
						<SelectItem id="one">Example one</SelectItem>
					</SelectListBox>
				</SelectPopover>
			</SelectRoot>
		</>,
	);
	const chevron = trigger(/Default indicator/).querySelector('span[aria-hidden]:last-child');
	const custom = trigger(/Custom indicator/).querySelector('.example-indicator');
	if (!(chevron instanceof HTMLElement) || !(custom instanceof HTMLElement)) {
		throw new Error('Expected both indicators.');
	}

	expect(chevron.querySelector('svg')).not.toBeNull();
	expect(chevron).toHaveAttribute('data-default', 'true');
	expect(chevron).not.toHaveAttribute('data-open');
	expect(custom.querySelector('use')?.getAttribute('href')).toContain('add');
	expect(custom.querySelectorAll('svg')).toHaveLength(1);
	expect(custom).not.toHaveAttribute('data-default');

	await userEvent.click(trigger(/Default indicator/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	expect(chevron).toHaveAttribute('data-open', 'true');

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	expect(chevron).not.toHaveAttribute('data-open');

	await userEvent.click(trigger(/Custom indicator/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	expect(custom).toHaveAttribute('data-open', 'true');
});

test('SelectValue shows the root placeholder, then the selected value', async () => {
	render(<ExampleSelect label="Example field" placeholder="Choose an option" />);
	const element = trigger(/Example field/);

	expect(element.querySelector('[data-placeholder]')).toHaveTextContent('Choose an option');

	await userEvent.click(element);
	await userEvent.click(page.getByRole('option', { name: 'Example three' }));

	expect(element.querySelector('[data-placeholder]')).toBeNull();
	expect(element).toHaveTextContent('Example three');
});

for (const appearance of visualAppearances) {
	test(`an open Select trigger shows the hover finish, and pressed still wins, in ${appearance.theme} ${appearance.mode}`, async () => {
		const { unmount } = render(<ExampleSelect label="Delivery" />, { appearance });
		const element = trigger(/Delivery/);
		setInteractionState(element, 'hover');
		const hover = settledFinish(element);
		setInteractionState(element, 'pressed');
		const pressed = settledFinish(element);
		expect(pressed).not.toEqual(hover);

		await userEvent.click(element);
		await expect.element(page.getByRole('listbox')).toBeVisible();
		setInteractionState(element, 'rest');
		expect(settledFinish(element)).toEqual(hover);
		setInteractionState(element, 'pressed');
		expect(settledFinish(element)).toEqual(pressed);

		await userEvent.keyboard('{Escape}');
		unmount();
	});
}

/** The trigger's painted finish once its state transitions finish. */
function settledFinish(element: HTMLElement) {
	settledSurfaceColors(element);
	const { backgroundColor, backgroundImage, boxShadow } = getComputedStyle(element);
	return { backgroundColor, backgroundImage, boxShadow };
}

for (const appearance of visualAppearances) {
	test(`Select chevron contrasts with its painted fill in ${appearance.theme} ${appearance.mode}`, async () => {
		const { unmount } = render(<ExampleSelect label="Delivery" />, { appearance });
		const element = trigger(/Delivery/);
		const indicator = element.querySelector<HTMLElement>('[aria-hidden]:last-child');
		if (!indicator) throw new Error('Expected a Select indicator.');
		const measurements: Record<string, number> = {};
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			setInteractionState(element, state);
			settledSurfaceColors(element);
			measurements[state] = await indicatorContrast(element, indicator);
		}
		setInteractionState(element, 'rest');
		await userEvent.click(element);
		await expect.element(page.getByRole('listbox')).toBeVisible();
		settledSurfaceColors(element);
		measurements.open = await indicatorContrast(element, indicator);
		for (const ratio of Object.values(measurements)) expect(ratio).toBeGreaterThanOrEqual(3);
		await userEvent.keyboard('{Escape}');
		unmount();
	});
}

async function indicatorContrast(element: HTMLElement, indicator: HTMLElement): Promise<number> {
	const svg = indicator.querySelector('svg');
	if (!svg) throw new Error('Expected a Select chevron.');
	const color = getComputedStyle(indicator).color;
	svg.style.visibility = 'hidden';
	let screenshot: string;
	try {
		screenshot = await page.screenshot({ element, save: false });
	} finally {
		svg.style.visibility = '';
	}
	const image = await createImageBitmap(
		await (await fetch(`data:image/png;base64,${screenshot}`)).blob(),
	);
	const context = new OffscreenCanvas(image.width, image.height).getContext('2d');
	if (!context) throw new Error('Expected a canvas context.');
	context.drawImage(image, 0, 0);
	const pixels = context.getImageData(0, 0, image.width, image.height);
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const foreground = luminance(context.getImageData(0, 0, 1, 1).data);
	const bounds = element.getBoundingClientRect();
	const rect = indicator.getBoundingClientRect();
	const scale = image.width / bounds.width;
	let lowest = Infinity;
	for (
		let y = Math.floor((rect.top - bounds.top) * scale);
		y < Math.ceil((rect.bottom - bounds.top) * scale);
		y++
	) {
		for (
			let x = Math.floor((rect.left - bounds.left) * scale);
			x < Math.ceil((rect.right - bounds.left) * scale);
			x++
		) {
			const offset = (y * image.width + x) * 4;
			const background = luminance(pixels.data.subarray(offset, offset + 3));
			lowest = Math.min(
				lowest,
				(Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
			);
		}
	}
	return lowest;
}

function luminance(rgb: Uint8ClampedArray): number {
	const channels = Array.from(rgb.slice(0, 3), (byte) => {
		const channel = byte / 255;
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

for (const [name, placeholder, expected] of [
	['omitted', undefined, 'Select an item'],
	['empty', '', 'Select an item'],
	['whitespace', '   ', 'Select an item'],
	['provided', 'Choose delivery', 'Choose delivery'],
] as const) {
	test(`SelectValue shows the ${name} placeholder`, () => {
		render(<ExampleSelect label="Delivery method" placeholder={placeholder} />);
		expect(trigger(/Delivery method/).querySelector('[data-placeholder]')).toHaveTextContent(
			expected,
		);
	});
}

for (const [name, inherited, local, expected] of [
	['blank context', '  ', undefined, 'Select an item'],
	['blank local override', 'Context placeholder', '', 'Select an item'],
	['whitespace local override', 'Context placeholder', '  ', 'Select an item'],
	['context placeholder', 'Context placeholder', undefined, 'Context placeholder'],
	['local placeholder', 'Context placeholder', 'Local placeholder', 'Local placeholder'],
] as const) {
	test(`SelectValue resolves ${name}`, () => {
		render(
			<SelectContext.Provider value={{ slots: { delivery: { placeholder: inherited } } }}>
				<ExampleSelect label="Delivery" placeholder={local} slot="delivery" />
			</SelectContext.Provider>,
		);
		expect(trigger(/Delivery/).querySelector('[data-placeholder]')).toHaveTextContent(expected);
	});
}

test('a blank local placeholder uses the localised fallback instead of context', () => {
	render(
		<I18nProvider locale="fr-FR">
			<SelectContext.Provider value={{ placeholder: 'Context placeholder' }}>
				<ExampleSelect label="Livraison" placeholder="" />
			</SelectContext.Provider>
		</I18nProvider>,
	);
	expect(trigger(/Livraison/).querySelector('[data-placeholder]')).toHaveTextContent(
		'Sélectionner un élément',
	);
});

test('SelectValue preserves custom children with an empty placeholder', () => {
	render(
		<SelectRoot aria-label="Delivery method" placeholder="">
			<SelectTrigger>
				<SelectValue>Custom value</SelectValue>
			</SelectTrigger>
		</SelectRoot>,
	);
	expect(trigger(/Delivery method/)).toHaveTextContent('Custom value');
});

test('a SelectRoot reports validity on the root and describes the trigger with the error', () => {
	render(
		<>
			<ExampleSelect defaultValue="one" label="Valid" />
			<ExampleSelect defaultValue="one" errorMessage="Example error" isInvalid label="Invalid" />
		</>,
	);
	const valid = trigger(/Valid/);
	const invalid = trigger(/Invalid/);

	expect(invalid).toHaveAccessibleDescription('Example error');
	expect(valid).toHaveAccessibleDescription('');
	// The error icon is hidden from assistive technology, so the name is the value and the label.
	expect(invalid).toHaveAccessibleName('Example one Invalid');
	// ARIA has no `aria-invalid` for a button, so the root carries the semantic state.
	expect(invalid).not.toHaveAttribute('aria-invalid');
	expect(invalid.closest('[data-invalid="true"]')).not.toBeNull();
	expect(valid.closest('[data-invalid="true"]')).toBeNull();
});

// Block size is the layout contract for `size`.
test('SelectRoot sets the size of the trigger and of the items', async () => {
	render(
		<>
			<ExampleSelect label="Medium" />
			<ExampleSelect label="Small" size="small" />
		</>,
	);

	expect(trigger(/Small/).getBoundingClientRect().height).toBeLessThan(
		trigger(/Medium/).getBoundingClientRect().height,
	);

	await userEvent.click(trigger(/Medium/));
	const mediumItem = page.getByRole('option', { name: 'Example one' }).element();
	const mediumHeight = mediumItem.getBoundingClientRect().height;
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();

	await userEvent.click(trigger(/Small/));
	const smallItem = page.getByRole('option', { name: 'Example one' }).element();

	expect(smallItem.getBoundingClientRect().height).toBeLessThan(mediumHeight);
});

// React Aria provides slotted `Text` context inside a select, and `Text` throws without a slot.
// The bounded fix clears it for the trigger, so ordinary `Text` renders in every text-holding part.
test('Text renders inside SelectTrigger, SelectValue, and SelectItem', async () => {
	render(
		<SelectRoot aria-label="Example field" defaultValue="one">
			<SelectTrigger>
				<Text>Trigger text</Text>
				<SelectValue>
					<Text>Value text</Text>
				</SelectValue>
				<SelectIndicator />
			</SelectTrigger>
			<SelectPopover>
				<SelectListBox>
					<SelectItem id="one" textValue="Example one">
						<Text>Item text</Text>
					</SelectItem>
					<SelectItem id="two" textValue="Example two">
						<Text>Another item</Text>
					</SelectItem>
				</SelectListBox>
			</SelectPopover>
		</SelectRoot>,
	);
	const element = trigger(/Example field/);

	expect(element.textContent).toContain('Trigger text');
	expect(element.textContent).toContain('Value text');

	await userEvent.click(element);
	await expect.element(page.getByRole('option', { name: 'Item text' })).toBeVisible();
	expect(page.getByRole('option', { name: 'Another item' }).element()).toBeTruthy();
});

test('the Select scene has no axe violations', async () => {
	const { container } = render(<SelectScene />);

	await expectNoAxeViolations(container);
});

test('an open select has no axe violations', async () => {
	const { container } = render(<ExampleSelect defaultValue="two" label="Example field" />);

	await userEvent.click(trigger(/Example field/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await waitForOverlayEnter(
		page.getByRole('listbox').element().closest('[data-trigger]') ?? document.body,
	);

	await expectNoAxeViolations(container);
	await expectNoAxeViolations(document.body);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<SelectScene />, { appearance });
		await captureVisualAppearance(locator, 'select/kitchen-sink', appearance);
	}
});

test('open popover', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { unmount } = render(
			<Grid columns={2}>
				<ExampleSelect defaultValue="two" label="Example field" />
				<Button aria-expanded="true" aria-haspopup="listbox">
					Expanded button
				</Button>
			</Grid>,
			{ appearance },
		);

		await userEvent.click(trigger(/Example field/));
		const listbox = page.getByRole('listbox').element();
		await waitForOverlayEnter(listbox.closest('[data-trigger]') ?? listbox);
		await captureVisual(
			page.elementLocator(document.body),
			`select/open-${appearance.theme}-${appearance.mode}`,
		);
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		unmount();
	}
});

test('custom indicator stays unrotated while open', { tags: ['visual'] }, async () => {
	render(
		<SelectRoot aria-label="Custom indicator">
			<SelectTrigger>
				<SelectValue />
				<SelectIndicator>
					<Icon name="arrowRight" />
				</SelectIndicator>
			</SelectTrigger>
			<SelectPopover>
				<SelectListBox>
					<SelectItem id="one">Example one</SelectItem>
				</SelectListBox>
			</SelectPopover>
		</SelectRoot>,
	);
	await userEvent.click(trigger(/Custom indicator/));
	const listbox = page.getByRole('listbox').element();
	await waitForOverlayEnter(listbox.closest('[data-trigger]') ?? listbox);
	await captureVisual(page.elementLocator(document.body), 'select/custom-indicator-open');
});

test('focused and open triggers', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack>
			<ExampleSelect defaultValue="two" label="Focused" />
			<ExampleSelect
				defaultValue="two"
				errorMessage="Choose a different option."
				isInvalid
				label="Invalid focused"
			/>
		</Stack>,
	);

	await focusViaKeyboard(page.getByRole('button', { name: /Focused/ }));
	await captureVisual(locator, 'select/focused');
	await userEvent.tab();
	await expect.element(page.getByRole('button', { name: /Invalid focused/ })).toHaveFocus();
	await captureVisual(locator, 'select/invalid-focused');
});

test('invalid hovered trigger', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack>
			<ExampleSelect label="Empty" placeholder="Choose an option" />
			<ExampleSelect isDisabled label="Disabled empty" placeholder="Choose an option" />
			<ExampleSelect defaultValue="two" label="Chosen" />
			<ExampleSelect
				defaultValue="two"
				errorMessage="Choose a different option."
				isInvalid
				label="Invalid"
			/>
		</Stack>,
		{ appearance: { mode: 'light', theme: 'paper' } },
	);
	await userEvent.hover(trigger(/Invalid/));
	await captureVisual(locator, 'select/invalid-hovered');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<ExampleSelect label="Default" placeholder="Choose an option" />
				<ExampleSelect defaultValue="two" isDisabled label="Disabled" />
				<ExampleSelect
					defaultValue="two"
					errorMessage="Choose a different option."
					isInvalid
					label="Invalid"
				/>
			</Stack>,
		);
		await captureVisual(locator, 'select/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});

// The active option opts out of forced colours, and so does everything inside it. Its own label
// would vanish behind the backplate, and nested content would keep author colours on the fill.
test('forced-colors open popover', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		render(
			<Stack>
				<SelectRoot defaultValue="two">
					<Field label="Example field">
						<SelectTrigger>
							<SelectValue />
							<SelectIndicator />
						</SelectTrigger>
						<SelectPopover>
							<SelectListBox>
								<SelectItem id="one">Example one</SelectItem>
								<SelectItem id="two" textValue="Example two">
									<Text>Example two</Text>
									<Text color="secondary" typography="caption">
										Example description <Kbd>Enter</Kbd>
									</Text>
								</SelectItem>
								<SelectItem id="three">Example three</SelectItem>
							</SelectListBox>
						</SelectPopover>
					</Field>
				</SelectRoot>
			</Stack>,
		);

		await focusViaKeyboard(page.getByRole('button', { name: /Example field/ }));
		await userEvent.keyboard('{ArrowDown}');
		const listbox = page.getByRole('listbox').element();
		await waitForOverlayEnter(listbox.closest('[data-trigger]') ?? listbox);
		await expect.element(page.getByRole('option', { name: /Example two/ })).toHaveFocus();
		await captureVisual(page.elementLocator(document.body), 'select/forced-colors-open');

		await userEvent.keyboard('{ArrowUp}');
		await expect.element(page.getByRole('option', { name: 'Example one' })).toHaveFocus();
		await captureVisual(page.elementLocator(document.body), 'select/forced-colors-open-active');
	} finally {
		await emulateForcedColors('none');
	}
});
