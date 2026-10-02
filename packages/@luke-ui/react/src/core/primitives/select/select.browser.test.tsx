import { Icon } from '@luke-ui/react/icon';
import { Field } from '@luke-ui/react/primitives/field';
import {
	SelectIndicator,
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '@luke-ui/react/primitives/select';
import type { SelectRootProps } from '@luke-ui/react/primitives/select';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { createRef } from 'react';
import type { Key } from 'react-aria-components/Select';
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

test('SelectRoot puts id on its root element and triggerId on the trigger button', () => {
	render(
		<ExampleSelect
			className="example-root"
			id="example-root"
			label="Example field"
			triggerId="example-trigger"
		/>,
	);
	const element = trigger(/Example field/);
	const root = document.getElementById('example-root');

	expect(element.id).toBe('example-trigger');
	expect(root).toHaveClass('example-root');
	expect(root?.tagName).toBe('DIV');
	expect(root?.contains(element)).toBe(true);
});

test('SelectRoot generates a trigger id and forwards ref to the root element', () => {
	const ref = createRef<HTMLDivElement>();
	render(<ExampleSelect id="example-root" label="Example field" ref={ref} />);

	expect(trigger(/Example field/).id).not.toBe('');
	expect(ref.current).toBe(document.getElementById('example-root'));
});

test('SelectTrigger forwards ref to the button', () => {
	const ref = createRef<HTMLButtonElement>();
	render(
		<SelectRoot aria-label="Example field">
			<SelectTrigger ref={ref}>
				<SelectValue />
			</SelectTrigger>
			<SelectPopover>
				<SelectListBox>
					<SelectItem id="one">Example one</SelectItem>
				</SelectListBox>
			</SelectPopover>
		</SelectRoot>,
	);

	expect(ref.current).toBe(trigger(/Example field/));
});

test('a SelectRoot is wired to its label and description with no manual ids', async () => {
	render(
		<ExampleSelect defaultValue="two" description="Example description" label="Example field" />,
	);

	// The trigger is named by its value and its label.
	await expect
		.element(page.getByRole('button', { name: 'Example two Example field', exact: true }))
		.toBeVisible();
	expect(getDescribedText(trigger(/Example field/))).toBe('Example description');
});

test('a select opens, selects, and closes by keyboard', async () => {
	const changes: Array<Key | null> = [];
	render(
		<ExampleSelect
			label="Example field"
			onChange={(next) => changes.push(next)}
			placeholder="Choose"
		/>,
	);
	const element = trigger(/Example field/);

	await focusViaKeyboard(page.getByRole('button', { name: /Example field/ }));
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await userEvent.keyboard('{ArrowDown}');
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();

	expect(changes).toEqual(['two']);
	expect(element).toHaveTextContent('Example two');
	expect(document.activeElement).toBe(element);
});

test('a select closes without changing the value on Escape', async () => {
	const changes: Array<Key | null> = [];
	render(
		<ExampleSelect
			defaultValue="one"
			label="Example field"
			onChange={(next) => changes.push(next)}
		/>,
	);

	await userEvent.click(trigger(/Example field/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();

	expect(changes).toEqual([]);
});

test('SelectIndicator reflects the open state with data-open', async () => {
	render(<ExampleSelect label="Example field" />);
	const indicator = trigger(/Example field/).querySelector('span[aria-hidden]:last-child');
	if (!(indicator instanceof HTMLElement)) throw new Error('Expected the indicator.');

	expect(indicator).not.toHaveAttribute('data-open');
	expect(indicator.querySelector('svg')).not.toBeNull();

	await userEvent.click(trigger(/Example field/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	expect(indicator).toHaveAttribute('data-open', 'true');

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	expect(indicator).not.toHaveAttribute('data-open');
});

test('SelectIndicator children replace the chevron and keep data-open', async () => {
	render(
		<SelectRoot aria-label="Example field">
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
		</SelectRoot>,
	);
	const indicator = trigger(/Example field/).querySelector('.example-indicator');
	if (!(indicator instanceof HTMLElement)) throw new Error('Expected the indicator.');

	expect(indicator.querySelectorAll('svg')).toHaveLength(1);
	expect(indicator.querySelector('use')?.getAttribute('href')).toContain('add');
	expect(indicator).not.toHaveAttribute('data-open');

	await userEvent.click(trigger(/Example field/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	expect(indicator).toHaveAttribute('data-open', 'true');
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

test('an invalid SelectTrigger keeps its block size and its description while open', async () => {
	render(
		<>
			<ExampleSelect label="Valid" />
			<ExampleSelect errorMessage="Example error" isInvalid label="Invalid" />
		</>,
	);
	const valid = trigger(/Valid/);
	const invalid = trigger(/Invalid/);

	expect(invalid.getBoundingClientRect().height).toBe(valid.getBoundingClientRect().height);

	await userEvent.click(invalid);
	await expect.element(page.getByRole('listbox')).toBeVisible();

	expect(invalid.getBoundingClientRect().height).toBe(valid.getBoundingClientRect().height);
	expect(invalid).toHaveAccessibleDescription('Example error');
});

test('a disabled invalid SelectRoot still disables the trigger', () => {
	render(<ExampleSelect isDisabled isInvalid label="Example field" />);

	expect(trigger(/Example field/)).toBeDisabled();
});

// Block size is the layout contract for `size`.
test('SelectRoot sets the size of the trigger', () => {
	render(
		<>
			<ExampleSelect label="Medium" />
			<ExampleSelect label="Small" size="small" />
		</>,
	);
	const medium = trigger(/Medium/).getBoundingClientRect().height;
	const small = trigger(/Small/).getBoundingClientRect().height;

	expect(small).toBeLessThan(medium);
});

test('SelectItem takes its size from SelectRoot', async () => {
	render(
		<>
			<ExampleSelect label="Medium" />
			<ExampleSelect label="Small" size="small" />
		</>,
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

test('the selected item content renders in SelectValue', () => {
	render(
		<SelectRoot aria-label="Example field" defaultValue="one">
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectPopover>
				<SelectListBox>
					<SelectItem id="one" textValue="Example one">
						<Text>Item text</Text>
					</SelectItem>
				</SelectListBox>
			</SelectPopover>
		</SelectRoot>,
	);

	expect(trigger(/Example field/)).toHaveTextContent('Item text');
});

test('a SelectRoot participates in FormData through name', async () => {
	const { container } = render(
		<form aria-label="Example form">
			<ExampleSelect defaultValue="one" label="Example field" name="example" />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	// React Aria renders a hidden native select that carries the value.
	expect(form.querySelector('select[name="example"]')).not.toBeNull();
	expect(new FormData(form).get('example')).toBe('one');

	await userEvent.click(trigger(/Example field/));
	await userEvent.click(page.getByRole('option', { name: 'Example three' }));

	expect(new FormData(form).get('example')).toBe('three');
});

test('a SelectRoot associates with a form through form', () => {
	const { container } = render(
		<>
			<form aria-label="Example form" id="example-form" />
			<ExampleSelect defaultValue="two" form="example-form" label="Example field" name="example" />
		</>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(new FormData(form).get('example')).toBe('two');
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
