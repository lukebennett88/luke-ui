import { expect, test } from 'vite-plus/test';
import { Icon } from '../../icon/icon.js';
import { render } from '../../test-utils/render.js';
import { InputGroup } from '../input-group/index.js';
import { ComboboxInputGroup } from './input-group.js';
import { ComboboxInput } from './input.js';
import { ComboboxRoot } from './root.js';
import { ComboboxTrigger } from './trigger.js';

test('sizes a child icon the same as InputGroup at small', async () => {
	const { locator } = render(
		<>
			<InputGroup size="small">
				<Icon name="search" title="Input group icon" />
			</InputGroup>
			<ComboboxInputGroup size="small">
				<Icon name="search" title="Combobox group icon" />
			</ComboboxInputGroup>
		</>,
	);

	const inputGroupIcon = locator.getByRole('img', { name: 'Input group icon' });
	const comboboxIcon = locator.getByRole('img', { name: 'Combobox group icon' });
	await expect.element(inputGroupIcon).toBeVisible();
	await expect.element(comboboxIcon).toBeVisible();

	expect(getComputedStyle(inputGroupIcon.element()).width).toBe(
		getComputedStyle(comboboxIcon.element()).width,
	);
});

test('a trigger size override sizes its nested icon independently of the group', async () => {
	const { locator } = render(
		<>
			<ComboboxInputGroup size="small">
				<Icon name="chevronDown" title="Small group icon" />
			</ComboboxInputGroup>
			<ComboboxInputGroup size="medium">
				<Icon name="chevronDown" title="Medium group icon" />
			</ComboboxInputGroup>
			<ComboboxRoot aria-label="Country" size="small">
				<ComboboxInputGroup>
					<ComboboxInput />
					<ComboboxTrigger aria-label="Toggle options" size="medium">
						<Icon name="chevronDown" title="Trigger icon" />
					</ComboboxTrigger>
				</ComboboxInputGroup>
			</ComboboxRoot>
		</>,
	);

	const smallGroupIcon = locator.getByRole('img', { name: 'Small group icon' });
	const mediumGroupIcon = locator.getByRole('img', { name: 'Medium group icon' });
	const triggerIcon = locator.getByRole('img', { name: 'Trigger icon' });
	await expect.element(smallGroupIcon).toBeVisible();
	await expect.element(mediumGroupIcon).toBeVisible();
	await expect.element(triggerIcon).toBeVisible();

	const smallWidth = getComputedStyle(smallGroupIcon.element()).width;
	const mediumWidth = getComputedStyle(mediumGroupIcon.element()).width;
	const triggerWidth = getComputedStyle(triggerIcon.element()).width;

	expect(smallWidth).not.toBe(mediumWidth);
	expect(triggerWidth).toBe(mediumWidth);
});
