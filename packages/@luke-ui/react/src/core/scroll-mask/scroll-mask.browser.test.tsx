import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { createRef, useRef, useState } from 'react';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Grid } from '../test-utils/visual.js';
import { logicalEndSide, overflowsOnAxis } from './scroll-mask.js';

test('ScrollMask forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<ScrollMask {...forwardedDomProps} aria-label="Topics" ref={ref}>
			Content
		</ScrollMask>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected ScrollMask element.');

	expectForwardsDomProps(target, ref);
});

test('fitting div has no mask, tab stop, region role, or accessible name', async () => {
	const { locator } = render(
		<ScrollMask
			aria-label="Short list"
			blockSize="6rem"
			data-testid="scroll-mask"
			inlineSize="12rem"
		>
			Fits
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element());

	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('role')).toBeNull();
	expect(element.getAttribute('aria-label')).toBeNull();
	expect(element.getAttribute('aria-labelledby')).toBeNull();
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('overflowing div applies accessible name with the automatic region role', async () => {
	const { locator } = render(
		<ScrollMask aria-label="Wide list" data-testid="scroll-mask" inlineSize="8rem" padding="sp8">
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing inline content for the mask
			</span>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Wide list');
	expect(getComputedStyle(element).overflowInline).toBe('auto');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
	expect(element.dataset.scrollMaskEnd).toBe('right');
});

test('overflowing block content is keyboard-focusable with a region role and mask', async () => {
	const { locator } = render(
		<ScrollMask
			aria-label="Tall list"
			axis="block"
			blockSize="6rem"
			data-testid="scroll-mask"
			inlineSize="12rem"
			padding="sp8"
		>
			<div style={{ blockSize: '18rem' }}>Overflowing block content for the mask</div>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(getComputedStyle(element).overflowBlock).toBe('auto');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
	expect(element.dataset.scrollMaskEnd).toBe('bottom');
});

test('semantic roots keep native semantics and ARIA props without an automatic region role', async () => {
	const { locator } = render(
		<>
			<ScrollMask
				aria-label="Fitting navigation"
				axis="block"
				blockSize="6rem"
				data-testid="fitting-nav"
				elementType="nav"
				inlineSize="12rem"
			>
				<div style={{ blockSize: '2rem' }}>Fitting navigation</div>
			</ScrollMask>
			<ScrollMask
				aria-label="Overflowing navigation"
				axis="block"
				blockSize="6rem"
				data-testid="overflowing-nav"
				elementType="nav"
				inlineSize="12rem"
			>
				<div style={{ blockSize: '18rem' }}>Overflowing navigation</div>
			</ScrollMask>
		</>,
	);
	const fitting = await waitForScrollport(locator.getByTestId('fitting-nav').element());
	expect(fitting.tagName).toBe('NAV');
	expect(fitting.tabIndex).toBe(-1);
	expect(fitting.getAttribute('role')).toBeNull();
	expect(fitting.getAttribute('aria-label')).toBe('Fitting navigation');

	const overflowing = await waitForScrollport(
		locator.getByTestId('overflowing-nav').element(),
		true,
	);
	expect(overflowing.tagName).toBe('NAV');
	expect(overflowing.tabIndex).toBe(0);
	expect(overflowing.getAttribute('role')).toBeNull();
	expect(overflowing.getAttribute('aria-label')).toBe('Overflowing navigation');
});

test('transitions between fitting and overflowing content', async () => {
	function Fixture() {
		const [expanded, setExpanded] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setExpanded((value) => !value)}>
					Toggle
				</button>
				<ScrollMask
					aria-label="Dynamic list"
					axis="block"
					blockSize="6rem"
					data-testid="scroll-mask"
					inlineSize="12rem"
				>
					<div style={{ blockSize: expanded ? '18rem' : '2rem' }}>Dynamic content</div>
				</ScrollMask>
			</>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element());
	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('aria-label')).toBeNull();

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, true);
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Dynamic list');

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, false);
	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('role')).toBeNull();
	expect(element.getAttribute('aria-label')).toBeNull();
});

test('masks logical inline edges in RTL', async () => {
	const { locator } = render(
		<div dir="rtl">
			<ScrollMask aria-label="RTL list" data-testid="scroll-mask" inlineSize="8rem" padding="sp8">
				<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
					محتوى أفقي طويل للتمرير
				</span>
			</ScrollMask>
		</div>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(getComputedStyle(element).maskImage).not.toBe('none');
	expect(getComputedStyle(element).direction).toBe('rtl');
	expect(element.dataset.scrollMaskEnd).toBe('left');
	expect(logicalEndSide(element, 'inline')).toBe('left');
});

test('inline overflow follows vertical writing mode', async () => {
	const { locator } = render(
		<ScrollMask
			aria-label="Vertical inline"
			data-testid="scroll-mask"
			inlineSize="5rem"
			blockSize="10rem"
			padding="sp8"
			style={{ writingMode: 'vertical-rl' }}
		>
			<div style={{ inlineSize: '16rem', whiteSpace: 'nowrap' }}>縦書きの長いインライン内容</div>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
	const styles = getComputedStyle(element);

	expect(styles.writingMode).toBe('vertical-rl');
	expect(overflowsOnAxis(element, 'inline')).toBe(true);
	expect(overflowsOnAxis(element, 'block')).toBe(false);
	expect(styles.overflowY).toBe('auto');
	expect(styles.overflowX).toBe('hidden');
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.dataset.scrollMaskEnd).toBe('bottom');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
});

test('block overflow follows vertical writing mode', async () => {
	const { locator } = render(
		<ScrollMask
			aria-label="Vertical block"
			axis="block"
			blockSize="5rem"
			data-testid="scroll-mask"
			inlineSize="10rem"
			padding="sp8"
			style={{ writingMode: 'vertical-rl' }}
		>
			<div style={{ blockSize: '16rem' }}>縦書きの長いブロック内容</div>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
	const styles = getComputedStyle(element);

	expect(styles.writingMode).toBe('vertical-rl');
	expect(overflowsOnAxis(element, 'block')).toBe(true);
	expect(overflowsOnAxis(element, 'inline')).toBe(false);
	expect(styles.overflowX).toBe('auto');
	expect(styles.overflowY).toBe('hidden');
	expect(element.tabIndex).toBe(0);
	expect(element.dataset.scrollMaskEnd).toBe('left');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
});

test('nested intrinsic image load updates overflow state', async () => {
	const tinySvg = svgDataUri(16, 16);
	const tallSvg = svgDataUri(16, 320);

	function Fixture() {
		const imageRef = useRef<HTMLImageElement>(null);
		return (
			<>
				<button
					type="button"
					onClick={() => {
						const image = imageRef.current;
						if (image) image.src = tallSvg;
					}}
				>
					Load tall image
				</button>
				<button
					type="button"
					onClick={() => {
						const image = imageRef.current;
						if (image) image.src = tinySvg;
					}}
				>
					Load tiny image
				</button>
				<ScrollMask
					aria-label="Image list"
					axis="block"
					blockSize="6rem"
					data-testid="scroll-mask"
					inlineSize="8rem"
				>
					<div>
						<img alt="" ref={imageRef} src={tinySvg} />
					</div>
				</ScrollMask>
			</>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element());
	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('role')).toBeNull();
	expect(getComputedStyle(element).maskImage).toBe('none');

	await userEvent.click(locator.getByRole('button', { name: 'Load tall image' }));
	await waitForScrollport(element, true);
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Image list');
	expect(getComputedStyle(element).maskImage).not.toBe('none');

	await userEvent.click(locator.getByRole('button', { name: 'Load tiny image' }));
	await waitForScrollport(element, false);
	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('role')).toBeNull();
	expect(element.getAttribute('aria-label')).toBeNull();
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('fitting and overflowing default divs have no axe violations', async () => {
	const { container: fitting } = render(
		<ScrollMask aria-label="Fits" blockSize="6rem" inlineSize="12rem">
			Short
		</ScrollMask>,
	);
	await expectNoAxeViolations(fitting);

	const { container: overflowing, locator } = render(
		<ScrollMask
			aria-label="Overflows"
			data-testid="overflowing-axe"
			inlineSize="8rem"
			padding="sp8"
		>
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing content for axe
			</span>
		</ScrollMask>,
	);
	await waitForScrollport(locator.getByTestId('overflowing-axe').element(), true);
	await expectNoAxeViolations(overflowing);
});

test('the ScrollMask scene has no axe violations', async () => {
	const { container } = render(<ScrollMaskScene />);

	await expectNoAxeViolations(container);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<ScrollMaskScene />, { appearance });
		await captureVisualAppearance(locator, 'scroll-mask/kitchen-sink', appearance);
	}
});

function ScrollMaskScene() {
	return (
		<Grid columns={2}>
			<ScrollMask aria-label="Inline topics" inlineSize="10rem" padding="sp8">
				<span style={{ display: 'inline-block', inlineSize: '22rem', whiteSpace: 'nowrap' }}>
					Design tokens · Layout · Forms · Feedback · Typography
				</span>
			</ScrollMask>
			<ScrollMask
				aria-label="Block topics"
				axis="block"
				blockSize="8rem"
				inlineSize="12rem"
				padding="sp8"
			>
				<div style={{ display: 'grid', gap: vars.space.sp8 }}>
					{['Overview', 'Installation', 'Theming', 'Layout', 'Forms', 'Feedback'].map((item) => (
						<Text key={item}>{item}</Text>
					))}
				</div>
			</ScrollMask>
		</Grid>
	);
}

function svgDataUri(width: number, height: number): string {
	return `data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}"><rect width="100%" height="100%" fill="#1d4ed8"/></svg>`,
	)}`;
}

async function waitForScrollport(node: Element, shouldOverflow?: boolean): Promise<HTMLElement> {
	if (!(node instanceof HTMLElement)) throw new Error('Expected ScrollMask element.');

	const deadline = Date.now() + 2000;
	while (Date.now() < deadline) {
		const axis: 'inline' | 'block' =
			getComputedStyle(node).overflowInline === 'auto' ? 'inline' : 'block';
		const overflows = overflowsOnAxis(node, axis);
		const focusable = node.tabIndex === 0;
		if (shouldOverflow === undefined || overflows === shouldOverflow) {
			if (shouldOverflow === undefined || focusable === shouldOverflow) return node;
		}
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}

	throw new Error(
		`Timed out waiting for ScrollMask overflow=${String(shouldOverflow)} (tabIndex=${node.tabIndex}).`,
	);
}
