import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('Stack forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Stack className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</Stack>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected Stack element.');

	expectForwardsDomProps(target, ref);
});

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('flows children on the block axis with no gap by default', () => {
	const { locator } = render(
		<Stack data-testid="stack">
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(getComputedStyle(element).display).toBe('flex');
	expect(getComputedStyle(element).flexDirection).toBe('column');
	expect(getComputedStyle(element).alignItems).toBe('stretch');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Stack children.');
	}

	expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(0);
});

test('emits no gap utility when gap is omitted', () => {
	const { locator } = render(
		<Stack data-testid="stack">
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(element.className).not.toMatch(/gap/);
	expect(getComputedStyle(element).gap).toBe('normal');
});

test('accepts gap and alignItems overrides', () => {
	const { locator } = render(
		<Stack alignItems="center" data-testid="stack" gap="sp8">
			<span>First</span>
			<span>Second</span>
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(getComputedStyle(element).alignItems).toBe('center');
});

test('keeps the block axis under RTL and vertical writing mode', () => {
	const { locator } = render(
		<div>
			<div dir="rtl" style={{ blockSize: '6rem' }}>
				<Stack data-testid="stack-rtl" gap="sp8">
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</Stack>
			</div>
			<div style={{ blockSize: '6rem', writingMode: 'vertical-rl' }}>
				<Stack data-testid="stack-vertical" gap="sp8">
					<span style={{ blockSize: '1rem' }} />
					<span style={{ blockSize: '1rem' }} />
				</Stack>
			</div>
		</div>,
	);
	const rtl = locator.getByTestId('stack-rtl').element();
	const vertical = locator.getByTestId('stack-vertical').element();
	if (!(rtl instanceof HTMLElement) || !(vertical instanceof HTMLElement)) {
		throw new Error('Expected Stack elements.');
	}

	expect(getComputedStyle(rtl).flexDirection).toBe('column');
	expect(getComputedStyle(vertical).flexDirection).toBe('column');

	const [rtlFirst, rtlSecond] = rtl.children;
	const [verticalFirst, verticalSecond] = vertical.children;
	if (
		!(rtlFirst instanceof HTMLElement) ||
		!(rtlSecond instanceof HTMLElement) ||
		!(verticalFirst instanceof HTMLElement) ||
		!(verticalSecond instanceof HTMLElement)
	) {
		throw new Error('Expected Stack children.');
	}

	expect(rtlSecond.getBoundingClientRect().top).toBeGreaterThan(
		rtlFirst.getBoundingClientRect().top,
	);
	expect(verticalSecond.getBoundingClientRect().left).toBeLessThan(
		verticalFirst.getBoundingClientRect().left,
	);
});

test('applies a responsive gap from its required initial value', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<Stack data-testid="stack" gap={{ initial: '0', bp768: 'sp8' }}>
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Stack children.');
	}

	expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(0);

	await page.viewport(breakpoints.bp768, 800);
	expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().bottom);
});

test('keeps Stack defaults below sparse responsive alignment overrides', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<Stack alignItems={{ bp768: 'center' }} data-testid="stack" gap="sp8">
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(getComputedStyle(element).alignItems).toBe('stretch');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(element).alignItems).toBe('center');
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
			<Stack {...props} data-testid="stack">
				<span style={{ blockSize: '1rem' }} />
			</Stack>
		</div>,
	);
	const container = locator.getByTestId('container').element();
	const element = locator.getByTestId('stack').element();
	if (!(container instanceof HTMLElement) || !(element instanceof HTMLElement)) {
		throw new Error('Expected Stack elements.');
	}
	const child = element.firstElementChild;
	if (!(child instanceof HTMLElement)) throw new Error('Expected Stack child.');

	expect(element.getBoundingClientRect().width).toBeLessThan(
		container.getBoundingClientRect().width,
	);
	expect(element.getBoundingClientRect().width).toBeGreaterThan(
		child.getBoundingClientRect().width,
	);
	expect(element.offsetWidth).toBe(element.clientWidth);
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const ref = createRef<HTMLElement>();
	const semanticResult = render(
		<Stack aria-label="Account summary" elementType="section" gap="sp8">
			Account summary content
		</Stack>,
	);
	const section = semanticResult.locator.getByRole('region', { name: 'Account summary' });
	expect(section.element().tagName).toBe('SECTION');

	const customResult = render(
		<Stack
			ref={ref}
			gap="sp8"
			render={(resolvedProps) => <article {...resolvedProps} data-testid="stack-render" />}
		>
			Custom article
		</Stack>,
	);
	const article = customResult.locator.getByTestId('stack-render').element();
	if (!(article instanceof HTMLElement)) throw new Error('Expected render callback element.');

	expect(article.tagName).toBe('ARTICLE');
	expect(ref.current).toBe(article);
	expect(getComputedStyle(article).flexDirection).toBe('column');
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
				<Stack
					gap="sp12"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Block axis</span>
					<span style={itemStyle}>Required gap</span>
				</Stack>
				<Stack
					alignItems="center"
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Aligned</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<Stack
					elementType="section"
					gap="0"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Touching</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<div dir="rtl">
					<Stack
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>First</span>
						<span style={itemStyle}>Second</span>
					</Stack>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'stack/kitchen-sink', appearance);
	}
});
