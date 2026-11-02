import { Form } from '@luke-ui/react/form';
import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { emulateReducedMotion } from '../test-utils/emulate-media.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render, visualAppearances, flatAppearances } from '../test-utils/render.js';
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
			<RadioGroup defaultValue="starter" label="Plan" name="plan">
				<RadioField label="Starter" value="starter" />
				<RadioField label="Pro" value="pro" />
				<RadioField isDisabled label="Unavailable" value="unavailable" />
			</RadioGroup>,
		);
		await userEvent.click(page.getByText('Pro'));
		expect(locator.getByRole('radio', { name: 'Pro' })).toBeChecked();
		await expectNoAxeViolations(container);
		await captureVisual(locator, 'radio-group/forced-colours');
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
