import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Provider } from '@luke-ui/react/provider';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render } from '../test-utils/render.js';

test('renders icon-using controls when the app root uses Provider', async () => {
	const spritesheetHref = '/provider-test-spritesheet.svg';
	const { container, locator, unmount } = render(
		<Provider spritesheetHref={spritesheetHref}>
			<Button startContent={<Icon name="add" />}>With icon</Button>
		</Provider>,
	);

	await expect.element(locator.getByRole('button', { name: 'With icon' })).toBeVisible();
	const use = container.querySelector('use');
	expect(use?.getAttribute('href')).toBe(`${spritesheetHref}#add`);
	await expectNoAxeViolations(container);
	unmount();
});
