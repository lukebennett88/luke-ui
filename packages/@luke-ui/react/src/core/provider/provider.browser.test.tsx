import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render } from '../test-utils/render.js';

test('renders icon-using controls when the app root uses Provider', async () => {
	const { container, locator, unmount } = render(
		<Button startContent={<Icon name="add" />}>With icon</Button>,
	);

	await expect.element(locator.getByRole('button', { name: 'With icon' })).toBeVisible();
	await expectNoAxeViolations(container);
	unmount();
});
