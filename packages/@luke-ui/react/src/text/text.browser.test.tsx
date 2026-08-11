import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from './index.js';

test('resolves typography default weight, explicit overrides, nesting, and shouldInheritFont', () => {
	const { locator } = render(
		<>
			<Text typography="label">Label default</Text>
			<Text fontWeight="body" typography="label">
				Label with body weight
			</Text>
			<Text fontWeight="body">Body weight reference</Text>
			<Text fontWeight="emphasis" typography="body">
				Emphasis parent <Text typography="label">Nested label default</Text>{' '}
				<Text fontWeight="body" typography="label">
					Nested label with body weight
				</Text>{' '}
				<Text shouldInheritFont>Inherited emphasis</Text>
			</Text>
			<Text fontWeight="emphasis">Emphasis weight reference</Text>
		</>,
	);

	const labelDefault = getComputedStyle(locator.getByText('Label default').element()).fontWeight;
	const labelWithBody = getComputedStyle(
		locator.getByText('Label with body weight').element(),
	).fontWeight;
	const bodyReference = getComputedStyle(
		locator.getByText('Body weight reference').element(),
	).fontWeight;
	const nestedLabelDefault = getComputedStyle(
		locator.getByText('Nested label default').element(),
	).fontWeight;
	const nestedLabelWithBody = getComputedStyle(
		locator.getByText('Nested label with body weight').element(),
	).fontWeight;
	const inheritedEmphasis = getComputedStyle(
		locator.getByText('Inherited emphasis').element(),
	).fontWeight;
	const emphasisReference = getComputedStyle(
		locator.getByText('Emphasis weight reference').element(),
	).fontWeight;

	expect(labelDefault).not.toBe(bodyReference);
	expect(labelWithBody).toBe(bodyReference);
	expect(nestedLabelDefault).toBe(labelDefault);
	expect(nestedLabelWithBody).toBe(bodyReference);
	expect(inheritedEmphasis).toBe(emphasisReference);
});
