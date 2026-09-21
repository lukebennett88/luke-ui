import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Grid } from '@luke-ui/react/grid';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('Grid forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Grid {...forwardedDomProps} columns={2} ref={ref}>
			Content
		</Grid>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected Grid element.');

	expectForwardsDomProps(target, ref);
});

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('creates equal explicit columns', () => {
	const { locator } = render(
		<Grid columns={3} data-testid="grid" gap="sp8" inlineSize="30rem">
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Grid>,
	);
	const element = locator.getByTestId('grid').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Grid element.');
	const [first, second, third] = element.children;
	if (
		!(first instanceof HTMLElement) ||
		!(second instanceof HTMLElement) ||
		!(third instanceof HTMLElement)
	) {
		throw new Error('Expected Grid children.');
	}

	expect(getComputedStyle(element).display).toBe('grid');
	expect(first.getBoundingClientRect().width).toBeCloseTo(second.getBoundingClientRect().width, 1);
	expect(second.getBoundingClientRect().width).toBeCloseTo(third.getBoundingClientRect().width, 1);
	expect(first.getBoundingClientRect().top).toBe(second.getBoundingClientRect().top);
	expect(second.getBoundingClientRect().top).toBe(third.getBoundingClientRect().top);
});

test('lets children span tracks with Box grid-placement props', () => {
	const { locator } = render(
		<Grid columns={4} data-testid="grid" gap="sp8" inlineSize="40rem">
			<Box data-testid="wide" gridColumn="span 2" style={{ blockSize: '1rem' }} />
			<span data-testid="narrow" style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Grid>,
	);
	const wide = locator.getByTestId('wide').element();
	const narrow = locator.getByTestId('narrow').element();
	if (!(wide instanceof HTMLElement) || !(narrow instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(wide.getBoundingClientRect().width).toBeGreaterThan(
		narrow.getBoundingClientRect().width * 1.5,
	);
});

test('resolves responsive column counts against nested size containers', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container maxInlineSize="100%" paddingInline="sp16">
			<Grid columns={{ initial: 1, bp768: 4 }} data-testid="outer" gap="sp8">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
			<Container maxInlineSize="ct448">
				<Grid columns={{ initial: 1, bp768: 4 }} data-testid="nested" gap="sp8">
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</Grid>
			</Container>
		</Container>,
	);
	const outer = locator.getByTestId('outer').element();
	const nested = locator.getByTestId('nested').element();
	if (!(outer instanceof HTMLElement) || !(nested instanceof HTMLElement)) {
		throw new Error('Expected Grid elements.');
	}
	const outerFirst = outer.children[0];
	const outerSecond = outer.children[1];
	const nestedFirst = nested.children[0];
	const nestedSecond = nested.children[1];
	if (
		!(outerFirst instanceof HTMLElement) ||
		!(outerSecond instanceof HTMLElement) ||
		!(nestedFirst instanceof HTMLElement) ||
		!(nestedSecond instanceof HTMLElement)
	) {
		throw new Error('Expected Grid children.');
	}

	expect(outerFirst.getBoundingClientRect().top).toBe(outerSecond.getBoundingClientRect().top);
	expect(nestedSecond.getBoundingClientRect().top).toBeGreaterThan(
		nestedFirst.getBoundingClientRect().top,
	);
});

test('keeps responsive child spans inside the active column count', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ inlineSize: '40rem' }}>
			<Grid columns={{ initial: 2, bp768: 4 }} data-testid="grid" gap="sp8">
				<Box
					data-testid="span"
					gridColumn={{ initial: 'span 2', bp768: 'span 2' }}
					style={{ blockSize: '1rem' }}
				/>
				<span data-testid="item" style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
		</div>,
	);
	const span = locator.getByTestId('span').element();
	const item = locator.getByTestId('item').element();
	if (!(span instanceof HTMLElement) || !(item instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(span.getBoundingClientRect().width).toBeGreaterThan(item.getBoundingClientRect().width);
	expect(item.getBoundingClientRect().top).toBeGreaterThan(span.getBoundingClientRect().top);

	await page.viewport(breakpoints.bp768, 800);
	expect(span.getBoundingClientRect().top).toBe(item.getBoundingClientRect().top);
	expect(span.getBoundingClientRect().width).toBeGreaterThan(item.getBoundingClientRect().width);
});

test('keeps the inline axis under RTL and vertical writing mode', () => {
	const { locator } = render(
		<div>
			<div dir="rtl" style={{ inlineSize: '30rem' }}>
				<Grid columns={3} data-testid="grid-rtl" gap="sp8">
					<span data-testid="rtl-first" style={{ blockSize: '1rem' }} />
					<span data-testid="rtl-second" style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</Grid>
			</div>
			<div style={{ inlineSize: '30rem', writingMode: 'vertical-rl' }}>
				<Grid columns={3} data-testid="grid-vertical" gap="sp8">
					<span data-testid="vertical-first" style={{ blockSize: '1rem' }} />
					<span data-testid="vertical-second" style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</Grid>
			</div>
		</div>,
	);
	const rtlFirst = locator.getByTestId('rtl-first').element();
	const rtlSecond = locator.getByTestId('rtl-second').element();
	const verticalFirst = locator.getByTestId('vertical-first').element();
	const verticalSecond = locator.getByTestId('vertical-second').element();
	if (
		!(rtlFirst instanceof HTMLElement) ||
		!(rtlSecond instanceof HTMLElement) ||
		!(verticalFirst instanceof HTMLElement) ||
		!(verticalSecond instanceof HTMLElement)
	) {
		throw new Error('Expected Grid children.');
	}

	expect(rtlFirst.getBoundingClientRect().left).toBeGreaterThan(
		rtlSecond.getBoundingClientRect().left,
	);
	expect(verticalSecond.getBoundingClientRect().top).toBeGreaterThan(
		verticalFirst.getBoundingClientRect().top,
	);
});

test('contains long unbreakable content inside equal tracks', () => {
	const { locator } = render(
		<Grid columns={2} data-testid="grid" gap="sp8" inlineSize="20rem">
			<span data-testid="long">
				supercalifragilisticexpialidocioussupercalifragilisticexpialidocious
			</span>
			<span data-testid="short">Short</span>
		</Grid>,
	);
	const grid = locator.getByTestId('grid').element();
	const long = locator.getByTestId('long').element();
	if (!(grid instanceof HTMLElement) || !(long instanceof HTMLElement)) {
		throw new Error('Expected Grid elements.');
	}

	expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
		grid.getBoundingClientRect().right + 1,
	);
});

test('applies root layout props and ignores unsupported Box utilities from an object spread', () => {
	const props = {
		borderStyle: 'solid',
		borderWidth: 'thick',
		columns: 2,
		gap: 'sp8',
		inlineSize: '10rem',
		padding: 'sp16',
	} as const;
	const { locator } = render(
		<div data-testid="container" style={{ inlineSize: '20rem' }}>
			<Grid {...props} data-testid="grid">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	const element = locator.getByTestId('grid').element();
	if (!(container instanceof HTMLElement) || !(element instanceof HTMLElement)) {
		throw new Error('Expected Grid elements.');
	}

	expect(element.getBoundingClientRect().width).toBeLessThan(
		container.getBoundingClientRect().width,
	);
	expect(element.offsetWidth).toBe(element.clientWidth);
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const ref = createRef<HTMLElement>();
	const semanticResult = render(
		<Grid aria-label="Sections" columns={2} elementType="ul" gap="sp8">
			<li>First</li>
			<li>Second</li>
		</Grid>,
	);
	const list = semanticResult.locator.getByRole('list', { name: 'Sections' });
	expect(list.element().tagName).toBe('UL');

	const customResult = render(
		<Grid
			ref={ref}
			columns={2}
			gap="sp8"
			render={(resolvedProps) => <section {...resolvedProps} data-testid="grid-render" />}
		>
			<span>One</span>
			<span>Two</span>
		</Grid>,
	);
	const section = customResult.locator.getByTestId('grid-render').element();
	if (!(section instanceof HTMLElement)) throw new Error('Expected render callback element.');

	expect(section.tagName).toBe('SECTION');
	expect(ref.current).toBe(section);
	expect(getComputedStyle(section).display).toBe('grid');
});

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				<Grid
					columns={4}
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						inlineSize: '36rem',
						padding: vars.space.sp16,
					}}
				>
					<Box gridColumn="span 2" style={itemStyle}>
						Wide
					</Box>
					<span style={itemStyle}>A</span>
					<span style={itemStyle}>B</span>
					<span style={itemStyle}>C</span>
					<span style={itemStyle}>D</span>
					<Box gridColumn="span 2" style={itemStyle}>
						Wide again
					</Box>
				</Grid>
				<div dir="rtl">
					<Grid
						columns={3}
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							inlineSize: '24rem',
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>One</span>
						<span style={itemStyle}>Two</span>
						<span style={itemStyle}>Three</span>
					</Grid>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'grid/kitchen-sink', appearance);
	}
});
