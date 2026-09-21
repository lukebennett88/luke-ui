import { Cluster } from '@luke-ui/react/cluster';
// Only styles the visual fixture below; no test asserts a resolved token value.
// oxlint-disable-next-line no-restricted-imports
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('Cluster forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Cluster
			gap="sp8"
			className="forwarded-class"
			data-forwarded="true"
			id="forwarded-id"
			ref={ref}
		>
			Content
		</Cluster>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected Cluster element.');

	expectForwardsDomProps(target, ref);
});

afterEach(async () => {
	await page.viewport(1024, 800);
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

test('emits no gap utility when gap is omitted', () => {
	const { locator } = render(
		<Cluster data-testid="cluster">
			<span style={{ inlineSize: '1rem' }} />
			<span style={{ inlineSize: '1rem' }} />
		</Cluster>,
	);
	const element = locator.getByTestId('cluster').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Cluster element.');

	expect(element.className).not.toMatch(/gap/);
	expect(getComputedStyle(element).gap).toBe('normal');
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
				<Cluster
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						inlineSize: '14rem',
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Wrapping</span>
					<span style={itemStyle}>Inline</span>
					<span style={itemStyle}>Items</span>
					<span style={itemStyle}>Share</span>
					<span style={itemStyle}>Space</span>
				</Cluster>
				<Cluster
					alignItems="stretch"
					gap="sp8"
					justifyContent="space-between"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Start</span>
					<span style={itemStyle}>End</span>
				</Cluster>
				<div dir="rtl">
					<Cluster
						elementType="ul"
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							listStyle: 'none',
							margin: 0,
							padding: vars.space.sp16,
						}}
					>
						<li style={itemStyle}>One</li>
						<li style={itemStyle}>Two</li>
						<li style={itemStyle}>Three</li>
					</Cluster>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'cluster/kitchen-sink', appearance);
	}
});
