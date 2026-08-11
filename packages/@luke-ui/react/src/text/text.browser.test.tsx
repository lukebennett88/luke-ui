import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from './index.js';

test('resolves typography default weight, explicit overrides, nesting, and shouldInheritFont', () => {
	const { locator } = render(
		<>
			<Text elementType="div" typography="label">
				Label default
			</Text>
			<Text elementType="div" fontWeight="body" typography="label">
				Label with body weight
			</Text>
			<Text elementType="div" fontWeight="body">
				Body weight reference
			</Text>
			<Text elementType="div" fontWeight="emphasis" typography="body">
				Emphasis parent
				<Text typography="label">Nested label default</Text>
				<Text fontWeight="body" typography="label">
					Nested label with body weight
				</Text>
				<Text shouldInheritFont>Inherited emphasis</Text>
			</Text>
			<Text elementType="div" fontWeight="emphasis">
				Emphasis weight reference
			</Text>
		</>,
	);

	const exact = { exact: true } as const;
	const labelDefault = getComputedStyle(
		locator.getByText('Label default', exact).element(),
	).fontWeight;
	const labelWithBody = getComputedStyle(
		locator.getByText('Label with body weight', exact).element(),
	).fontWeight;
	const bodyReference = getComputedStyle(
		locator.getByText('Body weight reference', exact).element(),
	).fontWeight;
	const nestedLabelDefault = getComputedStyle(
		locator.getByText('Nested label default', exact).element(),
	).fontWeight;
	const nestedLabelWithBody = getComputedStyle(
		locator.getByText('Nested label with body weight', exact).element(),
	).fontWeight;
	const inheritedEmphasis = getComputedStyle(
		locator.getByText('Inherited emphasis', exact).element(),
	).fontWeight;
	const emphasisReference = getComputedStyle(
		locator.getByText('Emphasis weight reference', exact).element(),
	).fontWeight;

	expect(labelDefault).not.toBe(bodyReference);
	expect(labelWithBody).toBe(bodyReference);
	expect(nestedLabelDefault).toBe(labelDefault);
	expect(nestedLabelWithBody).toBe(bodyReference);
	expect(inheritedEmphasis).toBe(emphasisReference);
});
