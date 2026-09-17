import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { Box } from '../box/box.js';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Container } from './container.js';

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

test('lets utility and style margins override its default centring', () => {
	const { locator } = render(
		<div style={{ inlineSize: '800px' }}>
			<Container data-testid="utility" marginInline="0" maxInlineSize="ct448">
				Utility margin
			</Container>
			<Container data-testid="style" maxInlineSize="ct448" style={{ marginInline: '32px 0' }}>
				Style margin
			</Container>
		</div>,
	);
	const utility = locator.getByTestId('utility').element();
	const style = locator.getByTestId('style').element();
	if (!(utility instanceof HTMLElement) || !(style instanceof HTMLElement)) {
		throw new Error('Expected Container elements.');
	}

	expect(getComputedStyle(utility).marginInlineStart).toBe('0px');
	expect(getComputedStyle(style).marginInlineStart).toBe('32px');
});

test('uses the content box for responsive descendants at breakpoint boundaries', async () => {
	await page.viewport(799, 800);
	const { locator } = render(
		<Container maxInlineSize="100%" paddingInline="sp16">
			<Box data-testid="responsive" display={{ initial: 'block', bp768: 'flex' }}>
				<Container maxInlineSize="100%">
					<Box data-testid="nested" display={{ initial: 'block', bp768: 'flex' }} />
				</Container>
			</Box>
		</Container>,
	);
	const responsive = locator.getByTestId('responsive').element();
	const nested = locator.getByTestId('nested').element();
	if (!(responsive instanceof HTMLElement) || !(nested instanceof HTMLElement)) {
		throw new Error('Expected responsive descendants.');
	}

	expect(getComputedStyle(responsive).display).toBe('block');
	expect(getComputedStyle(nested).display).toBe('block');

	await page.viewport(800, 800);
	expect(getComputedStyle(responsive).display).toBe('flex');
	expect(getComputedStyle(nested).display).toBe('flex');
});

test('lets caller style override maxInlineSize for token and arbitrary values', () => {
	const { locator } = render(
		<div style={{ inlineSize: '800px' }}>
			<Container data-testid="token" maxInlineSize="ct672" style={{ maxInlineSize: '30rem' }}>
				Token
			</Container>
			<Container data-testid="arbitrary" maxInlineSize="42rem" style={{ maxInlineSize: '30rem' }}>
				Arbitrary
			</Container>
		</div>,
	);
	const token = locator.getByTestId('token').element();
	const arbitrary = locator.getByTestId('arbitrary').element();
	if (!(token instanceof HTMLElement) || !(arbitrary instanceof HTMLElement)) {
		throw new Error('Expected Container elements.');
	}

	expect(token.getBoundingClientRect().width).toBe(480);
	expect(arbitrary.getBoundingClientRect().width).toBe(480);
	expect(getComputedStyle(token).maxInlineSize).toBe('30rem');
	expect(getComputedStyle(arbitrary).maxInlineSize).toBe('30rem');
});

test('forwards refs and supports semantic and caller-owned elements', () => {
	const ref = createRef<HTMLElement>();
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
			ref={ref}
			render={(resolvedProps) => <section {...resolvedProps} data-testid="custom-container" />}
		>
			Custom content
		</Container>,
	);
	const element = custom.locator.getByTestId('custom-container').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected custom Container element.');

	expect(ref.current).toBe(element);
	expect(getComputedStyle(element).containerType).toBe('inline-size');
});
