import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from '../text/index.js';
import { Heading, HeadingLevels, useHeadingLevel } from './index.js';

test('keeps semantic heading level independent of visual type style', async () => {
	const { locator } = render(
		<>
			<Heading level={2} typography="heading3">
				Styled as heading3
			</Heading>
			<Text elementType="div" fontWeight="heading" typography="heading3">
				Reference heading3
			</Text>
			<Heading level={2}>Default h2</Heading>
		</>,
	);

	const styled = locator.getByRole('heading', { level: 2, name: 'Styled as heading3' }).element();
	const reference = locator.getByText('Reference heading3').element();
	const defaultH2 = locator.getByRole('heading', { level: 2, name: 'Default h2' }).element();

	expect(styled.tagName).toBe('H2');
	expect(getComputedStyle(styled).fontSize).toBe(getComputedStyle(reference).fontSize);
	expect(getComputedStyle(styled).fontSize).not.toBe(getComputedStyle(defaultH2).fontSize);
});

test('useHeadingLevel reads the current level without advancing it', async () => {
	function CurrentLevel({ label }: { label: string }) {
		const { element: Element, level } = useHeadingLevel();
		return <Element>{`${label} h${level}`}</Element>;
	}

	const { locator } = render(
		<HeadingLevels base={2}>
			<CurrentLevel label="current" />
			<HeadingLevels>
				<CurrentLevel label="nested" />
			</HeadingLevels>
		</HeadingLevels>,
	);

	expect(locator.getByRole('heading', { level: 2, name: 'current h2' }).element().tagName).toBe(
		'H2',
	);
	expect(locator.getByRole('heading', { level: 3, name: 'nested h3' }).element().tagName).toBe(
		'H3',
	);
});
