import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Grid } from '@luke-ui/react/grid';
import { vars } from '@luke-ui/react/theme';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

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

test('keeps consumer className and style alongside grid presentation', () => {
	const { locator } = render(
		<Grid
			className="consumer-grid"
			columns={2}
			data-testid="grid"
			gap="sp8"
			inlineSize="20rem"
			style={{ backgroundColor: 'rgb(4, 5, 6)', position: 'relative' }}
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
		<Grid columns="12rem 1fr" data-testid="grid" inlineSize="40rem">
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

for (const invalidColumns of ['', '   ', '3']) {
	test(`rejects ${JSON.stringify(invalidColumns)} as columns and keeps one implicit column`, () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { locator } = render(
			<Grid columns={{ initial: invalidColumns }} data-testid="grid" inlineSize="40rem">
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
}

for (const columns of ['3 ', ' 3', '-1', '1.5', '+3']) {
	test(`does not reject ${JSON.stringify(columns)} as a columns string`, () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		render(
			<Grid columns={columns} data-testid="grid" inlineSize="40rem">
				<span style={{ blockSize: '1rem' }} />
			</Grid>,
		);

		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
}

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
		<Grid areas={['a b', 'c c']} columns={2} data-testid="grid" inlineSize="30rem">
			<Box data-testid="c" gridArea="c" style={{ blockSize: '1rem' }} />
			<Box data-testid="a" gridArea="a" style={{ blockSize: '1rem' }} />
			<Box data-testid="b" gridArea="b" style={{ blockSize: '1rem' }} />
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

for (const invalidAreas of [
	[],
	['   '],
	['a "b"'],
	['a b', 'c'],
	['a..b', 'c'],
	['a a', 'a b'],
	['a b a'],
	['a# b'],
	['a/b c'],
	['a\nb'],
	['a\rb'],
	['a\fb'],
]) {
	test(`rejects ${JSON.stringify(invalidAreas)} as areas and keeps auto-placement`, () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { locator } = render(
			<Grid areas={invalidAreas} columns={2} data-testid="grid" inlineSize="30rem">
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

for (const validAreas of [['a b'], ['a\tb'], ['1 2'], ['a-b c_d'], ['é ü'], ['a..b', 'c d e']]) {
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
		<Grid columnGap="sp24" columns={2} data-testid="grid" gap="sp8">
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
			<Grid columns="repeat(auto-fit, minmax(min(12rem, 100%), 1fr))" data-testid="grid" gap="sp8">
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

test('resolves responsive columns against nested size containers', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container maxInlineSize="100%" paddingInline="sp16">
			<Grid columns={{ initial: 1, bp768: '1fr 1fr 1fr 1fr' }} data-testid="outer" gap="sp8">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Grid>
			<Container maxInlineSize="ct448">
				<Grid columns={{ initial: 1, bp768: '1fr 1fr 1fr 1fr' }} data-testid="nested" gap="sp8">
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

test('keeps the inline axis under RTL', () => {
	const { locator } = render(
		<div dir="rtl" style={{ inlineSize: '30rem' }}>
			<Grid columns={3} data-testid="grid-rtl" gap="sp8">
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
		<Grid columns={2} data-testid="grid" gap="sp8" inlineSize="20rem">
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

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

const sceneStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderRadius: vars.radius.surface,
	color: vars.color.text.primary,
	padding: vars.space.sp16,
} as const;

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				<Grid columns={4} gap="sp8" style={{ ...sceneStyle, inlineSize: '36rem' }}>
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
				<Grid
					columns="repeat(auto-fit, minmax(min(10rem, 100%), 1fr))"
					gap="sp8"
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
					gap="sp8"
					rows="auto 4rem"
					style={{ ...sceneStyle, inlineSize: '36rem' }}
				>
					<Box gridArea="a" style={itemStyle}>
						Area A
					</Box>
					<Box gridArea="b" style={itemStyle}>
						Area B
					</Box>
					<Box gridArea="c" style={itemStyle}>
						Area C
					</Box>
					<Box gridArea="d" style={itemStyle}>
						Area D
					</Box>
				</Grid>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'grid/kitchen-sink', appearance);
	}
});
