import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from '../text/index.js';
import { Emoji } from './index.js';

test('inherits font size from surrounding Text', () => {
	const { locator } = render(
		<Text typography="heading3">
			Hello <Emoji emoji="👋" label="Waving hand" />
		</Text>,
	);

	const emoji = locator.getByRole('img', { name: 'Waving hand' }).element();
	const parent = emoji.parentElement;
	expect(parent).not.toBeNull();
	expect(getComputedStyle(emoji).fontSize).toBe(getComputedStyle(parent!).fontSize);
});
