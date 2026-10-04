import { Icon } from '@luke-ui/react/icon';
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
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
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
	expect(chevron).not.toHaveAttribute('data-open');
	expect(custom.querySelector('use')?.getAttribute('href')).toContain('add');
	expect(custom.querySelectorAll('svg')).toHaveLength(1);

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
			<Stack>
				<ExampleSelect defaultValue="two" label="Example field" />
			</Stack>,
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
