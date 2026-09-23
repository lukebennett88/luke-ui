import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { createRef, useState } from 'react';
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
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
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
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
	expect(getComputedStyle(element).overflowInline).toBe('auto');
	expect(getComputedStyle(element).overflowBlock).toBe('hidden');
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
	expect(element.getAttribute('aria-label')).toBe('Tall list');
	expect(getComputedStyle(element).overflowBlock).toBe('auto');
	expect(getComputedStyle(element).overflowInline).toBe('hidden');
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
	expect(fitting.hasAttribute('role')).toBe(false);
	expect(fitting.getAttribute('aria-label')).toBe('Fitting navigation');

	const overflowing = await waitForScrollport(
		locator.getByTestId('overflowing-nav').element(),
		true,
	);
	expect(overflowing.tagName).toBe('NAV');
	expect(overflowing.tabIndex).toBe(0);
	expect(overflowing.hasAttribute('role')).toBe(false);
	expect(overflowing.getAttribute('aria-label')).toBe('Overflowing navigation');
});

test('region role and accessible name appear together when a fitting div overflows', async () => {
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
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(element.hasAttribute('aria-labelledby')).toBe(false);

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, true);
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Dynamic list');

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, false);
	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
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
	expect(getComputedStyle(element).overflowInline).toBe('auto');
	expect(getComputedStyle(element).overflowBlock).toBe('hidden');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
	expect(getComputedStyle(element).direction).toBe('rtl');
	expect(element.dataset.scrollMaskEnd).toBe('left');
	expect(logicalEndSide(element, 'inline')).toBe('left');
});

for (const writingMode of ['vertical-rl', 'vertical-lr'] as const) {
	test(`inline overflow follows ${writingMode}`, async () => {
		const { locator } = render(
			<ScrollMask
				aria-label={`Vertical inline ${writingMode}`}
				data-testid="scroll-mask"
				inlineSize="5rem"
				blockSize="10rem"
				padding="sp8"
				style={{ writingMode }}
			>
				<div style={{ inlineSize: '16rem', whiteSpace: 'nowrap' }}>縦書きの長いインライン内容</div>
			</ScrollMask>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingMode);
		expect(overflowsOnAxis(element, 'inline')).toBe(true);
		expect(overflowsOnAxis(element, 'block')).toBe(false);
		expect(styles.overflowInline).toBe('auto');
		expect(styles.overflowBlock).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.getAttribute('aria-label')).toBe(`Vertical inline ${writingMode}`);
		expect(element.dataset.scrollMaskEnd).toBe('bottom');
		expect(logicalEndSide(element, 'inline')).toBe('bottom');
		expect(styles.maskImage).not.toBe('none');
	});

	test(`block overflow follows ${writingMode}`, async () => {
		const expectedEnd = writingMode === 'vertical-rl' ? 'left' : 'right';
		const { locator } = render(
			<ScrollMask
				aria-label={`Vertical block ${writingMode}`}
				axis="block"
				blockSize="5rem"
				data-testid="scroll-mask"
				inlineSize="10rem"
				padding="sp8"
				style={{ writingMode }}
			>
				<div style={{ blockSize: '16rem' }}>縦書きの長いブロック内容</div>
			</ScrollMask>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingMode);
		expect(overflowsOnAxis(element, 'block')).toBe(true);
		expect(overflowsOnAxis(element, 'inline')).toBe(false);
		expect(styles.overflowBlock).toBe('auto');
		expect(styles.overflowInline).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.getAttribute('aria-label')).toBe(`Vertical block ${writingMode}`);
		expect(element.dataset.scrollMaskEnd).toBe(expectedEnd);
		expect(logicalEndSide(element, 'block')).toBe(expectedEnd);
		expect(styles.maskImage).not.toBe('none');
	});
}

test('nested intrinsic image load updates overflow from fitting to overflowing', async () => {
	const tinySvg = svgDataUri(16, 16);
	const tallSvg = svgDataUri(16, 320);

	const { locator } = render(
		<ScrollMask
			aria-label="Image list"
			axis="block"
			blockSize="6rem"
			data-testid="scroll-mask"
			inlineSize="8rem"
		>
			<div>
				<img alt="" data-testid="intrinsic" src={tinySvg} />
			</div>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element());
	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
	expect(getComputedStyle(element).maskImage).toBe('none');

	const image = expectHtmlElement(
		locator.getByTestId('intrinsic').element(),
		'Expected intrinsic image.',
	);
	if (!(image instanceof HTMLImageElement)) throw new Error('Expected HTMLImageElement.');

	// Change the already-mounted image's intrinsic size without a React tree mutation.
	await loadImageSource(image, tallSvg);
	await waitForAttribute(element, 'role', 'region');

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Image list');
	expect(getComputedStyle(element).maskImage).not.toBe('none');

	await loadImageSource(image, tinySvg);
	await waitForAttribute(element, 'role', null);

	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('fitting and overflowing default divs have no axe violations', async () => {
	const { container: fitting, locator: fittingLocator } = render(
		<ScrollMask aria-label="Fits" blockSize="6rem" data-testid="fitting-axe" inlineSize="12rem">
			Short
		</ScrollMask>,
	);
	const fittingElement = await waitForScrollport(
		fittingLocator.getByTestId('fitting-axe').element(),
	);
	expect(fittingElement.hasAttribute('role')).toBe(false);
	expect(fittingElement.hasAttribute('aria-label')).toBe(false);
	expect(fittingElement.hasAttribute('aria-labelledby')).toBe(false);
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
	const overflowingElement = await waitForScrollport(
		locator.getByTestId('overflowing-axe').element(),
		true,
	);
	expect(overflowingElement.getAttribute('role')).toBe('region');
	expect(overflowingElement.getAttribute('aria-label')).toBe('Overflows');
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

function loadImageSource(image: HTMLImageElement, src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		image.addEventListener('load', () => resolve(), { once: true });
		image.addEventListener('error', () => reject(new Error('Image failed to load.')), {
			once: true,
		});
		image.src = src;
	});
}

/** Waits for ScrollMask's observer-driven React update, not for size polling. */
function waitForAttribute(element: HTMLElement, name: string, value: string | null): Promise<void> {
	if (element.getAttribute(name) === value) return Promise.resolve();

	return new Promise((resolve, reject) => {
		const timeoutId = window.setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Timed out waiting for ${name}=${String(value)}.`));
		}, 2000);

		const observer = new MutationObserver(() => {
			if (element.getAttribute(name) === value) {
				window.clearTimeout(timeoutId);
				observer.disconnect();
				resolve();
			}
		});
		observer.observe(element, { attributes: true, attributeFilter: [name] });
	});
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
