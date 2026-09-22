import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Container } from '@luke-ui/react/container';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test, vi } from 'vite-plus/test';
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

test('rejects an empty or whitespace-only minColumnInlineSize and skips auto-fit sizing', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

	const { locator: emptyLocator } = render(
		<div style={{ inlineSize: '40rem' }}>
			<AutoGrid data-testid="grid-empty" gap="sp8" minColumnInlineSize="">
				<span style={{ blockSize: '1rem' }}>First</span>
				<span style={{ blockSize: '1rem' }}>Second</span>
				<span style={{ blockSize: '1rem' }}>Third</span>
			</AutoGrid>
		</div>,
	);
	const { locator: whitespaceLocator } = render(
		<div style={{ inlineSize: '40rem' }}>
			<AutoGrid data-testid="grid-whitespace" gap="sp8" minColumnInlineSize={{ initial: '   ' }}>
				<span style={{ blockSize: '1rem' }}>First</span>
				<span style={{ blockSize: '1rem' }}>Second</span>
				<span style={{ blockSize: '1rem' }}>Third</span>
			</AutoGrid>
		</div>,
	);
	const emptyElement = emptyLocator.getByTestId('grid-empty').element();
	const whitespaceElement = whitespaceLocator.getByTestId('grid-whitespace').element();
	if (!(emptyElement instanceof HTMLElement) || !(whitespaceElement instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid elements.');
	}
	const [emptyFirst, emptySecond] = emptyElement.children;
	const [whitespaceFirst, whitespaceSecond] = whitespaceElement.children;
	if (
		!(emptyFirst instanceof HTMLElement) ||
		!(emptySecond instanceof HTMLElement) ||
		!(whitespaceFirst instanceof HTMLElement) ||
		!(whitespaceSecond instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid children.');
	}

	// The recipe's base `display: grid` still applies, but a rejected value never assigns the
	// responsive `grid-template-columns`, so the grid keeps its implicit single full-width track
	// and children stack instead of sharing a row, unlike the auto-fit tracks a valid value produces.
	expect(getComputedStyle(emptyElement).display).toBe('grid');
	expect(emptySecond.getBoundingClientRect().top).toBeGreaterThan(
		emptyFirst.getBoundingClientRect().top,
	);
	expect(getComputedStyle(whitespaceElement).display).toBe('grid');
	expect(whitespaceSecond.getBoundingClientRect().top).toBeGreaterThan(
		whitespaceFirst.getBoundingClientRect().top,
	);

	expect(consoleError).toHaveBeenCalledTimes(2);
	for (const call of consoleError.mock.calls) {
		expect(call[0]).toMatch(/minColumnInlineSize/);
		expect(call[0]).toMatch(/non-empty string/);
	}

	consoleError.mockRestore();
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

test('expands a sparse item across collapsed auto-fit tracks', () => {
	const { locator } = render(
		<div style={{ inlineSize: '40rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="12rem">
				<span data-testid="only" style={{ blockSize: '1rem' }}>
					Only item
				</span>
			</AutoGrid>
		</div>,
	);
	const grid = locator.getByTestId('grid').element();
	const only = locator.getByTestId('only').element();
	if (!(grid instanceof HTMLElement) || !(only instanceof HTMLElement)) {
		throw new Error('Expected AutoGrid elements.');
	}

	const gridWidth = grid.getBoundingClientRect().width;
	const itemWidth = only.getBoundingClientRect().width;
	// auto-fit collapses empty tracks, so the lone item fills the grid. auto-fill would leave it
	// near the minimum column size instead.
	expect(itemWidth).toBeGreaterThan(gridWidth - 2);
	expect(itemWidth).toBeLessThanOrEqual(gridWidth + 1);
});

test('resolves responsive values against nested size containers', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container maxInlineSize="100%">
			<AutoGrid
				data-testid="outer"
				gap="sp8"
				minColumnInlineSize={{ initial: '20rem', bp768: '10rem' }}
			>
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</AutoGrid>
			<Container maxInlineSize="ct448">
				<AutoGrid
					data-testid="nested"
					gap="sp8"
					minColumnInlineSize={{ initial: '20rem', bp768: '10rem' }}
				>
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
		throw new Error('Expected AutoGrid children.');
	}

	// Outer container is viewport-wide (≥ bp768), so minColumnInlineSize is 10rem and items share a
	// row. Nested ct448 is below bp768, so the initial 20rem minimum stacks items.
	expect(outerFirst.getBoundingClientRect().top).toBe(outerSecond.getBoundingClientRect().top);
	expect(nestedSecond.getBoundingClientRect().top).toBeGreaterThan(
		nestedFirst.getBoundingClientRect().top,
	);
});

test('does not let long unbreakable content expand auto-fit tracks', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '24rem' }}>
			<AutoGrid data-testid="grid" gap="sp8" minColumnInlineSize="10rem">
				<span data-testid="long">
					supercalifragilisticexpialidocioussupercalifragilisticexpialidocious
				</span>
				<span data-testid="short">Short</span>
			</AutoGrid>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const grid = locator.getByTestId('grid').element();
	const long = locator.getByTestId('long').element();
	const short = locator.getByTestId('short').element();
	if (
		!(parent instanceof HTMLElement) ||
		!(grid instanceof HTMLElement) ||
		!(long instanceof HTMLElement) ||
		!(short instanceof HTMLElement)
	) {
		throw new Error('Expected AutoGrid elements.');
	}

	expect(grid.getBoundingClientRect().width).toBeLessThanOrEqual(
		parent.getBoundingClientRect().width + 1,
	);
	expect(long.getBoundingClientRect().width).toBeCloseTo(short.getBoundingClientRect().width, 1);
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
