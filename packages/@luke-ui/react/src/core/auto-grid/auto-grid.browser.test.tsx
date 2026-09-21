import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Container } from '@luke-ui/react/container';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('AutoGrid forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<AutoGrid {...forwardedDomProps} minColumnInlineSize="8rem" ref={ref}>
			Content
		</AutoGrid>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected AutoGrid element.');

	expectForwardsDomProps(target, ref);
});

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('chooses a column count from the available inline size', () => {
	const { locator } = render(
		<div style={{ inlineSize: '40rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="12rem">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</AutoGrid>
		</div>,
	);
	const element = locator.getByTestId('grid').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected AutoGrid element.');
	const [first, second, third] = element.children;
	if (
		!(first instanceof HTMLElement) ||
		!(second instanceof HTMLElement) ||
		!(third instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid children.');
	}

	expect(getComputedStyle(element).display).toBe('grid');
	expect(first.getBoundingClientRect().top).toBe(second.getBoundingClientRect().top);
	expect(third.getBoundingClientRect().top).toBe(first.getBoundingClientRect().top);
});

test('does not overflow a parent narrower than minColumnInlineSize', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '10rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="20rem">
				<span style={{ blockSize: '1rem' }}>Item</span>
				<span style={{ blockSize: '1rem' }}>Item</span>
			</AutoGrid>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const grid = locator.getByTestId('grid').element();
	if (!(parent instanceof HTMLElement) || !(grid instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(grid.getBoundingClientRect().width).toBeLessThanOrEqual(
		parent.getBoundingClientRect().width + 1,
	);
	expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
});

test('places sparse items without overflowing the parent', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '40rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="12rem">
				<span data-testid="only" style={{ blockSize: '1rem' }}>
					Only item
				</span>
			</AutoGrid>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const grid = locator.getByTestId('grid').element();
	const only = locator.getByTestId('only').element();
	if (
		!(parent instanceof HTMLElement) ||
		!(grid instanceof HTMLElement) ||
		!(only instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(grid.getBoundingClientRect().width).toBeLessThanOrEqual(
		parent.getBoundingClientRect().width + 1,
	);
	expect(only.getBoundingClientRect().right).toBeLessThanOrEqual(
		grid.getBoundingClientRect().right + 1,
	);
	expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
});

test('resolves against nested size containers', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container maxInlineSize="100%">
			<div style={{ inlineSize: '40rem' }}>
				<AutoGrid data-testid="outer" gap="sp8" minColumnInlineSize="12rem">
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</AutoGrid>
			</div>
			<Container maxInlineSize="ct448">
				<AutoGrid data-testid="nested" gap="sp8" minColumnInlineSize="12rem">
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</AutoGrid>
			</Container>
		</Container>,
	);
	const outer = locator.getByTestId('outer').element();
	const nested = locator.getByTestId('nested').element();
	if (!(outer instanceof HTMLElement) || !(nested instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid elements.');
	}
	const outerThird = outer.children[2];
	const nestedThird = nested.children[2];
	if (!(outerThird instanceof HTMLElement) || !(nestedThird instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid children.');
	}

	expect(outerThird.getBoundingClientRect().top).toBe(
		outer.children[0] instanceof HTMLElement ? outer.children[0].getBoundingClientRect().top : -1,
	);
	expect(nestedThird.getBoundingClientRect().top).toBeGreaterThan(
		nested.children[0] instanceof HTMLElement
			? nested.children[0].getBoundingClientRect().top
			: Number.POSITIVE_INFINITY,
	);
});

test('contains long unbreakable content inside auto-fit tracks', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '24rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="10rem">
				<span data-testid="long">
					supercalifragilisticexpialidocioussupercalifragilisticexpialidocious
				</span>
				<span>Short</span>
			</AutoGrid>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const grid = locator.getByTestId('grid').element();
	const long = locator.getByTestId('long').element();
	if (
		!(parent instanceof HTMLElement) ||
		!(grid instanceof HTMLElement) ||
		!(long instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(grid.getBoundingClientRect().width).toBeLessThanOrEqual(
		parent.getBoundingClientRect().width + 1,
	);
	expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
		grid.getBoundingClientRect().right + 1,
	);
});

test('keeps the inline axis under RTL and vertical writing mode', () => {
	const { locator } = render(
		<div>
			<div dir="rtl" style={{ inlineSize: '36rem' }}>
				<AutoGrid data-testid="grid-rtl" gap="sp8" minColumnInlineSize="10rem">
					<span data-testid="rtl-first" style={{ blockSize: '1rem' }} />
					<span data-testid="rtl-second" style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</AutoGrid>
			</div>
			<div style={{ inlineSize: '36rem', writingMode: 'vertical-rl' }}>
				<AutoGrid data-testid="grid-vertical" gap="sp8" minColumnInlineSize="10rem">
					<span data-testid="vertical-first" style={{ blockSize: '1rem' }} />
					<span data-testid="vertical-second" style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</AutoGrid>
			</div>
		</div>,
	);
	const rtl = locator.getByTestId('grid-rtl').element();
	const vertical = locator.getByTestId('grid-vertical').element();
	const rtlFirst = locator.getByTestId('rtl-first').element();
	const rtlSecond = locator.getByTestId('rtl-second').element();
	const verticalFirst = locator.getByTestId('vertical-first').element();
	const verticalSecond = locator.getByTestId('vertical-second').element();
	if (
		!(rtl instanceof HTMLElement) ||
		!(vertical instanceof HTMLElement) ||
		!(rtlFirst instanceof HTMLElement) ||
		!(rtlSecond instanceof HTMLElement) ||
		!(verticalFirst instanceof HTMLElement) ||
		!(verticalSecond instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(getComputedStyle(rtl).display).toBe('grid');
	expect(getComputedStyle(vertical).display).toBe('grid');
	expect(rtlFirst.getBoundingClientRect().left).toBeGreaterThan(
		rtlSecond.getBoundingClientRect().left,
	);
	expect(verticalSecond.getBoundingClientRect().top).toBeGreaterThan(
		verticalFirst.getBoundingClientRect().top,
	);
});

test('applies root layout props and ignores unsupported Box utilities from an object spread', () => {
	const props = {
		borderStyle: 'solid',
		borderWidth: 'thick',
		gap: 'sp8',
		inlineSize: '10rem',
		minColumnInlineSize: '6rem',
		padding: 'sp16',
	} as const;
	const { locator } = render(
		<div data-testid="container" style={{ inlineSize: '20rem' }}>
			<AutoGrid {...props} data-testid="grid">
				<span style={{ blockSize: '1rem' }} />
			</AutoGrid>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	const element = locator.getByTestId('grid').element();
	if (!(container instanceof HTMLElement) || !(element instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(element.getBoundingClientRect().width).toBeLessThan(
		container.getBoundingClientRect().width,
	);
	expect(element.offsetWidth).toBe(element.clientWidth);
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const ref = createRef<HTMLElement>();
	const semanticResult = render(
		<AutoGrid aria-label="Items" elementType="ul" gap="sp8" minColumnInlineSize="8rem">
			<li>First</li>
			<li>Second</li>
		</AutoGrid>,
	);
	const list = semanticResult.locator.getByRole('list', { name: 'Items' });
	expect(list.element().tagName).toBe('UL');

	const customResult = render(
		<AutoGrid
			ref={ref}
			gap="sp8"
			minColumnInlineSize="8rem"
			render={(resolvedProps) => <section {...resolvedProps} data-testid="auto-grid-render" />}
		>
			<span>One</span>
			<span>Two</span>
		</AutoGrid>,
	);
	const section = customResult.locator.getByTestId('auto-grid-render').element();
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
				<div style={{ inlineSize: '36rem' }}>
					<AutoGrid
						gap="sp8"
						minColumnInlineSize="10rem"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>Item one</span>
						<span style={itemStyle}>Item two</span>
						<span style={itemStyle}>Item three</span>
						<span style={itemStyle}>Item four</span>
						<span style={itemStyle}>Item five</span>
						<span style={itemStyle}>Item six</span>
					</AutoGrid>
				</div>
				<div style={{ inlineSize: '8rem' }}>
					<AutoGrid
						gap="sp8"
						minColumnInlineSize="12rem"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>Narrow parent</span>
						<span style={itemStyle}>Still fits</span>
					</AutoGrid>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'auto-grid/kitchen-sink', appearance);
	}
});
