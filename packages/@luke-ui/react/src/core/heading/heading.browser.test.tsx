import { Heading, HeadingLevels, useHeadingLevel } from '@luke-ui/react/heading';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps, forwardedDomProps } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	Stack,
	variantValuesFor,
} from '../test-utils/visual.js';

const levels = variantValuesFor<typeof Heading, 'level'>()([1, 2, 3, 4, 5, 6]);

function HeadingScene() {
	return (
		<Stack width="40rem">
			{levels.map((level) => (
				<Heading key={level} level={level}>
					Level {level} heading
				</Heading>
			))}
			<Heading level={1} typography="display">
				Display heading
			</Heading>
		</Stack>
	);
}

test('Heading forwards className, data attributes, id, and ref to the heading element', () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<Heading {...forwardedDomProps} ref={ref}>
			Section title
		</Heading>,
	);
	const target = locator.getByRole('heading').element();

	expectForwardsDomProps(target, ref);
});

test('the Heading scene has no axe violations', async () => {
	const { container } = render(<HeadingScene />);

	await expectNoAxeViolations(container);
});

test('keeps semantic heading level independent of visual type style', async () => {
	const { locator } = render(
		<Heading level={2} typography="heading3">
			Styled as heading3
		</Heading>,
	);

	await expect
		.element(locator.getByRole('heading', { level: 2, name: 'Styled as heading3' }))
		.toBeVisible();
});

test('inherits the current HeadingLevels base without advancing it', async () => {
	const { locator } = render(
		<HeadingLevels base={2}>
			<Heading>Inherited heading</Heading>
		</HeadingLevels>,
	);

	await expect
		.element(locator.getByRole('heading', { level: 2, name: 'Inherited heading' }))
		.toBeVisible();
});

test('nested HeadingLevels advance exactly one level for Heading', async () => {
	const { locator } = render(
		<HeadingLevels base={2}>
			<Heading>Outer</Heading>
			<HeadingLevels>
				<Heading>Inner</Heading>
				<HeadingLevels>
					<Heading>Deeper</Heading>
				</HeadingLevels>
			</HeadingLevels>
		</HeadingLevels>,
	);

	await expect.element(locator.getByRole('heading', { level: 2, name: 'Outer' })).toBeVisible();
	await expect.element(locator.getByRole('heading', { level: 3, name: 'Inner' })).toBeVisible();
	await expect.element(locator.getByRole('heading', { level: 4, name: 'Deeper' })).toBeVisible();
});

test('explicit level overrides context without changing siblings', async () => {
	const { locator } = render(
		<HeadingLevels base={2}>
			<Heading level={4}>Explicit</Heading>
			<Heading>Sibling</Heading>
		</HeadingLevels>,
	);

	await expect.element(locator.getByRole('heading', { level: 4, name: 'Explicit' })).toBeVisible();
	await expect.element(locator.getByRole('heading', { level: 2, name: 'Sibling' })).toBeVisible();
});

test('falls back to h2 outside HeadingLevels', async () => {
	const { locator } = render(<Heading>Root fallback</Heading>);

	await expect
		.element(locator.getByRole('heading', { level: 2, name: 'Root fallback' }))
		.toBeVisible();
});

test('caps nested HeadingLevels at h6', async () => {
	const { locator } = render(
		<HeadingLevels base={5}>
			<Heading>Level five</Heading>
			<HeadingLevels>
				<Heading>Level six</Heading>
				<HeadingLevels>
					<Heading>Capped at six</Heading>
				</HeadingLevels>
			</HeadingLevels>
		</HeadingLevels>,
	);

	await expect
		.element(locator.getByRole('heading', { level: 5, name: 'Level five' }))
		.toBeVisible();
	await expect.element(locator.getByRole('heading', { level: 6, name: 'Level six' })).toBeVisible();
	await expect
		.element(locator.getByRole('heading', { level: 6, name: 'Capped at six' }))
		.toBeVisible();
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

	await expect
		.element(locator.getByRole('heading', { level: 2, name: 'current h2' }))
		.toBeVisible();
	await expect.element(locator.getByRole('heading', { level: 3, name: 'nested h3' })).toBeVisible();
});

test('levels', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<HeadingScene />, { appearance });
		await captureVisualAppearance(locator, 'heading/levels', appearance);
	}
});

test('truncated heading', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="20rem">
			<Heading level={2} lineClamp={1}>
				A flat-file CMS stores content in files rather than a database.
			</Heading>
		</Stack>,
	);

	await captureVisual(locator, 'heading/truncated');
});
