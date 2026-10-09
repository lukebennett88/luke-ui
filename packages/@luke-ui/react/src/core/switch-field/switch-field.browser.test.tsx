import { Strong } from '@luke-ui/react/strong';
import { SwitchField } from '@luke-ui/react/switch-field';
import { Text } from '@luke-ui/react/text';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { getTextStart, measureFieldError } from '../test-utils/measure-field-error.js';
import { flatAppearances, render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';

function SwitchScene() {
	return (
		<Stack>
			<SwitchField label="Off" name="off" />
			<SwitchField defaultSelected label="On" name="on" />
			<SwitchField isDisabled label="Disabled off" name="disabled-off" />
			<SwitchField defaultSelected isDisabled label="Disabled on" name="disabled-on" />
			<SwitchField
				errorMessage="Turn this on to continue."
				label="Invalid off"
				name="invalid-off"
			/>
			<SwitchField
				defaultSelected
				errorMessage="Choose another setting."
				label="Invalid on"
				name="invalid-on"
			/>
			<SwitchField
				description="Receive updates by email."
				label="Email notifications"
				name="description-small"
				size="small"
			/>
			<SwitchField
				defaultSelected
				description="Receive updates by email."
				label="Email notifications"
				name="description-medium"
			/>
			<SwitchField
				description="Receive updates by email."
				label="Email notifications"
				name="description-large"
				size="large"
			/>
			<Text elementType="div" typography="heading3">
				<SwitchField
					label="heading3: This label wraps to show that the track aligns with its first line."
					name="text-heading3"
				/>
			</Text>
		</Stack>
	);
}

/** The input for a switch, found by its accessible name. */
function switchInput(name: string): HTMLInputElement {
	const element = page.getByRole('switch', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a switch "${name}".`);
	return element;
}

/** The native `<label>` that holds a switch's control and label text. */
function labelFor(input: HTMLInputElement): HTMLLabelElement {
	const label = input.closest('label');
	if (label == null) throw new Error('Expected the switch input inside a label.');
	return label;
}

/** The track inside a switch's label. */
function controlFor(input: HTMLInputElement): HTMLElement {
	const control = labelFor(input).querySelector('[aria-hidden="true"]');
	if (!(control instanceof HTMLElement)) throw new Error('Expected the switch control.');
	return control;
}

test('SwitchField resolves ref to the root, inputRef to the input, and joins a form', async () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	render(
		<form data-testid="form">
			<SwitchField inputRef={inputRef} label="Notifications" name="notifications" ref={ref} />
			<SwitchField
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				label="Callback"
				name="callback"
				value="yes"
			/>
		</form>,
	);
	const input = switchInput('Notifications');
	const form = page.getByTestId('form').element();
	if (!(form instanceof HTMLFormElement)) throw new Error('Expected a form.');

	expect(ref.current?.tagName).toBe('DIV');
	expect(ref.current?.contains(input)).toBe(true);
	expect(inputRef.current).toBe(input);
	expect(callbackResolved.at(-1)).toBe(switchInput('Callback'));
	expect(new FormData(form).get('callback')).toBe(null);

	await userEvent.click(page.getByText('Callback', { exact: true }));

	expect(new FormData(form).get('callback')).toBe('yes');
});

test('SwitchField puts id on its root element and inputId on the input', () => {
	render(
		<SwitchField
			className="example-root"
			description="Example description"
			id="example-root"
			inputId="example-input"
			label="Example switch"
			name="example"
		/>,
	);
	const input = switchInput('Example switch');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(getDescribedText(input)).toBe('Example description');
});

test('SwitchField renders the track before its label, inside the clickable label', async () => {
	render(<SwitchField label="Notifications" />);
	const input = switchInput('Notifications');

	expect(controlFor(input).nextSibling?.textContent).toBe('Notifications');

	await userEvent.click(page.getByText('Notifications'));

	expect(input).toBeChecked();
});

test('SwitchField renders Luke UI typography inside its label', () => {
	render(
		<SwitchField
			label={
				<>
					Enable <Strong>notifications</Strong>
				</>
			}
		/>,
	);

	expect(switchInput('Enable notifications')).toBeInTheDocument();
});

test('SwitchField toggles from the keyboard', async () => {
	render(<SwitchField label="Notifications" />);
	const input = switchInput('Notifications');

	await userEvent.keyboard('{Tab}');

	expect(input).toHaveFocus();

	await userEvent.keyboard(' ');

	expect(input).toBeChecked();
});

test('SwitchField supports uncontrolled and controlled selection', async () => {
	const changes: Array<boolean> = [];
	render(
		<>
			<SwitchField defaultSelected label="Uncontrolled" />
			<SwitchField
				isSelected={false}
				label="Controlled"
				onChange={(isSelected) => changes.push(isSelected)}
			/>
		</>,
	);

	await userEvent.click(page.getByText('Uncontrolled', { exact: true }));
	await userEvent.click(page.getByText('Controlled', { exact: true }));

	expect(switchInput('Uncontrolled')).not.toBeChecked();
	expect(changes).toEqual([true]);
	expect(switchInput('Controlled')).not.toBeChecked();
});

test('a disabled or read-only SwitchField keeps its selection', async () => {
	const changes: Array<boolean> = [];
	render(
		<>
			<SwitchField isDisabled label="Disabled" onChange={(value) => changes.push(value)} />
			<SwitchField isReadOnly label="Read only" onChange={(value) => changes.push(value)} />
		</>,
	);

	expect(switchInput('Disabled')).toBeDisabled();

	await userEvent.click(page.getByText('Read only'));

	expect(switchInput('Read only')).not.toBeChecked();
	expect(changes).toEqual([]);
});

// The marker is CSS content with no DOM node, so the accessible name is how the tests observe it.
test('a required SwitchField marks its label with its necessityIndicator', () => {
	render(
		<>
			<SwitchField isRequired label="Switch icon" />
			<SwitchField isRequired label="Switch words" necessityIndicator="label" />
			<SwitchField label="Optional" />
		</>,
	);

	expect(switchInput('Switch icon*')).toBeInTheDocument();
	expect(switchInput('Switch words(required)')).toBeInTheDocument();
	expect(switchInput('Optional')).toHaveAccessibleName('Optional');
});

test('an errorMessage marks the switch invalid and shows the error under the label', () => {
	render(<SwitchField errorMessage="Turn this on to continue." label="Notifications" />);
	const input = switchInput('Notifications');
	const error = page.getByText('Turn this on to continue.').element();

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(input)).toBe('Turn this on to continue.');
	expect(error.getBoundingClientRect().top).toBeGreaterThanOrEqual(
		labelFor(input).getBoundingClientRect().bottom,
	);
});

test('an empty errorMessage leaves the switch valid', () => {
	render(<SwitchField errorMessage="" label="Notifications" />);

	expect(switchInput('Notifications')).not.toHaveAttribute('aria-invalid');
});

test('a required SwitchField shows its native validation message after a failed submit', async () => {
	render(
		<form>
			<SwitchField isRequired label="Notifications" name="notifications" />
			<button type="submit">Submit</button>
		</form>,
	);
	const input = switchInput('Notifications*');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
});

test('SwitchField runs a validate function', async () => {
	render(
		<form>
			<SwitchField
				label="Notifications"
				validate={(isSelected) => (isSelected ? null : 'Turn this on to continue.')}
			/>
			<button type="submit">Submit</button>
		</form>,
	);
	const input = switchInput('Notifications');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(input)).toBe('Turn this on to continue.');
});

test('SwitchField size changes the track size', () => {
	render(
		<>
			<SwitchField label="Small" size="small" />
			<SwitchField label="Medium" />
			<SwitchField label="Large" size="large" />
		</>,
	);
	const small = controlFor(switchInput('Small')).getBoundingClientRect().width;
	const medium = controlFor(switchInput('Medium')).getBoundingClientRect().width;
	const large = controlFor(switchInput('Large')).getBoundingClientRect().width;

	expect(small).toBeLessThan(medium);
	expect(medium).toBeLessThan(large);
});

// The error hangs at the label's inline edge at every size, not under the track.
for (const size of ['small', 'medium', 'large'] as const) {
	test(`the ${size} SwitchField error text starts at the label text`, () => {
		const errorMessage =
			'Turn this on to continue. This message wraps onto a second line to check its alignment.';
		const { container } = render(
			<Stack width="16rem">
				<SwitchField errorMessage={errorMessage} label="Notifications" size={size} />
			</Stack>,
		);

		const measurement = measureFieldError(page.getByText(errorMessage).element());
		const labelStart = getTextStart(container, 'Notifications');

		expect(measurement.firstLineStart).toBeCloseTo(labelStart, 0);
		expect(measurement.secondLineStart).toBeCloseTo(labelStart, 0);
	});
}

test('the SwitchField scene has no axe violations', async () => {
	const { container } = render(
		<>
			<SwitchScene />
			<SwitchField isRequired label="Required" necessityIndicator="label" />
		</>,
	);

	await expectNoAxeViolations(container);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<SwitchScene />, { appearance });
		await captureVisualAppearance(locator, 'switch-field/kitchen-sink', appearance);
	}
});

// Only `danger.solid.rest` carries the 3:1 control-boundary guarantee, so an invalid switch must
// keep it through hover and press, whether it is on or off.
for (const isSelected of [false, true]) {
	for (const state of ['data-hovered', 'data-pressed'] as const) {
		test(`an invalid ${isSelected ? 'on' : 'off'} switch keeps the guaranteed border with ${state}`, () => {
			const { locator } = render(
				<SwitchField defaultSelected={isSelected} errorMessage="Required" label="Accept" />,
			);
			const label = locator.getByRole('switch', { name: 'Accept' }).element().closest('label');
			const track = label?.querySelector<HTMLElement>('[aria-hidden="true"]');
			if (label == null || track == null) throw new Error('Expected the switch track.');
			track.style.transition = 'none';
			label.setAttribute(state, 'true');

			expect(getComputedStyle(track).borderTopColor).toBe(
				resolvedBorderColor(label, 'var(--luke-color-background-danger-solid-rest)'),
			);
		});
	}
}

// The off thumb on the off track is a guaranteed 3:1 pair. Pressing must not recolour the thumb.
test('a pressed off switch keeps the thumb on the field surface', () => {
	const { locator } = render(<SwitchField label="Notify" />);
	const label = locator.getByRole('switch', { name: 'Notify' }).element().closest('label');
	const thumb = label?.querySelector<HTMLElement>('[aria-hidden="true"] > span');
	if (label == null || thumb == null) throw new Error('Expected the switch thumb.');
	thumb.style.transition = 'none';
	const resting = getComputedStyle(thumb).backgroundColor;
	label.setAttribute('data-pressed', 'true');

	expect(getComputedStyle(thumb).backgroundColor).toBe(resting);
	expect(resting).toBe(resolvedBackgroundColor(label, 'var(--luke-color-surface-field)'));
});

// Pressing stretches the thumb instead of recolouring it, so the press shows without materials and
// the thumb keeps its guaranteed contrast with the track.
for (const isSelected of [false, true]) {
	test(`pressing an ${isSelected ? 'on' : 'off'} switch stretches its thumb until release`, async () => {
		render(<SwitchField defaultSelected={isSelected} label="Notify" />);
		const input = switchInput('Notify');
		const thumb = controlFor(input).querySelector('span');
		if (!(thumb instanceof HTMLElement)) throw new Error('Expected the switch thumb.');
		thumb.style.transition = 'none';
		const restingWidth = thumb.getBoundingClientRect().width;
		const restingColor = getComputedStyle(thumb).backgroundColor;

		input.focus();
		await userEvent.keyboard('[Space>]');
		await expect.element(labelFor(input)).toHaveAttribute('data-pressed', 'true');

		expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth);
		expect(getComputedStyle(thumb).backgroundColor).toBe(restingColor);

		await userEvent.keyboard('[/Space]');
		await expect.element(labelFor(input)).not.toHaveAttribute('data-pressed');

		expect(thumb.getBoundingClientRect().width).toBe(restingWidth);
	});
}

// Regression: rest, hover, and pressed must stay distinct without materials, which the flat fixture
// removes. Hover recolours the track. Pressed recolours an on track and stretches the thumb, which
// keeps its guaranteed colour. Off, the stretch alone tells pressed from hover.
test('rest, hover, and pressed stay distinct without materials', { tags: ['visual'] }, async () => {
	for (const appearance of flatAppearances) {
		const { locator } = render(
			<Stack>
				{(['rest', 'hover', 'pressed'] as const).flatMap((state) => [
					<SwitchField key={`off-${state}`} label={`Off, ${state}`} />,
					<SwitchField defaultSelected key={`on-${state}`} label={`On, ${state}`} />,
				])}
			</Stack>,
			{ appearance },
		);
		for (const state of ['hover', 'pressed'] as const) {
			for (const name of [`Off, ${state}`, `On, ${state}`]) {
				const label = locator.getByRole('switch', { name }).element().closest('label');
				label?.setAttribute(state === 'hover' ? 'data-hovered' : 'data-pressed', 'true');
			}
		}
		await captureVisualAppearance(locator, 'switch-field/interaction-states', appearance);
	}
});

test('necessity markers', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack>
			<SwitchField isRequired label="Enable notifications" name="icon" />
			<SwitchField
				isRequired
				label="Enable notifications"
				name="label"
				necessityIndicator="label"
			/>
			<SwitchField
				errorMessage="Turn this on to continue."
				isRequired
				label="Enable notifications"
				name="invalid"
			/>
			<SwitchField
				isRequired
				label="This required label wraps onto a second line so the marker sits after its last word."
				name="wrapping"
			/>
		</Stack>,
	);
	await captureVisual(locator, 'switch-field/necessity-markers');
});

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(<SwitchField label="Focus me" />);
	await focusViaKeyboard(page.getByRole('switch', { name: 'Focus me' }));
	await captureVisual(locator, 'switch-field/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<SwitchField label="Off" name="off" />
				<SwitchField defaultSelected label="On" name="on" />
				<SwitchField defaultSelected isDisabled label="Disabled" name="disabled" />
				<SwitchField errorMessage="Turn this on to continue." label="Invalid" name="invalid" />
				<SwitchField
					defaultSelected
					errorMessage="Choose another setting."
					label="Invalid on"
					name="invalid-on"
				/>
			</Stack>,
		);
		await captureVisual(locator, 'switch-field/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

/** Resolves a colour the way the browser would for a border, in the same theme scope. */
function resolvedBorderColor(scope: Element, color: string): string {
	const probe = scope.appendChild(document.createElement('span'));
	probe.style.borderTop = `1px solid ${color}`;
	const resolved = getComputedStyle(probe).borderTopColor;
	probe.remove();
	return resolved;
}

/** Resolves a colour the way the browser would for a background, in the same theme scope. */
function resolvedBackgroundColor(scope: Element, color: string): string {
	const probe = scope.appendChild(document.createElement('span'));
	probe.style.backgroundColor = color;
	const resolved = getComputedStyle(probe).backgroundColor;
	probe.remove();
	return resolved;
}
