import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Grid, GridItem } from '@luke-ui/react/grid';
import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('creates equal explicit columns', () => {
	const { locator } = render(
		<Grid columns={3} data-testid="grid" gap="space.8" style={{ inlineSize: '30rem' }}>
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

test('keeps consumer className and style alongside grid presentation', () => {
	const { locator } = render(
		<Grid
			className="consumer-grid"
			columns={2}
			data-testid="grid"
			gap="space.8"
			style={{ backgroundColor: 'rgb(4, 5, 6)', inlineSize: '20rem', position: 'relative' }}
		>
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Grid>,
	);
	const element = locator.getByTestId('grid').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Grid element.');
	const style = getComputedStyle(element);

	expect(element.className.split(/\s+/)).toContain('consumer-grid');
	expect(style.display).toBe('grid');
	expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
	expect(style.position).toBe('relative');
	expect(style.inlineSize).toBe('320px');
});

test('applies a CSS track list passed to columns', () => {
	const { locator } = render(
		<Grid columns="12rem 1fr" data-testid="grid" style={{ inlineSize: '40rem' }}>
			<span data-testid="fixed" style={{ blockSize: '1rem' }} />
			<span data-testid="flexible" style={{ blockSize: '1rem' }} />
		</Grid>,
	);
	const fixed = locator.getByTestId('fixed').element();
	const flexible = locator.getByTestId('flexible').element();
	if (!(fixed instanceof HTMLElement) || !(flexible instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(fixed.getBoundingClientRect().width).toBeCloseTo(192, 0);
	expect(flexible.getBoundingClientRect().width).toBeCloseTo(448, 0);
	expect(fixed.getBoundingClientRect().top).toBe(flexible.getBoundingClientRect().top);
});

test('rejects "3" as columns and keeps one implicit column', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	const { locator } = render(
		<Grid columns={{ initial: '3' }} data-testid="grid" style={{ inlineSize: '40rem' }}>
			<span style={{ blockSize: '1rem' }}>First</span>
			<span style={{ blockSize: '1rem' }}>Second</span>
		</Grid>,
	);
	const element = locator.getByTestId('grid').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Grid element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(getComputedStyle(element).display).toBe('grid');
	expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().top);
	expect(consoleError).toHaveBeenCalledTimes(1);
	expect(consoleError.mock.calls[0]?.[0]).toMatch(/'columns'.*CSS track list/);

	consoleError.mockRestore();
});

test('does not reject "3 " as a columns string', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	render(
		<Grid columns="3 " data-testid="grid" style={{ inlineSize: '40rem' }}>
			<span style={{ blockSize: '1rem' }} />
		</Grid>,
	);

	expect(consoleError).not.toHaveBeenCalled();

	consoleError.mockRestore();
});

test('applies a CSS track list passed to rows', () => {
	const { locator } = render(
		<Grid columns={1} data-testid="grid" rows="3rem 5rem">
			<span data-testid="first" />
			<span data-testid="second" />
		</Grid>,
	);
	const first = locator.getByTestId('first').element();
	const second = locator.getByTestId('second').element();
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(first.getBoundingClientRect().height).toBeCloseTo(48, 0);
	expect(second.getBoundingClientRect().height).toBeCloseTo(80, 0);
});

test('places children in named areas', () => {
	const { locator } = render(
		<Grid areas={['a b', 'c c']} columns={2} data-testid="grid" style={{ inlineSize: '30rem' }}>
			<GridItem area="c" data-testid="c" style={{ blockSize: '1rem' }} />
			<GridItem area="a" data-testid="a" style={{ blockSize: '1rem' }} />
			<GridItem area="b" data-testid="b" style={{ blockSize: '1rem' }} />
		</Grid>,
	);
	const grid = locator.getByTestId('grid').element();
	const a = locator.getByTestId('a').element();
	const b = locator.getByTestId('b').element();
	const c = locator.getByTestId('c').element();
	if (
		!(grid instanceof HTMLElement) ||
		!(a instanceof HTMLElement) ||
		!(b instanceof HTMLElement) ||
		!(c instanceof HTMLElement)
	) {
		throw new Error('Expected Grid elements.');
	}

	expect(a.getBoundingClientRect().top).toBe(b.getBoundingClientRect().top);
	expect(c.getBoundingClientRect().top).toBeGreaterThan(a.getBoundingClientRect().top);
	expect(c.getBoundingClientRect().width).toBeCloseTo(grid.getBoundingClientRect().width, 0);
});

for (const invalidAreas of [[], ['a b', 'c'], ['a a', 'a b']]) {
	test(`rejects ${JSON.stringify(invalidAreas)} as areas and keeps auto-placement`, () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { locator } = render(
			<Grid areas={invalidAreas} columns={2} data-testid="grid" style={{ inlineSize: '30rem' }}>
				<span data-testid="first" style={{ blockSize: '1rem' }} />
				<span data-testid="second" style={{ blockSize: '1rem' }} />
			</Grid>,
		);
		const grid = locator.getByTestId('grid').element();
		const first = locator.getByTestId('first').element();
		const second = locator.getByTestId('second').element();
		if (
			!(grid instanceof HTMLElement) ||
			!(first instanceof HTMLElement) ||
			!(second instanceof HTMLElement)
		) {
			throw new Error('Expected Grid elements.');
		}

		expect(getComputedStyle(grid).gridTemplateAreas).toBe('none');
		expect(first.getBoundingClientRect().top).toBe(second.getBoundingClientRect().top);
		expect(second.getBoundingClientRect().left).toBeGreaterThan(first.getBoundingClientRect().left);
		expect(consoleError).toHaveBeenCalledTimes(1);
		expect(consoleError.mock.calls[0]?.[0]).toMatch(/'areas'/);

		consoleError.mockRestore();
	});
}

for (const validAreas of [['a b'], ['a..b', 'c d e']]) {
	test(`accepts ${JSON.stringify(validAreas)} as areas`, () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { locator } = render(
			<Grid areas={validAreas} data-testid="grid">
				<span />
			</Grid>,
		);
		const grid = locator.getByTestId('grid').element();
		if (!(grid instanceof HTMLElement)) throw new Error('Expected Grid element.');

		expect(getComputedStyle(grid).gridTemplateAreas).not.toBe('none');
		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
}

test('lets columnGap override gap', () => {
	const { locator } = render(
		<Grid columnGap="space.24" columns={2} data-testid="grid" gap="space.8">
			<span />
			<span />
		</Grid>,
	);
	const element = locator.getByTestId('grid').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Grid element.');

	expect(getComputedStyle(element).columnGap).toBe('24px');
	expect(getComputedStyle(element).rowGap).toBe('8px');
});

test('does not overflow a parent narrower than the auto-fit minimum', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '10rem' }}>
			<Grid
				columns="repeat(auto-fit, minmax(min(12rem, 100%), 1fr))"
				data-testid="grid"
				gap="space.8"
			>
				<span style={{ blockSize: '1rem' }}>Item</span>
				<span style={{ blockSize: '1rem' }}>Item</span>
			</Grid>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const grid = locator.getByTestId('grid').element();
	if (!(parent instanceof HTMLElement) || !(grid instanceof HTMLElement)) {
		throw new Error('Expected Grid elements.');
	}

	expect(grid.getBoundingClientRect().width).toBeLessThanOrEqual(
		parent.getBoundingClientRect().width + 1,
	);
	expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
});

test('lets GridItem span tracks', () => {
	const { locator } = render(
		<Grid columns={4} data-testid="grid" gap="space.8" style={{ inlineSize: '40rem' }}>
			<GridItem column="span 2" data-testid="wide" style={{ blockSize: '1rem' }} />
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

test('resolves responsive columns against nested size containers', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container
			maxInlineSize="container.1280"
			style={{ maxInlineSize: '100%' }}
			paddingInline="space.16"
		>
			<Grid columns={{ initial: 1, bp768: '1fr 1fr 1fr 1fr' }} data-testid="outer" gap="space.8">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
			<Container maxInlineSize="container.448">
				<Grid columns={{ initial: 1, bp768: '1fr 1fr 1fr 1fr' }} data-testid="nested" gap="space.8">
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
			<Grid columns={{ initial: 2, bp768: 4 }} data-testid="grid" gap="space.8">
				<GridItem
					column={{ initial: 'span 2', bp768: 'span 2' }}
					data-testid="span"
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

test('keeps the inline axis under RTL', () => {
	const { locator } = render(
		<div dir="rtl" style={{ inlineSize: '30rem' }}>
			<Grid columns={3} data-testid="grid-rtl" gap="space.8">
				<span data-testid="rtl-first" style={{ blockSize: '1rem' }} />
				<span data-testid="rtl-second" style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
		</div>,
	);
	const rtlFirst = locator.getByTestId('rtl-first').element();
	const rtlSecond = locator.getByTestId('rtl-second').element();
	if (!(rtlFirst instanceof HTMLElement) || !(rtlSecond instanceof HTMLElement)) {
		throw new Error('Expected Grid children.');
	}

	expect(rtlFirst.getBoundingClientRect().left).toBeGreaterThan(
		rtlSecond.getBoundingClientRect().left,
	);
});

test('does not let long unbreakable content expand equal grid tracks', () => {
	const { locator } = render(
		<Grid columns={2} data-testid="grid" gap="space.8" style={{ inlineSize: '20rem' }}>
			<span data-testid="long">
				supercalifragilisticexpialidocioussupercalifragilisticexpialidocious
			</span>
			<span data-testid="short">Short</span>
		</Grid>,
	);
	const long = locator.getByTestId('long').element();
	const short = locator.getByTestId('short').element();
	if (!(long instanceof HTMLElement) || !(short instanceof HTMLElement)) {
		throw new Error('Expected Grid elements.');
	}

	expect(long.getBoundingClientRect().width).toBeCloseTo(short.getBoundingClientRect().width, 1);
});

test('places GridItem on explicit column and row lines', () => {
	const { locator } = render(
		<Grid
			columns={4}
			data-testid="grid"
			gap="space.8"
			rows="2rem 2rem 2rem"
			style={{ inlineSize: '40rem' }}
		>
			<GridItem column="2 / 4" data-testid="lines" row="2 / 3" />
			<GridItem column="1 / -1" data-testid="full" row="3" />
			<GridItem column="auto" data-testid="auto" row="1" />
		</Grid>,
	);
	const grid = expectHtmlElement(locator.getByTestId('grid').element(), 'Expected Grid element.');
	const lines = expectHtmlElement(locator.getByTestId('lines').element(), 'Expected GridItem.');
	const full = expectHtmlElement(locator.getByTestId('full').element(), 'Expected GridItem.');
	const auto = expectHtmlElement(locator.getByTestId('auto').element(), 'Expected GridItem.');
	const gridRect = grid.getBoundingClientRect();
	const columnWidth = (gridRect.width - 3 * 8) / 4;

	expect(getComputedStyle(lines).gridColumnStart).toBe('2');
	expect(getComputedStyle(lines).gridColumnEnd).toBe('4');
	expect(getComputedStyle(lines).gridRowStart).toBe('2');
	expect(getComputedStyle(lines).gridRowEnd).toBe('3');
	expect(lines.getBoundingClientRect().left - gridRect.left).toBeCloseTo(columnWidth + 8, 0);
	expect(lines.getBoundingClientRect().width).toBeCloseTo(columnWidth * 2 + 8, 0);
	expect(lines.getBoundingClientRect().top - gridRect.top).toBeCloseTo(32 + 8, 0);
	expect(full.getBoundingClientRect().width).toBeCloseTo(gridRect.width, 0);
	expect(full.getBoundingClientRect().top).toBeGreaterThan(lines.getBoundingClientRect().top);
	expect(getComputedStyle(auto).gridColumnStart).toBe('auto');
	expect(auto.getBoundingClientRect().width).toBeCloseTo(columnWidth, 0);
});

test('spans rows and columns with GridItem', () => {
	const { locator } = render(
		<Grid
			columns={3}
			data-testid="grid"
			gap="space.8"
			rows="2rem 2rem"
			style={{ inlineSize: '30rem' }}
		>
			<GridItem column="span 2" data-testid="wide" row="span 2" />
			<span data-testid="narrow" />
		</Grid>,
	);
	const grid = expectHtmlElement(locator.getByTestId('grid').element(), 'Expected Grid element.');
	const wide = expectHtmlElement(locator.getByTestId('wide').element(), 'Expected GridItem.');
	const narrow = expectHtmlElement(locator.getByTestId('narrow').element(), 'Expected span.');
	const columnWidth = (grid.getBoundingClientRect().width - 2 * 8) / 3;

	expect(getComputedStyle(wide).gridColumnStart).toBe('span 2');
	expect(getComputedStyle(wide).gridRowStart).toBe('span 2');
	expect(wide.getBoundingClientRect().width).toBeCloseTo(columnWidth * 2 + 8, 0);
	expect(wide.getBoundingClientRect().height).toBeCloseTo(32 * 2 + 8, 0);
	expect(narrow.getBoundingClientRect().left).toBeGreaterThan(wide.getBoundingClientRect().right);
});

test('resolves responsive GridItem placement against nested size containers', async () => {
	await page.viewport(1024, 800);
	const column = { initial: 'span 1', bp768: 'span 3' } as const;
	const { locator } = render(
		<Container maxInlineSize="container.1280" paddingInline="space.16">
			<Grid columns={4} data-testid="outer" gap="space.8">
				<GridItem column={column} data-testid="outer-item" style={{ blockSize: '1rem' }} />
			</Grid>
			<Container maxInlineSize="container.448">
				<Grid columns={4} data-testid="nested" gap="space.8">
					<GridItem column={column} data-testid="nested-item" style={{ blockSize: '1rem' }} />
				</Grid>
			</Container>
		</Container>,
	);
	const outerItem = expectHtmlElement(
		locator.getByTestId('outer-item').element(),
		'Expected item.',
	);
	const nestedItem = expectHtmlElement(
		locator.getByTestId('nested-item').element(),
		'Expected item.',
	);
	const outerGrid = expectHtmlElement(locator.getByTestId('outer').element(), 'Expected Grid.');
	const nestedGrid = expectHtmlElement(locator.getByTestId('nested').element(), 'Expected Grid.');
	const outerColumn = (outerGrid.getBoundingClientRect().width - 3 * 8) / 4;
	const nestedColumn = (nestedGrid.getBoundingClientRect().width - 3 * 8) / 4;

	expect(getComputedStyle(outerItem).gridColumnStart).toBe('span 3');
	expect(outerItem.getBoundingClientRect().width).toBeCloseTo(outerColumn * 3 + 16, 0);
	expect(getComputedStyle(nestedItem).gridColumnStart).toBe('span 1');
	expect(nestedItem.getBoundingClientRect().width).toBeCloseTo(nestedColumn, 0);
});

test('places responsive named areas', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ inlineSize: '48rem' }}>
			<Grid
				areas={{ initial: ['a', 'b'], bp768: ['a b'] }}
				columns={{ initial: 1, bp768: 2 }}
				data-testid="grid"
			>
				<GridItem
					area={{ initial: 'a', bp768: 'b' }}
					data-testid="first"
					style={{ blockSize: '1rem' }}
				/>
				<GridItem
					area={{ initial: 'b', bp768: 'a' }}
					data-testid="second"
					style={{ blockSize: '1rem' }}
				/>
			</Grid>
		</div>,
	);
	const first = expectHtmlElement(locator.getByTestId('first').element(), 'Expected item.');
	const second = expectHtmlElement(locator.getByTestId('second').element(), 'Expected item.');

	await expect.poll(() => getComputedStyle(first).gridArea).toContain('a');
	expect(first.getBoundingClientRect().top).toBeLessThan(second.getBoundingClientRect().top);

	await page.viewport(breakpoints.bp768, 800);
	await expect.poll(() => getComputedStyle(first).gridArea).toContain('b');
	expect(first.getBoundingClientRect().left).toBeGreaterThan(second.getBoundingClientRect().left);
});

test('GridItem forwards DOM props and a ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Grid columns={1}>
			<GridItem {...forwardedDomProps} elementType="section" ref={ref}>
				Content
			</GridItem>
		</Grid>,
	);
	const target = expectHtmlElement(container.querySelector('section'), 'Expected a section.');

	expectForwardsDomProps(target, ref);
	expect(target.parentElement).toBe(container.firstElementChild);
});

test('GridItem composes with Box through renderRoot without a wrapper', () => {
	const ref = createRef<HTMLElement>();
	const { locator, unmount } = render(
		<Grid columns={3} data-testid="grid" gap="space.8" style={{ inlineSize: '30rem' }}>
			<GridItem
				className="consumer-class"
				column="span 2"
				ref={ref}
				renderRoot={(props) => (
					<Box
						{...props}
						aria-label="Summary"
						data-testid="item"
						elementType="section"
						padding="space.16"
					/>
				)}
				style={{ backgroundColor: 'rgb(4, 5, 6)' }}
			>
				Content
			</GridItem>
		</Grid>,
	);
	const grid = expectHtmlElement(locator.getByTestId('grid').element(), 'Expected Grid.');
	const item = locator.getByRole('region', { name: 'Summary' }).element();
	const style = getComputedStyle(item);

	expect(grid.children).toHaveLength(1);
	expect(grid.firstElementChild).toBe(item);
	expect(item.tagName).toBe('SECTION');
	expect(item).toHaveClass('consumer-class');
	expect(item).toHaveAttribute('data-testid', 'item');
	expect(style.gridColumnStart).toBe('span 2');
	expect(style.paddingTop).toBe('16px');
	expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
	expect(ref.current).toBe(item);
	unmount();
	expect(ref.current).toBeNull();
});

test('GridItem composes with a nested Stack through renderRoot', () => {
	const ref = createRef<HTMLElement>();
	const { locator, unmount } = render(
		<Grid columns={2} data-testid="grid" gap="space.8" style={{ inlineSize: '20rem' }}>
			<GridItem
				className="consumer-class"
				column="span 2"
				ref={ref}
				renderRoot={(props) => (
					<Stack {...props} aria-label="Pair" elementType="section" gap="space.12" />
				)}
				style={{ backgroundColor: 'rgb(4, 5, 6)' }}
			>
				<span>First</span>
				<span>Second</span>
			</GridItem>
		</Grid>,
	);
	const grid = expectHtmlElement(locator.getByTestId('grid').element(), 'Expected Grid.');
	const stack = locator.getByRole('region', { name: 'Pair' }).element();
	const style = getComputedStyle(stack);

	expect(grid.children).toHaveLength(1);
	expect(grid.firstElementChild).toBe(stack);
	expect(stack.tagName).toBe('SECTION');
	expect(stack).toHaveAttribute('aria-label', 'Pair');
	expect(stack).toHaveClass('consumer-class');
	expect(style.display).toBe('flex');
	expect(style.flexDirection).toBe('column');
	expect(style.rowGap).toBe('12px');
	expect(style.gridColumnStart).toBe('span 2');
	expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
	expect(stack.getBoundingClientRect().width).toBeCloseTo(grid.getBoundingClientRect().width, 0);
	expect(ref.current).toBe(stack);
	unmount();
	expect(ref.current).toBeNull();
});

test('GridItem preserves callback ref cleanup through renderRoot', () => {
	const elements: Array<HTMLElement | null> = [];
	let cleanups = 0;
	const { locator, unmount } = render(
		<Grid columns={1}>
			<GridItem
				ref={(element) => {
					elements.push(element);
					return () => {
						cleanups += 1;
					};
				}}
				renderRoot={(props) => <Box {...props} aria-label="Owned root" elementType="section" />}
			/>
		</Grid>,
	);

	expect(elements).toEqual([locator.getByRole('region', { name: 'Owned root' }).element()]);
	unmount();
	expect(cleanups).toBe(1);
	expect(elements).toHaveLength(1);
});

const itemStyle = {
	backgroundColor: vars.color.background.surface.base,
	borderRadius: vars.radius.detail,
	color: vars.color.foreground.primary,
	paddingBlock: vars.space['8'],
	paddingInline: vars.space['12'],
} as const;

const sceneStyle = {
	backgroundColor: vars.color.background.surface.subdued,
	borderRadius: vars.radius.surface,
	color: vars.color.foreground.primary,
	padding: vars.space['16'],
} as const;

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space['16'] }}>
				<Grid columns={4} gap="space.8" style={{ ...sceneStyle, inlineSize: '36rem' }}>
					<GridItem column="span 2" style={itemStyle}>
						Wide
					</GridItem>
					<span style={itemStyle}>A</span>
					<span style={itemStyle}>B</span>
					<span style={itemStyle}>C</span>
					<span style={itemStyle}>D</span>
					<GridItem column="span 2" style={itemStyle}>
						Wide again
					</GridItem>
				</Grid>
				<Grid
					columns="repeat(auto-fit, minmax(min(10rem, 100%), 1fr))"
					gap="space.8"
					style={{ ...sceneStyle, inlineSize: '36rem' }}
				>
					<span style={itemStyle}>Auto one</span>
					<span style={itemStyle}>Auto two</span>
					<span style={itemStyle}>Auto three</span>
					<span style={itemStyle}>Auto four</span>
				</Grid>
				<Grid
					areas={['a a b', 'c d b']}
					columns="1fr 1fr 8rem"
					gap="space.8"
					rows="auto 4rem"
					style={{ ...sceneStyle, inlineSize: '36rem' }}
				>
					<GridItem area="a" style={itemStyle}>
						Area A
					</GridItem>
					<GridItem area="b" style={itemStyle}>
						Area B
					</GridItem>
					<GridItem area="c" style={itemStyle}>
						Area C
					</GridItem>
					<GridItem area="d" style={itemStyle}>
						Area D
					</GridItem>
				</Grid>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'grid/kitchen-sink', appearance);
	}
});
