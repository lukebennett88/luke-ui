import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Form } from '@luke-ui/react/form';
import {
	RadioControl,
	RadioGroupRoot,
	RadioIndicator,
	RadioLabel,
	RadioRoot,
} from '@luke-ui/react/primitives/radio';
import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { emulateReducedMotion } from '../test-utils/emulate-media.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render, visualAppearances, flatAppearances } from '../test-utils/render.js';
import { setInteractionState } from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	focusViaKeyboard,
	emulateForcedColors,
} from '../test-utils/visual.js';

function PlanOptions() {
	return (
		<>
			<RadioField description="For trying Luke UI." label="Starter" value="starter" />
			<RadioField description="For production apps." label="Pro" value="pro" />
			<RadioField isDisabled label="Unavailable" value="unavailable" />
		</>
	);
}

function RadioScene() {
	return (
		<Stack>
			<RadioGroup defaultValue="starter" label="Plan" name="plan">
				<RadioField description="For trying Luke UI." label="Starter" value="starter" />
				<RadioField description="For production apps." label="Pro" value="pro" />
				<RadioField isDisabled label="Unavailable" value="unavailable" />
			</RadioGroup>
			<RadioGroup errorMessage="Choose a billing period." label="Billing period" name="period">
				<RadioField label="Monthly" value="monthly" />
				<RadioField label="Yearly" value="yearly" />
			</RadioGroup>
		</Stack>
	);
}

test('a RadioGroup names the group and its options, and presents its description before options', () => {
	const { locator } = render(
		<RadioGroup description="Select one plan." label="Plan" name="plan">
			<PlanOptions />
		</RadioGroup>,
	);
	const group = locator.getByRole('radiogroup', { name: 'Plan' }).element();
	const description = page.getByText('Select one plan.').element();

	const starter = locator.getByRole('radio', { name: 'Starter' }).element();
	const pro = locator.getByRole('radio', { name: 'Pro' }).element();
	expect(getDescribedText(starter)).toContain('For trying Luke UI.');
	expect(getDescribedText(pro)).toContain('For production apps.');
	expect(group.getAttribute('aria-describedby')).toContain(description.id);
	const groupText = group.textContent ?? '';
	expect(groupText.indexOf('Select one plan.')).toBeLessThan(groupText.indexOf('Starter'));
});

test('a group can use aria-label or aria-labelledby instead of a visible label', () => {
	const { locator } = render(
		<>
			<RadioGroup aria-label="Plan preference" name="aria-label">
				<RadioField label="Starter" value="starter" />
			</RadioGroup>
			<h2 id="billing-heading">Billing period</h2>
			<RadioGroup aria-labelledby="billing-heading" name="aria-labelledby">
				<RadioField label="Monthly" value="monthly" />
			</RadioGroup>
		</>,
	);

	expect(locator.getByRole('radiogroup', { name: 'Plan preference' })).toBeInTheDocument();
	expect(locator.getByRole('radiogroup', { name: 'Billing period' })).toBeInTheDocument();
});

test('RadioGroup controls default selection and calls onChange when another option is chosen', async () => {
	const changes: Array<string> = [];
	const { locator } = render(
		<RadioGroup defaultValue="starter" label="Plan" onChange={(value) => changes.push(value)}>
			<RadioField label="Starter" value="starter" />
			<RadioField label="Pro" value="pro" />
		</RadioGroup>,
	);
	const starter = locator.getByRole('radio', { name: 'Starter' });
	const pro = locator.getByRole('radio', { name: 'Pro' });

	expect(starter).toBeChecked();
	expect(pro).not.toBeChecked();
	await userEvent.click(page.getByText('Pro'));
	expect(pro).toBeChecked();
	expect(changes).toEqual(['pro']);
});

test('controlled value only changes when the parent supplies the next value', async () => {
	const changes: Array<string> = [];
	const { locator, rerender } = render(
		<RadioGroup label="Plan" onChange={(value) => changes.push(value)} value="starter">
			<RadioField label="Starter" value="starter" />
			<RadioField label="Pro" value="pro" />
		</RadioGroup>,
	);

	await userEvent.click(page.getByText('Pro'));
	expect(changes).toEqual(['pro']);
	expect(locator.getByRole('radio', { name: 'Starter' })).toBeChecked();
	rerender(
		<RadioGroup label="Plan" onChange={(value) => changes.push(value)} value="pro">
			<RadioField label="Starter" value="starter" />
			<RadioField label="Pro" value="pro" />
		</RadioGroup>,
	);
	expect(locator.getByRole('radio', { name: 'Pro' })).toBeChecked();
});

test('the selected option submits its value under the group name', async () => {
	const { container } = render(
		<form>
			<RadioGroup defaultValue="starter" label="Plan" name="plan">
				<RadioField label="Starter" value="starter" />
				<RadioField label="Pro" value="pro" />
			</RadioGroup>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected a form.');

	expect(new FormData(form).get('plan')).toBe('starter');
});

test('arrow keys move, skip disabled options, and wrap through the group', async () => {
	const { locator } = render(
		<RadioGroup defaultValue="starter" label="Plan" name="plan">
			<RadioField label="Starter" value="starter" />
			<RadioField label="Pro" value="pro" />
			<RadioField isDisabled label="Enterprise" value="enterprise" />
		</RadioGroup>,
	);
	const starter = locator.getByRole('radio', { name: 'Starter' });
	await focusViaKeyboard(starter);
	await userEvent.keyboard('{ArrowDown}');

	expect(locator.getByRole('radio', { name: 'Pro' })).toBeChecked();
	expect(locator.getByRole('radio', { name: 'Pro' })).toHaveFocus();
	await userEvent.keyboard('{ArrowDown}');
	expect(starter).toBeChecked();
	expect(starter).toHaveFocus();
});

test('group validation shows one error and keeps the group description available', async () => {
	const { locator } = render(
		<form
			onSubmit={(event) => {
				event.preventDefault();
			}}
		>
			<RadioGroup
				defaultValue="monthly"
				description="Pick one billing period."
				isRequired
				label="Billing period"
				name="period"
				validate={(value) => (value === 'monthly' ? 'Choose a different billing period.' : null)}
			>
				<RadioField label="Monthly" value="monthly" />
				<RadioField label="Yearly" value="yearly" />
			</RadioGroup>
			<button type="submit">Continue</button>
		</form>,
	);
	const group = locator.getByRole('radiogroup', { name: 'Billing period' }).element();
	await userEvent.click(locator.getByRole('button', { name: 'Continue' }));

	await expect.poll(() => getDescribedText(group)).toContain('Choose a different billing period.');
	expect(group).toHaveAttribute('aria-invalid', 'true');
	expect(page.getByText('Pick one billing period.')).toBeInTheDocument();
	expect((group.textContent ?? '').split('Choose a different billing period.')).toHaveLength(2);
});

test('a non-empty errorMessage marks the group invalid; an empty one does not', () => {
	const { locator } = render(
		<>
			<RadioGroup errorMessage="Pick an option." label="Invalid" name="invalid">
				<RadioField label="One" value="one" />
			</RadioGroup>
			<RadioGroup errorMessage="" label="Valid" name="valid">
				<RadioField label="One" value="one" />
			</RadioGroup>
		</>,
	);

	expect(locator.getByRole('radiogroup', { name: 'Invalid' })).toHaveAttribute(
		'aria-invalid',
		'true',
	);
	expect(locator.getByRole('radiogroup', { name: 'Valid' })).not.toHaveAttribute('aria-invalid');
});

test('a required group marks the group and draws the configured necessity indicator', () => {
	const { locator } = render(
		<>
			<RadioGroup isRequired label="Required with asterisk" name="required-asterisk">
				<RadioField label="One" value="one" />
			</RadioGroup>
			<RadioGroup
				isRequired
				label="Required in words"
				name="required-words"
				necessityIndicator="required-label"
			>
				<RadioField label="One" value="one" />
			</RadioGroup>
			<RadioGroup label="Optional" name="optional">
				<RadioField label="One" value="one" />
			</RadioGroup>
		</>,
	);

	const requiredAsterisk = locator
		.getByRole('radiogroup', { name: 'Required with asterisk' })
		.element();
	const requiredWords = locator.getByRole('radiogroup', { name: 'Required in words' }).element();
	expect(requiredAsterisk.textContent).toContain('\u00a0*');
	expect(requiredWords.textContent).toContain('\u00a0(required)');
	expect(locator.getByRole('radiogroup', { name: 'Optional' })).toBeInTheDocument();
});

test('a group error paints every radio indicator with the shared danger border', () => {
	const { locator } = render(
		<RadioGroup defaultValue="one" errorMessage="Choose another option." label="Plan" name="plan">
			<RadioField label="One" value="one" />
			<RadioField label="Two" value="two" />
		</RadioGroup>,
	);
	const group = locator.getByRole('radiogroup', { name: 'Plan' }).element();
	const indicators = ['One', 'Two'].map((name) => {
		const radio = locator.getByRole('radio', { name }).element();
		const indicator = radio.closest('label')?.querySelector<HTMLElement>('[aria-hidden="true"]');
		if (indicator == null) throw new Error(`Expected the ${name} radio indicator.`);
		return getComputedStyle(indicator).borderTopColor;
	});

	expect(indicators[0]).toBe(indicators[1]);
	expect(indicators[0]).toBe(resolvedBorderColor(group, 'var(--luke-color-border-danger-strong)'));
});

test('a disabled group keeps every option disabled even when an option says isDisabled is false', async () => {
	const changes: Array<string> = [];
	const { locator } = render(
		<RadioGroup isDisabled label="Plan" name="plan" onChange={(value) => changes.push(value)}>
			<RadioField label="Starter" value="starter" />
			<RadioField isDisabled={false} label="Pro" value="pro" />
		</RadioGroup>,
	);
	const starter = locator.getByRole('radio', { name: 'Starter' });
	const pro = locator.getByRole('radio', { name: 'Pro' });

	expect(starter).toBeDisabled();
	expect(pro).toBeDisabled();
	expect(pro).not.toBeChecked();
	expect(changes).toEqual([]);
});

test('size resolves from option to group to Form to medium', () => {
	const { locator } = render(
		<>
			<Form controlSize="small">
				<RadioGroup label="Group inherits Form" name="form">
					<RadioField label="Inherited small" value="small" />
				</RadioGroup>
				<RadioGroup label="Group overrides Form" name="group" size="medium">
					<RadioField label="Group medium" value="medium" />
					<RadioField label="Option small" size="small" value="small" />
				</RadioGroup>
			</Form>
			<RadioGroup label="Standalone default" name="default">
				<RadioField label="Default medium" value="medium" />
			</RadioGroup>
		</>,
	);
	const indicatorSize = (name: string) => {
		const radio = locator.getByRole('radio', { name }).element();
		const indicator = radio.closest('label')?.querySelector<HTMLElement>('[aria-hidden="true"]');
		if (indicator == null) throw new Error(`Expected the radio indicator for ${name}.`);
		return indicator.getBoundingClientRect().width;
	};

	expect(indicatorSize('Inherited small')).toBe(16);
	expect(indicatorSize('Group medium')).toBe(20);
	expect(indicatorSize('Option small')).toBe(16);
	expect(indicatorSize('Default medium')).toBe(20);
});

/** The visual circle, its dot, and the control wrapper for the radio with this accessible name. */
function radioParts(locator: { getByRole: typeof page.getByRole }, name: string) {
	const radio = locator.getByRole('radio', { name }).element();
	const label = radio.closest('label');
	const indicator = label?.querySelector<HTMLElement>('[aria-hidden="true"]');
	const mark = indicator?.firstElementChild;
	if (label == null || indicator == null || !(mark instanceof HTMLElement)) {
		throw new Error(`Expected the radio parts for ${name}.`);
	}
	return { indicator, label, mark };
}

/** The vertical centre of the label text's first line. */
function firstLineCentre(label: HTMLElement, text: string): number {
	const textNode = [...label.querySelectorAll('span')]
		.map((span) => span.firstChild)
		.find((node) => node instanceof window.Text && node.data.startsWith(text));
	if (!(textNode instanceof window.Text)) throw new Error(`Expected the ${text} label text.`);
	const range = document.createRange();
	range.selectNodeContents(textNode);
	const firstLine = range.getClientRects()[0];
	if (firstLine == null) throw new Error('Expected the label text to render.');
	return firstLine.top + firstLine.height / 2;
}

for (const size of ['small', 'medium'] as const) {
	test(`the ${size} indicator is centred on the first line of a wrapping label, with its dot centred`, () => {
		const { locator } = render(
			<div style={{ maxWidth: 200 }}>
				<RadioGroup defaultValue="plan" label="Plan" name="plan" size={size}>
					<RadioField label="Wrapping label that needs more than one line to fit" value="plan" />
				</RadioGroup>
			</div>,
		);
		const { indicator, label, mark } = radioParts(
			locator,
			'Wrapping label that needs more than one line to fit',
		);
		const indicatorBox = indicator.getBoundingClientRect();
		const markBox = mark.getBoundingClientRect();
		const textBox = label.lastElementChild?.getBoundingClientRect();

		expect(textBox?.height).toBeGreaterThan(indicatorBox.height * 1.5);
		expect(indicatorBox.top + indicatorBox.height / 2).toBeCloseTo(
			firstLineCentre(label, 'Wrapping'),
			0,
		);
		expect(markBox.left + markBox.width / 2).toBeCloseTo(
			indicatorBox.left + indicatorBox.width / 2,
			1,
		);
		expect(markBox.top + markBox.height / 2).toBeCloseTo(
			indicatorBox.top + indicatorBox.height / 2,
			1,
		);
	});
}

test('the label gap and control width follow Checkbox at each size', () => {
	const { locator } = render(
		<>
			<RadioGroup label="Plan" name="plan">
				<RadioField label="Radio medium" value="medium" />
				<RadioField label="Radio small" size="small" value="small" />
			</RadioGroup>
			<CheckboxField label="Checkbox medium" />
			<CheckboxField label="Checkbox small" size="small" />
		</>,
	);
	const textStart = (label: HTMLElement) =>
		label.lastElementChild?.getBoundingClientRect().left ?? 0;
	const offset = (label: HTMLElement) => textStart(label) - label.getBoundingClientRect().left;

	for (const size of ['medium', 'small']) {
		const radioLabel = radioParts(locator, `Radio ${size}`).label;
		const checkboxLabel = locator
			.getByRole('checkbox', { name: `Checkbox ${size}` })
			.element()
			.closest('label');
		if (checkboxLabel == null) throw new Error('Expected the checkbox label.');
		expect(offset(radioLabel)).toBe(offset(checkboxLabel));
	}
});

test('the selected radio uses the control finish and shows its dot; the unselected one does not', () => {
	const { locator } = render(
		<RadioGroup defaultValue="on" label="Plan" name="plan">
			<RadioField label="On" value="on" />
			<RadioField label="Off" value="off" />
		</RadioGroup>,
	);
	const on = radioParts(locator, 'On');
	const off = radioParts(locator, 'Off');
	const probe = on.label.appendChild(document.createElement('span'));
	probe.style.backgroundImage = 'var(--luke-control-finish-resting)';
	const finish = getComputedStyle(probe).backgroundImage;
	probe.remove();

	expect(finish).not.toBe('none');
	expect(getComputedStyle(on.indicator).backgroundImage).toBe(finish);
	expect(getComputedStyle(off.indicator).backgroundImage).not.toBe(finish);
	expect(getComputedStyle(on.mark).opacity).toBe('1');
	expect(getComputedStyle(off.mark).opacity).toBe('0');
	// Hidden by opacity, not removed: the dot keeps its place so selecting does not shift layout.
	expect(off.mark.getBoundingClientRect().width).toBeGreaterThan(0);
});

test('the dot grows in with a transition on selection and hides at once on deselection', async () => {
	const { locator } = render(
		<RadioGroup defaultValue="on" label="Plan" name="plan">
			<RadioField label="On" value="on" />
			<RadioField label="Off" value="off" />
		</RadioGroup>,
	);
	const on = radioParts(locator, 'On');
	const off = radioParts(locator, 'Off');
	const selected = getComputedStyle(on.mark);

	expect(selected.transitionProperty).toBe('opacity, transform');
	expect(selected.transitionDuration).not.toBe('0s');
	expect(selected.animationName).toBe('none');
	expect(getComputedStyle(off.mark).transitionDuration).toBe('0s');
	expect(getComputedStyle(off.mark).transform).not.toBe('none');

	await userEvent.click(page.getByText('Off'));

	expect(getComputedStyle(on.mark).opacity).toBe('0');
	expect(getComputedStyle(on.mark).transitionDuration).toBe('0s');
});

test('reduced motion shows the dot at once, with no growth transition', async () => {
	await emulateReducedMotion(true);
	try {
		const { locator } = render(
			<RadioGroup defaultValue="on" label="Plan" name="plan">
				<RadioField label="On" value="on" />
			</RadioGroup>,
		);
		const { indicator, mark } = radioParts(locator, 'On');

		expect(getComputedStyle(mark).transitionDuration).toBe('0s');
		expect(getComputedStyle(indicator).transitionDuration).toBe('0s');
		expect(getComputedStyle(mark).opacity).toBe('1');
	} finally {
		await emulateReducedMotion(false);
	}
});

test('a horizontal group keeps options in DOM order and wraps at the available width', () => {
	const { locator } = render(
		<div style={{ maxWidth: 220 }}>
			<RadioGroup label="Plan" name="plan" orientation="horizontal">
				<RadioField label="Starter" value="starter" />
				<RadioField label="Professional plan with a long name" value="pro" />
				<RadioField label="Enterprise" value="enterprise" />
			</RadioGroup>
		</div>,
	);
	const group = locator.getByRole('radiogroup', { name: 'Plan' }).element();
	const options = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
	expect(options.map((option) => option.value)).toEqual(['starter', 'pro', 'enterprise']);
	expect(page.getByText('Enterprise').element().getBoundingClientRect().top).toBeGreaterThan(
		page.getByText('Starter').element().getBoundingClientRect().top,
	);
});

test('the radio group scene has no axe violations', async () => {
	const { container } = render(<RadioScene />);
	await expectNoAxeViolations(container);
});

/** Resolves a colour the way the browser would in this radio group's theme scope. */
function resolvedBorderColor(scope: Element, color: string): string {
	const probe = scope.appendChild(document.createElement('span'));
	probe.style.borderTop = `1px solid ${color}`;
	const resolved = getComputedStyle(probe).borderTopColor;
	probe.remove();
	return resolved;
}

test('theme matrix', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<RadioScene />, { appearance });
		await captureVisualAppearance(locator, 'radio-group/theme-matrix', appearance);
	}
});

test('horizontal and invalid groups', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<RadioGroup errorMessage="Choose a plan." label="Invalid" name="invalid">
					<RadioField label="Starter" value="starter" />
					<RadioField label="Pro" value="pro" />
				</RadioGroup>
				<RadioGroup label="Horizontal" name="horizontal" orientation="horizontal">
					<RadioField label="Monthly" value="monthly" />
					<RadioField label="Annual" value="annual" />
				</RadioGroup>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'radio-group/invalid-horizontal', appearance);
	}
});

const STATE_TRACK_SIZE = '16rem';
/** Wider than Tactile's `shadow.raised` spread (about 16px), so a state never paints a neighbour. */
const STATE_GAP = '1.5rem';

const radioStates = ['rest', 'hover', 'pressed'] as const;

type StateCell = {
	isDisabled?: boolean;
	isInvalid?: boolean;
	isSelected: boolean;
	name: string;
	size?: 'small';
	startsRow?: boolean;
	state: (typeof radioStates)[number];
};

const stateCells: Array<StateCell> = [
	...[
		{ isInvalid: false, isSelected: false, label: 'Unselected' },
		{ isInvalid: false, isSelected: true, label: 'Selected' },
		{ isInvalid: true, isSelected: false, label: 'Invalid unselected' },
		{ isInvalid: true, isSelected: true, label: 'Invalid selected' },
	].flatMap(({ isInvalid, isSelected, label }) =>
		radioStates.map((state) => ({ isInvalid, isSelected, name: `${label} ${state}`, state })),
	),
	{ isDisabled: true, isSelected: false, name: 'Disabled unselected', state: 'rest' },
	{ isDisabled: true, isSelected: true, name: 'Disabled selected', state: 'rest' },
	{ isSelected: true, name: 'Small selected rest', size: 'small', startsRow: true, state: 'rest' },
	{ isSelected: false, name: 'Small unselected rest', size: 'small', state: 'rest' },
];

function RadioStateCell({ isDisabled, isInvalid, isSelected, name, size }: StateCell) {
	return (
		<RadioGroupRoot
			aria-label={name}
			defaultValue={isSelected ? 'option' : undefined}
			isDisabled={isDisabled}
			isInvalid={isInvalid}
			size={size}
		>
			<RadioRoot value="option">
				<RadioLabel>
					<RadioControl>
						<RadioIndicator />
					</RadioControl>
					{name}
				</RadioLabel>
			</RadioRoot>
		</RadioGroupRoot>
	);
}

for (const appearance of [...visualAppearances, ...flatAppearances]) {
	test(`states in ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator } = render(
			<div
				style={{
					display: 'grid',
					gap: STATE_GAP,
					gridTemplateColumns: `repeat(3, ${STATE_TRACK_SIZE})`,
					padding: STATE_GAP,
					width: 'max-content',
				}}
			>
				{stateCells.map((cell) => (
					<div key={cell.name} style={cell.startsRow ? { gridColumnStart: 1 } : undefined}>
						<RadioStateCell {...cell} />
					</div>
				))}
			</div>,
			{ appearance },
		);
		for (const { name, state } of stateCells) {
			const label = locator.getByRole('radio', { exact: true, name }).element().closest('label');
			if (label == null) throw new Error(`Expected the label for ${name}.`);
			setInteractionState(label, state);
		}
		await captureVisualAppearance(locator, 'radio-group/states', appearance);
	});
}

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<RadioGroup defaultValue="starter" label="Plan" name="plan">
			<RadioField label="Starter" value="starter" />
			<RadioField label="Pro" value="pro" />
		</RadioGroup>,
	);
	await focusViaKeyboard(locator.getByRole('radio', { name: 'Starter' }));
	await captureVisual(locator, 'radio-group/focus-visible');
});

test('selection remains distinct in the flat fixture', { tags: ['visual'] }, async () => {
	for (const appearance of flatAppearances) {
		const { locator } = render(
			<RadioGroup defaultValue="starter" label="Plan" name="plan">
				<RadioField label="Starter" value="starter" />
				<RadioField label="Pro" value="pro" />
			</RadioGroup>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'radio-group/flat-selection', appearance);
	}
});

test('forced-colours options remain visible and operable', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');
	try {
		const { container, locator } = render(
			<Stack>
				<RadioGroup defaultValue="starter" label="Plan" name="plan">
					<RadioField label="Starter" value="starter" />
					<RadioField label="Pro" value="pro" />
					<RadioField isDisabled label="Unavailable" value="unavailable" />
				</RadioGroup>
				<RadioGroup defaultValue="legacy" isDisabled label="Legacy plan" name="legacy">
					<RadioField label="Legacy" value="legacy" />
				</RadioGroup>
			</Stack>,
		);
		await userEvent.click(page.getByText('Pro'));
		expect(locator.getByRole('radio', { name: 'Pro' })).toBeChecked();
		await expectNoAxeViolations(container);
		await captureVisual(locator, 'radio-group/forced-colours');
	} finally {
		await emulateForcedColors('none');
	}
});

test('a disabled selected radio keeps its dot visible in forced colours', async () => {
	await emulateForcedColors('active');
	try {
		const { locator } = render(
			<RadioGroup defaultValue="legacy" isDisabled label="Legacy plan" name="legacy">
				<RadioField label="Legacy" value="legacy" />
			</RadioGroup>,
		);
		const { indicator, mark } = radioParts(locator, 'Legacy');
		const dot = getComputedStyle(mark).backgroundColor;

		expect(dot).not.toBe(getComputedStyle(indicator).backgroundColor);
		expect(dot).toBe(resolvedBorderColor(indicator, 'GrayText'));
	} finally {
		await emulateForcedColors('none');
	}
});

test(
	'reduced-motion radios remain usable and remove the indicator transition',
	{ tags: ['visual'] },
	async () => {
		await emulateReducedMotion(true);
		try {
			const { locator } = render(
				<RadioGroup label="Plan" name="plan">
					<RadioField label="Starter" value="starter" />
					<RadioField label="Pro" value="pro" />
				</RadioGroup>,
			);
			const indicator = locator
				.getByRole('radio', { name: 'Starter' })
				.element()
				.closest('label')
				?.querySelector<HTMLElement>('[aria-hidden="true"]');
			if (indicator == null) throw new Error('Expected the radio indicator.');
			await userEvent.click(page.getByText('Pro'));

			expect(locator.getByRole('radio', { name: 'Pro' })).toBeChecked();
			expect(getComputedStyle(indicator).transitionDuration).toBe('0s');
			await captureVisual(locator, 'radio-group/reduced-motion');
		} finally {
			await emulateReducedMotion(false);
		}
	},
);
