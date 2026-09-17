import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Cluster } from './cluster.js';

afterEach(async () => {
	await page.viewport(1024, 800);
});

testConformance({
	path: 'cluster',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected Cluster element.');
		return target;
	},
	render: (props = {}) =>
		render(
			<Cluster gap="sp8" {...props}>
				Content
			</Cluster>,
		),
});

test('flows children on the inline axis and always wraps', () => {
	const { locator } = render(
		<Cluster data-testid="cluster" gap="sp12">
			<span>First</span>
			<span>Second</span>
			<span>Third</span>
		</Cluster>,
	);
	const element = locator.getByTestId('cluster').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Cluster element.');

	expect(getComputedStyle(element).display).toBe('flex');
	expect(getComputedStyle(element).flexDirection).toBe('row');
	expect(getComputedStyle(element).flexWrap).toBe('wrap');
	expect(getComputedStyle(element).justifyContent).toBe('flex-start');
	expect(getComputedStyle(element).alignItems).toBe('center');
});

test('uses no gap by default and accepts alignment overrides', () => {
	const { locator } = render(
		<Cluster
			alignItems="stretch"
			data-testid="cluster"
			inlineSize="2rem"
			justifyContent="space-between"
		>
			<span style={{ inlineSize: '1rem' }} />
			<span style={{ inlineSize: '1rem' }} />
		</Cluster>,
	);
	const element = locator.getByTestId('cluster').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Cluster element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Cluster children.');
	}

	expect(getComputedStyle(element).alignItems).toBe('stretch');
	expect(getComputedStyle(element).justifyContent).toBe('space-between');
	expect(second.getBoundingClientRect().left - first.getBoundingClientRect().right).toBe(0);
});

test('wraps when children exceed the inline size', () => {
	const { locator } = render(
		<Cluster data-testid="cluster" gap="sp8" style={{ inlineSize: '8rem' }}>
			<span style={{ inlineSize: '5rem' }}>First</span>
			<span style={{ inlineSize: '5rem' }}>Second</span>
		</Cluster>,
	);
	const element = locator.getByTestId('cluster').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Cluster element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Cluster children.');
	}

	expect(second.offsetTop).toBeGreaterThan(first.offsetTop);
});

test('keeps the inline axis under RTL and vertical writing mode', () => {
	const { locator } = render(
		<div>
			<div dir="rtl" style={{ inlineSize: '6rem' }}>
				<Cluster data-testid="cluster-rtl" gap="sp8">
					<span style={{ inlineSize: '1rem' }} />
					<span style={{ inlineSize: '1rem' }} />
				</Cluster>
			</div>
			<div style={{ inlineSize: '6rem', writingMode: 'vertical-rl' }}>
				<Cluster data-testid="cluster-vertical" gap="sp8">
					<span style={{ inlineSize: '1rem' }} />
					<span style={{ inlineSize: '1rem' }} />
				</Cluster>
			</div>
		</div>,
	);
	const rtl = locator.getByTestId('cluster-rtl').element();
	const vertical = locator.getByTestId('cluster-vertical').element();
	if (!(rtl instanceof HTMLElement) || !(vertical instanceof HTMLElement)) {
		throw new Error('Expected Cluster elements.');
	}

	expect(getComputedStyle(rtl).flexDirection).toBe('row');
	expect(getComputedStyle(rtl).flexWrap).toBe('wrap');
	expect(getComputedStyle(vertical).flexDirection).toBe('row');
	expect(getComputedStyle(vertical).flexWrap).toBe('wrap');

	const [rtlFirst, rtlSecond] = rtl.children;
	const [verticalFirst, verticalSecond] = vertical.children;
	if (
		!(rtlFirst instanceof HTMLElement) ||
		!(rtlSecond instanceof HTMLElement) ||
		!(verticalFirst instanceof HTMLElement) ||
		!(verticalSecond instanceof HTMLElement)
	) {
		throw new Error('Expected Cluster children.');
	}

	expect(rtlFirst.getBoundingClientRect().left).toBeGreaterThan(
		rtlSecond.getBoundingClientRect().left,
	);
	expect(verticalSecond.getBoundingClientRect().top).toBeGreaterThan(
		verticalFirst.getBoundingClientRect().top,
	);
});

test('keeps Cluster defaults below sparse responsive alignment overrides', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<Cluster
			alignItems={{ bp768: 'stretch' }}
			data-testid="cluster"
			gap={{ initial: '0', bp768: 'sp8' }}
			justifyContent={{ bp768: 'center' }}
		>
			<span style={{ inlineSize: '1rem' }}>First</span>
			<span style={{ inlineSize: '1rem' }}>Second</span>
		</Cluster>,
	);
	const element = locator.getByTestId('cluster').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Cluster element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Cluster children.');
	}

	expect(getComputedStyle(element).alignItems).toBe('center');
	expect(getComputedStyle(element).justifyContent).toBe('flex-start');
	expect(second.getBoundingClientRect().left - first.getBoundingClientRect().right).toBe(0);

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(element).alignItems).toBe('stretch');
	expect(getComputedStyle(element).justifyContent).toBe('center');
	expect(second.getBoundingClientRect().left).toBeGreaterThan(first.getBoundingClientRect().right);
});

test('applies root layout props and ignores unsupported Box utilities from an object spread', () => {
	const props = {
		borderStyle: 'solid',
		borderWidth: 'thick',
		gap: 'sp8',
		inlineSize: '10rem',
		padding: 'sp16',
	} as const;
	const { locator } = render(
		<div data-testid="container" style={{ inlineSize: '20rem' }}>
			<Cluster {...props} data-testid="cluster">
				<span style={{ blockSize: '1rem' }} />
			</Cluster>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	const element = locator.getByTestId('cluster').element();
	if (!(container instanceof HTMLElement) || !(element instanceof HTMLElement)) {
		throw new Error('Expected Cluster elements.');
	}
	const child = element.firstElementChild;
	if (!(child instanceof HTMLElement)) throw new Error('Expected Cluster child.');

	expect(element.getBoundingClientRect().width).toBeLessThan(
		container.getBoundingClientRect().width,
	);
	expect(child.getBoundingClientRect().left).toBeGreaterThan(element.getBoundingClientRect().left);
	expect(element.offsetWidth).toBe(element.clientWidth);
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const ref = createRef<HTMLElement>();
	const semanticResult = render(
		<Cluster aria-label="Filters" elementType="ul" gap="sp8">
			<li>Open</li>
			<li>Closed</li>
		</Cluster>,
	);
	const list = semanticResult.locator.getByRole('list', { name: 'Filters' });
	expect(list.element().tagName).toBe('UL');

	const customResult = render(
		<Cluster
			ref={ref}
			gap="sp8"
			render={(resolvedProps) => <nav {...resolvedProps} data-testid="cluster-render" />}
		>
			<span>Home</span>
			<span>About</span>
		</Cluster>,
	);
	const nav = customResult.locator.getByTestId('cluster-render').element();
	if (!(nav instanceof HTMLElement)) throw new Error('Expected render callback element.');

	expect(nav.tagName).toBe('NAV');
	expect(ref.current).toBe(nav);
	expect(getComputedStyle(nav).flexWrap).toBe('wrap');
});
