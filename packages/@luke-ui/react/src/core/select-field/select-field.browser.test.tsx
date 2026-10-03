import { Button } from '@luke-ui/react/button';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { act, createRef, useState } from 'react';
import type { Key } from 'react-aria-components/Select';
import { expect, onTestFinished, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	Stack,
} from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

type ThemeItem = {
	id: string;
	label: string;
};

const themeItems: Array<ThemeItem> = [
	{ id: 'system', label: 'System' },
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' },
];

const renderThemeItem = (item: ThemeItem) => <SelectItem>{item.label}</SelectItem>;

function trigger(name: RegExp | string): HTMLButtonElement {
	const element = page.getByRole('button', { name }).element();
	if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected a button named ${name}.`);
	return element;
}

function SelectFieldScene() {
	return (
		<Stack>
			<SelectField items={themeItems} label="Resting" name="resting" placeholder="Choose a theme">
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				description="Choose how the app looks."
				items={themeItems}
				label="With a description"
				name="described"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				errorMessage="Choose a different theme."
				items={themeItems}
				label="Invalid"
				name="invalid"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				isDisabled
				items={themeItems}
				label="Disabled"
				name="disabled"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField defaultValue="light" items={themeItems} label="Small" name="small" size="small">
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				errorMessage="Choose a different theme."
				items={themeItems}
				label="Invalid small"
				name="invalid-small"
				size="small"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField
				isRequired
				items={themeItems}
				label="Required"
				name="required"
				placeholder="Choose a theme"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField
				isRequired
				items={themeItems}
				label="Required with a label"
				name="required-label"
				necessityIndicator="label"
				placeholder="Choose a theme"
			>
				{renderThemeItem}
			</SelectField>
		</Stack>
	);
}

test('SelectField names the trigger from a visible label, aria-label, or aria-labelledby', () => {
	render(
		<>
			<SelectField items={themeItems} label="Visible label">
				{renderThemeItem}
			</SelectField>
			<SelectField aria-label="Hidden label" items={themeItems}>
				{renderThemeItem}
			</SelectField>
			<span id="external-label">External label</span>
			<SelectField aria-labelledby="external-label" items={themeItems}>
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(trigger(/Visible label/)).toBeTruthy();
	expect(trigger(/Hidden label/)).toBeTruthy();
	expect(trigger(/External label/)).toBeTruthy();
	// An externally named field draws no label of its own.
	expect(page.getByText('Hidden label').elements()).toHaveLength(0);
});

test('SelectField adds aria-describedby to its own description', () => {
	render(
		<>
			<span id="external-hint">External hint</span>
			<SelectField
				aria-describedby="external-hint"
				description="Own description"
				items={themeItems}
				label="With a description"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField aria-describedby="external-hint" items={themeItems} label="Without one">
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(getDescribedText(trigger(/With a description/))).toBe('Own description External hint');
	expect(getDescribedText(trigger(/Without one/))).toBe('External hint');
});

// The marker follows the last word of the label, so the accessible name has no space before it.
test('SelectField marks a required field with an icon or a label', () => {
	render(
		<>
			<SelectField defaultValue="light" isRequired items={themeItems} label="Icon field">
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				isRequired
				items={themeItems}
				label="Text field"
				necessityIndicator="label"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField defaultValue="light" items={themeItems} label="Optional field">
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(trigger(/Icon field/)).toHaveAccessibleName('Light Icon field*');
	expect(trigger(/Text field/)).toHaveAccessibleName('Light Text field(required)');
	expect(trigger(/Optional field/)).toHaveAccessibleName('Light Optional field');
});

test('an errorMessage marks the field invalid and describes the trigger with the error', () => {
	render(
		<>
			<SelectField defaultValue="light" items={themeItems} label="Valid">
				{renderThemeItem}
			</SelectField>
			<SelectField
				defaultValue="light"
				errorMessage="Example error"
				items={themeItems}
				label="Invalid"
			>
				{renderThemeItem}
			</SelectField>
		</>,
	);
	const valid = trigger(/Valid/);
	const invalid = trigger(/Invalid/);

	expect(invalid).toHaveAccessibleDescription('Example error');
	expect(invalid.closest('[data-invalid="true"]')).not.toBeNull();
	expect(valid).toHaveAccessibleDescription('');
	expect(valid.closest('[data-invalid="true"]')).toBeNull();
	// The error icon is hidden from assistive technology, so the message does not change the name.
	expect(invalid).toHaveAccessibleName('Light Invalid');
});

test('an isRequired SelectField shows the native message after a failed submit', async () => {
	const { container } = render(
		<form aria-label="Theme form">
			<SelectField isRequired items={themeItems} label="Theme" name="theme">
				{renderThemeItem}
			</SelectField>
			<Button type="submit">Save</Button>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	expect(trigger(/Theme/).closest('[data-invalid="true"]')).toBeNull();

	await userEvent.click(page.getByRole('button', { name: 'Save' }));

	await expect.poll(() => getDescribedText(trigger(/Theme/)).length).toBeGreaterThan(0);
	expect(trigger(/Theme/).closest('[data-invalid="true"]')).not.toBeNull();

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	await expect.poll(() => trigger(/Theme/).closest('[data-invalid="true"]')).toBeNull();
	expect(new FormData(form).get('theme')).toBe('dark');
});

test('an uncontrolled SelectField starts from defaultValue and reports Key | null', async () => {
	const changes: Array<Key | null> = [];
	render(
		<SelectField
			defaultValue="light"
			items={themeItems}
			label="Theme"
			onChange={(next) => changes.push(next)}
		>
			{renderThemeItem}
		</SelectField>,
	);

	expect(trigger(/Theme/)).toHaveTextContent('Light');

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	expect(changes).toEqual(['dark']);
	expect(trigger(/Theme/)).toHaveTextContent('Dark');
});

test('a controlled SelectField follows value and calls onChange without moving itself', async () => {
	const changes: Array<Key | null> = [];
	render(
		<>
			<SelectField
				items={themeItems}
				label="Theme"
				onChange={(next) => changes.push(next)}
				value="light"
			>
				{renderThemeItem}
			</SelectField>
			<SelectField items={themeItems} label="Empty" placeholder="Choose a theme" value={null}>
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(trigger(/Empty/)).toHaveTextContent('Choose a theme');

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	expect(changes).toEqual(['dark']);
	expect(trigger(/Theme/)).toHaveTextContent('Light');
});

test('SelectField accepts static SelectItem children', async () => {
	render(
		<SelectField defaultValue="b" label="Letter">
			<SelectItem id="a">Letter A</SelectItem>
			<SelectItem id="b">Letter B</SelectItem>
		</SelectField>,
	);

	expect(trigger(/Letter/)).toHaveTextContent('Letter B');

	await userEvent.click(trigger(/Letter/));
	await expect.element(page.getByRole('option', { name: 'Letter A' })).toBeVisible();
});

test('SelectField resolves ref to the root element and triggerRef to the trigger', () => {
	const ref = createRef<HTMLDivElement>();
	const triggerRef = createRef<HTMLButtonElement>();
	const callbackRoots: Array<HTMLDivElement | null> = [];
	const callbackTriggers: Array<HTMLButtonElement | null> = [];
	render(
		<>
			<SelectField
				id="example-root"
				items={themeItems}
				label="Object refs"
				ref={ref}
				triggerRef={triggerRef}
			>
				{renderThemeItem}
			</SelectField>
			<SelectField
				items={themeItems}
				label="Callback refs"
				ref={(node) => {
					callbackRoots.push(node);
				}}
				triggerRef={(node) => {
					callbackTriggers.push(node);
				}}
			>
				{renderThemeItem}
			</SelectField>
		</>,
	);
	const element = trigger(/Object refs/);
	const callbackTrigger = trigger(/Callback refs/);

	expect(ref.current).toBe(document.getElementById('example-root'));
	expect(ref.current?.contains(element)).toBe(true);
	expect(triggerRef.current).toBe(element);
	expect(callbackRoots.at(-1)?.contains(callbackTrigger)).toBe(true);
	expect(callbackRoots.at(-1)).not.toBe(ref.current);
	expect(callbackTriggers.at(-1)).toBe(callbackTrigger);
});

test('SelectField puts id on its root element and triggerId on the trigger', () => {
	render(
		<SelectField
			className="example-root"
			id="example-root"
			items={themeItems}
			label="Example field"
			triggerId="example-trigger"
		>
			{renderThemeItem}
		</SelectField>,
	);
	const element = trigger(/Example field/);
	const root = document.getElementById('example-root');

	expect(element.id).toBe('example-trigger');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(element)).toBe(true);
});

test('a SelectField participates in FormData through name and form', async () => {
	const { container } = render(
		<>
			<form aria-label="Theme form" id="theme-form" />
			<SelectField
				defaultValue="light"
				form="theme-form"
				items={themeItems}
				label="Theme"
				name="theme"
			>
				{renderThemeItem}
			</SelectField>
		</>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(new FormData(form).get('theme')).toBe('light');

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	expect(new FormData(form).get('theme')).toBe('dark');
});

test("a pending SelectField keeps focus but can't open or change", async () => {
	const changes: Array<Key | null> = [];

	// React Aria announces the pending change with a message that points at the trigger by id.
	// Remove it so the message doesn't outlive the trigger.
	onTestFinished(() => {
		for (const message of document.querySelectorAll('[data-live-announcer] [role="img"]')) {
			message.remove();
		}
	});

	function Fixture() {
		const [isPending, setIsPending] = useState(false);
		return (
			<>
				<SelectField
					defaultValue="light"
					isPending={isPending}
					items={themeItems}
					label="Theme"
					onChange={(next) => changes.push(next)}
				>
					{renderThemeItem}
				</SelectField>
				<button onClick={() => setIsPending((value) => !value)} type="button">
					Toggle pending
				</button>
			</>
		);
	}

	render(<Fixture />);
	await userEvent.tab();
	expect(trigger(/Theme/)).toHaveFocus();

	// A programmatic click leaves focus on the trigger.
	const toggle = trigger('Toggle pending');
	act(() => toggle.click());

	expect(trigger(/Theme/)).toHaveFocus();
	expect(trigger(/Theme/).disabled).toBe(false);
	expect(trigger(/Theme/).tabIndex).toBe(0);

	for (const keys of ['{Enter}', ' ', '{ArrowDown}', 'd']) {
		await userEvent.keyboard(keys);
		expect(page.getByRole('listbox').elements()).toHaveLength(0);
	}
	// Playwright treats an aria-disabled button as not actionable, so force the click.
	await page.getByRole('button', { name: /Theme/ }).click({ force: true });
	expect(page.getByRole('listbox').elements()).toHaveLength(0);
	expect(changes).toEqual([]);
	expect(trigger(/Theme/)).toHaveTextContent('Light');
	expect(trigger(/Theme/)).toHaveFocus();

	act(() => toggle.click());

	expect(trigger(/Theme/)).toHaveFocus();
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByRole('listbox')).toBeVisible();
});

test('the SelectField scene has no axe violations', async () => {
	const { container } = render(<SelectFieldScene />);

	await expectNoAxeViolations(container);
});

test('an open SelectField has no axe violations', async () => {
	const { container } = render(
		<SelectField defaultValue="light" items={themeItems} label="Theme">
			{renderThemeItem}
		</SelectField>,
	);

	await userEvent.click(trigger(/Theme/));
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await waitForOverlayEnter(
		page.getByRole('listbox').element().closest('[data-trigger]') ?? document.body,
	);

	await expectNoAxeViolations(container);
	await expectNoAxeViolations(document.body);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<SelectFieldScene />, { appearance });
		await captureVisualAppearance(locator, 'select-field/kitchen-sink', appearance);
	}
});

test('open popover', { tags: ['visual'] }, async () => {
	render(
		<SelectField defaultValue="light" items={themeItems} label="Theme" name="theme">
			{renderThemeItem}
		</SelectField>,
	);

	await userEvent.click(trigger(/Theme/));
	const listbox = page.getByRole('listbox').element();
	await waitForOverlayEnter(listbox.closest('[data-trigger]') ?? listbox);
	await captureVisual(page.elementLocator(document.body), 'select-field/open');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(<SelectFieldScene />);
		await captureVisual(locator, 'select-field/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});
