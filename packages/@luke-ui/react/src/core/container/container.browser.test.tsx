import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { Box } from '../box/box.js';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Container } from './container.js';
import { containerMaxInlineSizeTokens } from './recipe.css.js';

afterEach(async () => {
	await page.viewport(1024, 800);
});

testConformance({
	path: 'container',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected Container element.');
		return target;
	},
	render: (props = {}) =>
		render(
			<Container maxInlineSize="ct672" {...props}>
				Content
			</Container>,
		),
});

test('uses its fixed maximum as a border-box width and centres by default', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '800px' }}>
			<Container data-testid="container" maxInlineSize="ct672" paddingInline="sp16">
				Content
			</Container>
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const container = locator.getByTestId('container').element();
	if (!(parent instanceof HTMLElement) || !(container instanceof HTMLElement)) {
		throw new Error('Expected Container elements.');
	}

	expect(container.getBoundingClientRect().width).toBe(672);
	expect(container.getBoundingClientRect().left - parent.getBoundingClientRect().left).toBe(64);
	expect(getComputedStyle(container).boxSizing).toBe('border-box');
	expect(getComputedStyle(container).containerType).toBe('inline-size');
});

for (const [maxInlineSize, pixelValue] of Object.entries(containerMaxInlineSizeTokens)) {
	const expectedWidth = Number.parseInt(pixelValue, 10);

	test(`caps the border box at ${maxInlineSize}`, () => {
		const { locator } = render(
			<div style={{ inlineSize: '1400px' }}>
				<Container data-testid="container" maxInlineSize={maxInlineSize}>
					Content
				</Container>
			</div>,
		);
		const container = locator.getByTestId('container').element();
		if (!(container instanceof HTMLElement)) throw new Error('Expected Container element.');

		expect(container.getBoundingClientRect().width).toBe(expectedWidth);
	});
}

test('lets marginInline override its default centring', () => {
	const { locator } = render(
		<div style={{ inlineSize: '800px' }}>
			<Container data-testid="container" marginInline="0" maxInlineSize="ct448">
				Content
			</Container>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	if (!(container instanceof HTMLElement)) throw new Error('Expected Container element.');

	expect(getComputedStyle(container).marginInlineStart).toBe('0px');
});

test('uses the nearest nested Container as the query boundary', async () => {
	await page.viewport(1024, 800);
	const { locator } = render(
		<Container maxInlineSize="100%" paddingInline="sp16">
			<Box data-testid="outer" display={{ initial: 'block', bp768: 'flex' }} />
			<Container maxInlineSize="ct672">
				<Box data-testid="nested" display={{ initial: 'block', bp768: 'flex' }} />
			</Container>
		</Container>,
	);
	const outer = locator.getByTestId('outer').element();
	const nested = locator.getByTestId('nested').element();
	if (!(outer instanceof HTMLElement) || !(nested instanceof HTMLElement)) {
		throw new Error('Expected responsive descendants.');
	}

	expect(getComputedStyle(outer).display).toBe('flex');
	expect(getComputedStyle(nested).display).toBe('block');
});

test('caps the border box at an arbitrary CSS maxInlineSize', () => {
	const { locator } = render(
		<div style={{ inlineSize: '800px' }}>
			<Container data-testid="container" maxInlineSize="42rem">
				Content
			</Container>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	if (!(container instanceof HTMLElement)) throw new Error('Expected Container element.');

	expect(container.getBoundingClientRect().width).toBe(672);
});

test('forwards refs and supports semantic and caller-owned elements', () => {
	const semantic = render(
		<Container aria-label="Page content" elementType="main" maxInlineSize="ct896">
			Page content
		</Container>,
	);
	expect(semantic.locator.getByRole('main', { name: 'Page content' }).element().tagName).toBe(
		'MAIN',
	);

	const custom = render(
		<Container
			maxInlineSize="ct896"
			render={(resolvedProps) => <section {...resolvedProps} data-testid="custom-container" />}
		>
			Custom content
		</Container>,
	);
	const element = custom.locator.getByTestId('custom-container').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected custom Container element.');

	expect(getComputedStyle(element).containerType).toBe('inline-size');
});
