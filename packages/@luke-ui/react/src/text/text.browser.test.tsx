import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from './index.js';

test('explicit fontWeight overrides the typography style default', () => {
	const { locator } = render(
		<>
			<Text typography="label">Default label weight</Text>
			<Text fontWeight="body" typography="label">
				Overridden body weight
			</Text>
			<Text fontWeight="body">Body weight reference</Text>
		</>,
	);

	const labelDefault = getComputedStyle(
		locator.getByText('Default label weight').element(),
	).fontWeight;
	const overridden = getComputedStyle(
		locator.getByText('Overridden body weight').element(),
	).fontWeight;
	const bodyReference = getComputedStyle(
		locator.getByText('Body weight reference').element(),
	).fontWeight;

	expect(overridden).toBe(bodyReference);
	expect(labelDefault).not.toBe(bodyReference);
});
