import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Heading, HeadingLevels, useHeadingLevel } from './index.js';

testConformance({
	path: 'heading',
	getTarget: (result) => {
		const target = result.locator.getByRole('heading').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Heading element.');
		return target;
	},
	render: (props = {}) => render(<Heading {...props}>Section title</Heading>),
});

test('keeps semantic heading level independent of visual type style', () => {
	const { locator } = render(
		<Heading level={2} typography="heading3">
			Styled as heading3
		</Heading>,
	);

	expect(
		locator.getByRole('heading', { level: 2, name: 'Styled as heading3' }).element(),
	).toBeDefined();
});

test('useHeadingLevel reads the current level without advancing it', () => {
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

	expect(locator.getByRole('heading', { level: 2, name: 'current h2' }).element()).toBeDefined();
	expect(locator.getByRole('heading', { level: 3, name: 'nested h3' }).element()).toBeDefined();
});
