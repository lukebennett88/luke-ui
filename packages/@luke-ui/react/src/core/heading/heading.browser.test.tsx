import { Box } from '@luke-ui/react/box';
import { Heading, HeadingLevels, useHeadingLevel } from '@luke-ui/react/heading';
import { expect, test, vi } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { INTER_CAP_HEIGHT_EM, loadInter } from '../test-utils/load-inter.js';
import { measureBaseline } from '../test-utils/measure-first-line.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedTokens, resolvedColor } from '../test-utils/surface-colors.js';
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

test('Heading renderRoot receives the resolved level and owns its matching heading root', () => {
	const warning = vi.spyOn(console, 'warn');
	const { locator } = render(
		<Heading
			renderRoot={({ children, ...domProps }, { element: HeadingTag }) => (
				<HeadingTag {...domProps} data-testid="owned-heading">
					{children}
				</HeadingTag>
			)}
			level={3}
		>
			Owned heading
		</Heading>,
	);
	const heading = locator.getByTestId('owned-heading').element();

	expect(heading.tagName).toBe('H3');
	expect(locator.getByRole('heading', { level: 3, name: 'Owned heading' }).element()).toBe(heading);
	expect(warning.mock.calls.flat().join(' ')).not.toContain('Unexpected DOM element returned');
	warning.mockRestore();
});

test('Heading renderRoot keeps Capsize trim by default', async () => {
	await loadInter();
	const { locator } = render(
		<div style={{ inlineSize: '16rem' }}>
			<Heading
				level={2}
				renderRoot={({ children, ...domProps }, { element: HeadingTag }) => (
					<HeadingTag {...domProps} data-testid="heading-render">
						{children}
					</HeadingTag>
				)}
			>
				Trimmed owned heading
			</Heading>
		</div>,
	);
	const heading = locator.getByTestId('heading-render').element();
	const { top } = heading.getBoundingClientRect();
	const firstBaseline = measureBaseline(heading);
	const fontSize = Number.parseFloat(getComputedStyle(heading).fontSize);

	expect(Math.abs(top - (firstBaseline - INTER_CAP_HEIGHT_EM * fontSize))).toBeLessThanOrEqual(0.5);
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

test('Heading renderRoot keeps nested HeadingLevels semantics', async () => {
	const { locator } = render(
		<HeadingLevels base={2}>
			<Heading renderRoot={(domProps, { element: HeadingTag }) => <HeadingTag {...domProps} />}>
				Outer owned
			</Heading>
			<HeadingLevels>
				<Heading renderRoot={(domProps, { element: HeadingTag }) => <HeadingTag {...domProps} />}>
					Inner owned
				</Heading>
				<HeadingLevels>
					<Heading renderRoot={(domProps, { element: HeadingTag }) => <HeadingTag {...domProps} />}>
						Deeper owned
					</Heading>
				</HeadingLevels>
			</HeadingLevels>
		</HeadingLevels>,
	);

	await expect
		.element(locator.getByRole('heading', { level: 2, name: 'Outer owned' }))
		.toBeVisible();
	await expect
		.element(locator.getByRole('heading', { level: 3, name: 'Inner owned' }))
		.toBeVisible();
	await expect
		.element(locator.getByRole('heading', { level: 4, name: 'Deeper owned' }))
		.toBeVisible();
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
		const { element: HeadingTag, level } = useHeadingLevel();
		return <HeadingTag>{`${label} h${level}`}</HeadingTag>;
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

for (const appearance of visualAppearances) {
	test(`Heading colour follows the nearest background in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<Box backgroundColor="danger.solid" data-testid="solid">
				<Heading data-testid="inherited" level={2}>
					Account settings
				</Heading>
				<Heading color="secondary" data-testid="secondary" level={3}>
					Supporting heading
				</Heading>
				<Heading
					color="success"
					level={4}
					renderRoot={(domProps, { element: Element }) => (
						<Element {...domProps} data-testid="render-root" />
					)}
				>
					Owned heading
				</Heading>
			</Box>,
			{ appearance },
		);
		const byTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`)!;
		const tokens = pairedTokens('danger.solid.rest');

		expect(getComputedStyle(byTestId('inherited')).color).toBe(
			getComputedStyle(byTestId('solid')).color,
		);
		expect(getComputedStyle(byTestId('secondary')).color).toBe(
			resolvedColor(tokens.secondary, byTestId('secondary')),
		);
		expect(byTestId('render-root').tagName).toBe('H4');
		// A semantic role on a solid background reads as its on-solid colour.
		expect(getComputedStyle(byTestId('render-root')).color).toBe(
			resolvedColor(tokens.success, byTestId('render-root')),
		);
	});
}
