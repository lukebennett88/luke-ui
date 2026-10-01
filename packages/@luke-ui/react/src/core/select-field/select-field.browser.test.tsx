import { Button } from '@luke-ui/react/button';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { createRef, useState } from 'react';
import type { Key } from 'react-aria-components/Select';
import { expect, test } from 'vite-plus/test';
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

/** Whether the trigger draws its CSS invalid icon, which has no DOM node. */
function hasTriggerIcon(element: HTMLElement): boolean {
	return getComputedStyle(element, '::after').content !== 'none';
}

/** Whether an error message linked to the trigger draws its leading icon. */
function hasMessageIcon(element: HTMLElement): boolean {
	const describedBy = element.getAttribute('aria-describedby') ?? '';
	return describedBy
		.split(' ')
		.flatMap((id) => document.getElementById(id) ?? [])
		.some((message) => getComputedStyle(message, '::before').display !== 'none');
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

test('SelectField merges aria-describedby with its own description', () => {
	render(
		<>
			<span id="external-hint">External hint</span>
			<SelectField
				aria-describedby="external-hint"
				description="Own description"
				items={themeItems}
				label="Example field"
			>
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(getDescribedText(trigger(/Example field/))).toBe('Own description External hint');
});

test('SelectField points aria-describedby at external hint text without a description', () => {
	render(
		<>
			<span id="external-hint">External hint</span>
			<SelectField aria-describedby="external-hint" items={themeItems} label="Example field">
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(getDescribedText(trigger(/Example field/))).toBe('External hint');
});

test('SelectField marks a required field with an icon or a label', () => {
	render(
		<>
			<SelectField isRequired items={themeItems} label="Icon field">
				{renderThemeItem}
			</SelectField>
			<SelectField isRequired items={themeItems} label="Text field" necessityIndicator="label">
				{renderThemeItem}
			</SelectField>
			<SelectField items={themeItems} label="Optional field">
				{renderThemeItem}
			</SelectField>
		</>,
	);
	const marker = (text: string) => {
		const label = page.getByText(text, { exact: true }).element();
		return getComputedStyle(label, '::after').content;
	};

	expect(marker('Icon field')).toBe('"*"');
	expect(marker('Text field')).toBe('"(required)"');
	expect(marker('Optional field')).toBe('none');
});

test('an errorMessage marks the field invalid with one icon, inside the trigger', () => {
	render(
		<>
			<SelectField items={themeItems} label="Valid">
				{renderThemeItem}
			</SelectField>
			<SelectField errorMessage="Example error" items={themeItems} label="Invalid">
				{renderThemeItem}
			</SelectField>
		</>,
	);
	const valid = trigger(/Valid/);
	const invalid = trigger(/Invalid/);

	expect(getDescribedText(invalid)).toBe('Example error');
	expect(invalid.closest('[data-invalid="true"]')).not.toBeNull();
	expect(valid.closest('[data-invalid="true"]')).toBeNull();
	expect(hasTriggerIcon(valid)).toBe(false);
	expect(hasTriggerIcon(invalid)).toBe(true);
	expect(hasMessageIcon(invalid)).toBe(false);
});

test('an empty errorMessage leaves the field valid', () => {
	render(
		<>
			<SelectField errorMessage="" items={themeItems} label="Empty">
				{renderThemeItem}
			</SelectField>
			<SelectField errorMessage={false} items={themeItems} label="False">
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(trigger(/Empty/).closest('[data-invalid="true"]')).toBeNull();
	expect(trigger(/False/).closest('[data-invalid="true"]')).toBeNull();
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
	expect(hasTriggerIcon(trigger(/Theme/))).toBe(true);

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	await expect.poll(() => trigger(/Theme/).closest('[data-invalid="true"]')).toBeNull();
	expect(new FormData(form).get('theme')).toBe('dark');
});

test('SelectField runs validate and shows its message', async () => {
	render(
		<SelectField
			items={themeItems}
			label="Theme"
			validate={(key) => (key === 'dark' ? 'Dark is unavailable.' : null)}
			validationBehavior="aria"
		>
			{renderThemeItem}
		</SelectField>,
	);

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	await expect.poll(() => getDescribedText(trigger(/Theme/))).toBe('Dark is unavailable.');
	expect(trigger(/Theme/).closest('[data-invalid="true"]')).not.toBeNull();

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Light' }));

	await expect.poll(() => getDescribedText(trigger(/Theme/))).toBe('');
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
		<SelectField
			items={themeItems}
			label="Theme"
			onChange={(next) => changes.push(next)}
			value="light"
		>
			{renderThemeItem}
		</SelectField>,
	);

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	expect(changes).toEqual(['dark']);
	expect(trigger(/Theme/)).toHaveTextContent('Light');
});

test('a SelectField keeps in step with state that follows onChange', async () => {
	function Controlled() {
		const [value, setValue] = useState<Key | null>('light');

		return (
			<SelectField items={themeItems} label="Theme" onChange={setValue} value={value}>
				{renderThemeItem}
			</SelectField>
		);
	}
	render(<Controlled />);

	await userEvent.click(trigger(/Theme/));
	await userEvent.click(page.getByRole('option', { name: 'Dark' }));

	await expect.element(page.getByRole('button', { name: /Theme/ })).toHaveTextContent('Dark');
});

test('a SelectField with value null shows the placeholder', () => {
	render(
		<SelectField items={themeItems} label="Theme" placeholder="Choose a theme" value={null}>
			{renderThemeItem}
		</SelectField>,
	);

	expect(trigger(/Theme/)).toHaveTextContent('Choose a theme');
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

test('SelectField resolves object and callback triggerRefs', () => {
	const objectRef = createRef<HTMLButtonElement>();
	const callbackResolved: Array<HTMLButtonElement | null> = [];
	render(
		<>
			<SelectField items={themeItems} label="Object ref" triggerRef={objectRef}>
				{renderThemeItem}
			</SelectField>
			<SelectField
				items={themeItems}
				label="Callback ref"
				triggerRef={(node) => {
					callbackResolved.push(node);
				}}
			>
				{renderThemeItem}
			</SelectField>
		</>,
	);

	expect(objectRef.current).toBe(trigger(/Object ref/));
	expect(callbackResolved.at(-1)).toBe(trigger(/Callback ref/));
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

test('a disabled SelectField disables the trigger and submits no value', () => {
	const { container } = render(
		<form aria-label="Theme form">
			<SelectField defaultValue="light" isDisabled items={themeItems} label="Theme" name="theme">
				{renderThemeItem}
			</SelectField>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(trigger(/Theme/)).toBeDisabled();
	expect(new FormData(form).get('theme')).toBeNull();
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
