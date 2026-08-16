import { expect, test } from 'vite-plus/test';
import { Icon } from '../../icon/icon.js';
import { render } from '../../test-utils/render.js';
import { InputGroup } from '../input-group/index.js';
import { ComboboxInputGroup } from './input-group.js';

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
