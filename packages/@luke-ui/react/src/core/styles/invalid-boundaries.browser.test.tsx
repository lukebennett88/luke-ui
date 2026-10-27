import { Box } from '@luke-ui/react/box';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { SwitchField } from '@luke-ui/react/switch-field';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, emulateForcedColors, Stack } from '../test-utils/visual.js';

const THEME_LABEL_PATTERN = /Theme$/;

function InvalidControls() {
	return (
		<Box display="flex" flexWrap="wrap" gap="space.16">
			{(['Rest', 'Hover', 'Pressed', 'Focus', 'Disabled'] as const).map((state) => {
				const isDisabled = state === 'Disabled';
				return (
					<div data-state={state} key={state} style={{ inlineSize: '15rem' }}>
						<Stack width="15rem">
							<Text>{state}</Text>
							<TextInputField errorMessage="Required" isDisabled={isDisabled} label="Name" />
							<TextInputField
								errorMessage="Required"
								isDisabled={isDisabled}
								label="Amount"
								prefix="$"
							/>
							<SelectField errorMessage="Required" isDisabled={isDisabled} label="Theme">
								<SelectItem id="light">Light</SelectItem>
							</SelectField>
							<ComboboxField errorMessage="Required" isDisabled={isDisabled} label="Country">
								<ComboboxItem id="au">Australia</ComboboxItem>
							</ComboboxField>
							<CheckboxField errorMessage="Required" isDisabled={isDisabled} label="Off checkbox" />
							<CheckboxField
								defaultSelected
								errorMessage="Required"
								isDisabled={isDisabled}
								label="On checkbox"
							/>
							<CheckboxField
								errorMessage="Required"
								isDisabled={isDisabled}
								isIndeterminate
								label="Mixed checkbox"
							/>
							<SwitchField errorMessage="Required" isDisabled={isDisabled} label="Off switch" />
							<SwitchField
								defaultSelected
								errorMessage="Required"
								isDisabled={isDisabled}
								label="On switch"
							/>
						</Stack>
					</div>
				);
			})}
		</Box>
	);
}

function applyInteractionStates(container: HTMLElement) {
	for (const state of ['Hover', 'Pressed', 'Focus'] as const) {
		const column = container.querySelector(`[data-state="${state}"]`);
		if (column == null) throw new Error(`Expected the ${state} column.`);
		const scene = page.elementLocator(column);
		const combobox = scene.getByRole('combobox', { name: 'Country', exact: true }).element();
		const controls = [
			...(['Name', 'Amount'] as const).map((name) => {
				const input = scene.getByRole('textbox', { name, exact: true }).element();
				return input.closest('[role="group"]') ?? input.parentElement;
			}),
			scene.getByRole('button', { name: THEME_LABEL_PATTERN }).element(),
			combobox.closest('[role="group"]') ?? combobox.parentElement,
			...(['Off checkbox', 'On checkbox', 'Mixed checkbox'] as const).map((name) =>
				scene.getByRole('checkbox', { name, exact: true }).element().closest('label'),
			),
			...(['Off switch', 'On switch'] as const).map((name) =>
				scene.getByRole('switch', { name, exact: true }).element().closest('label'),
			),
		];
		for (const control of controls) {
			if (control == null) throw new Error('Expected the control state owner.');
			if (state === 'Hover') control.setAttribute('data-hovered', 'true');
			if (state === 'Pressed') control.setAttribute('data-pressed', 'true');
			if (state === 'Focus') {
				control.setAttribute('data-focus-visible', 'true');
				control.setAttribute('data-focus-within', 'true');
			}
		}
		if (state === 'Focus') combobox.focus({ preventScroll: true });
	}
}

for (const surface of ['base', 'subdued', 'raised'] as const) {
	for (const appearance of visualAppearances) {
		test(
			`invalid boundaries on ${surface} in ${appearance.theme} ${appearance.mode}`,
			{ tags: ['visual'] },
			async () => {
				const { container, locator } = render(
					<Box backgroundColor={`surface.${surface}`} padding="space.16">
						<InvalidControls />
					</Box>,
					{ appearance },
				);
				applyInteractionStates(container);
				await userEvent.keyboard('{Escape}');
				await captureVisualAppearance(locator, `invalid-boundaries/${surface}`, appearance);
			},
		);
	}
}

test('invalid boundaries in forced colours', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');
	try {
		const { container, locator } = render(<InvalidControls />);
		applyInteractionStates(container);
		await userEvent.keyboard('{Escape}');
		await captureVisualAppearance(
			locator,
			'invalid-boundaries/forced-colours',
			visualAppearances[0],
		);
	} finally {
		await emulateForcedColors('none');
	}
});
