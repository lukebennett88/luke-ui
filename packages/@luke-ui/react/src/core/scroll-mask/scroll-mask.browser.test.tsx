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
import { scrollMaskGradientAngle } from './recipe.css.js';
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
	expectMaskToward(element, 'right');
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
	expectMaskToward(element, 'bottom');
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

const writingModeCases = [
	{
		direction: 'ltr',
		expectedBlockEnd: 'bottom',
		expectedInlineEnd: 'right',
		label: 'horizontal-tb LTR',
		writingMode: 'horizontal-tb',
	},
	{
		direction: 'rtl',
		expectedBlockEnd: 'bottom',
		expectedInlineEnd: 'left',
		label: 'horizontal-tb RTL',
		writingMode: 'horizontal-tb',
	},
	{
		direction: 'ltr',
		expectedBlockEnd: 'left',
		expectedInlineEnd: 'bottom',
		label: 'vertical-rl LTR',
		writingMode: 'vertical-rl',
	},
	{
		direction: 'rtl',
		expectedBlockEnd: 'left',
		expectedInlineEnd: 'top',
		label: 'vertical-rl RTL',
		writingMode: 'vertical-rl',
	},
	{
		direction: 'ltr',
		expectedBlockEnd: 'right',
		expectedInlineEnd: 'bottom',
		label: 'vertical-lr LTR',
		writingMode: 'vertical-lr',
	},
	{
		direction: 'rtl',
		expectedBlockEnd: 'right',
		expectedInlineEnd: 'top',
		label: 'vertical-lr RTL',
		writingMode: 'vertical-lr',
	},
] as const;

for (const writingCase of writingModeCases) {
	test(`inline overflow maps correctly for ${writingCase.label}`, async () => {
		const { locator } = render(
			<div dir={writingCase.direction} style={{ writingMode: writingCase.writingMode }}>
				<ScrollMask
					aria-label={`Inline ${writingCase.label}`}
					blockSize="10rem"
					data-testid="scroll-mask"
					inlineSize="5rem"
					padding="sp8"
				>
					<div style={{ inlineSize: '16rem', whiteSpace: 'nowrap' }}>
						長いインライン内容 for logical overflow
					</div>
				</ScrollMask>
			</div>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingCase.writingMode);
		expect(styles.direction).toBe(writingCase.direction);
		expect(overflowsOnAxis(element, 'inline')).toBe(true);
		expect(overflowsOnAxis(element, 'block')).toBe(false);
		expect(styles.overflowInline).toBe('auto');
		expect(styles.overflowBlock).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.dataset.scrollMaskWriting).toBe(writingCase.writingMode);
		expect(logicalEndSide(element, 'inline')).toBe(writingCase.expectedInlineEnd);
		expectMaskToward(element, writingCase.expectedInlineEnd);
	});

	test(`block overflow maps correctly for ${writingCase.label}`, async () => {
		const { locator } = render(
			<div dir={writingCase.direction} style={{ writingMode: writingCase.writingMode }}>
				<ScrollMask
					aria-label={`Block ${writingCase.label}`}
					axis="block"
					blockSize="5rem"
					data-testid="scroll-mask"
					inlineSize="10rem"
					padding="sp8"
				>
					<div style={{ blockSize: '16rem' }}>長いブロック内容 for logical overflow</div>
				</ScrollMask>
			</div>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingCase.writingMode);
		expect(styles.direction).toBe(writingCase.direction);
		expect(overflowsOnAxis(element, 'block')).toBe(true);
		expect(overflowsOnAxis(element, 'inline')).toBe(false);
		expect(styles.overflowBlock).toBe('auto');
		expect(styles.overflowInline).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.dataset.scrollMaskWriting).toBe(writingCase.writingMode);
		expect(logicalEndSide(element, 'block')).toBe(writingCase.expectedBlockEnd);
		expectMaskToward(element, writingCase.expectedBlockEnd);
	});
}

test('inherited direction change updates the inline mask without remounting', async () => {
	function Fixture() {
		const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
		return (
			<div dir={direction}>
				<button type="button" onClick={() => setDirection('rtl')}>
					Switch to RTL
				</button>
				<ScrollMask
					aria-label="Direction switch"
					data-testid="scroll-mask"
					inlineSize="8rem"
					padding="sp8"
				>
					<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
						Overflowing inline content for direction switch
					</span>
				</ScrollMask>
			</div>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);

	expect(getComputedStyle(element).direction).toBe('ltr');
	expect(element.dataset.scrollMaskWriting).toBe('horizontal-tb');
	expectMaskToward(element, 'right');

	await userEvent.click(locator.getByRole('button', { name: 'Switch to RTL' }));
	await expect.poll(() => getComputedStyle(element).direction).toBe('rtl');

	expect(element.dataset.scrollMaskWriting).toBe('horizontal-tb');
	expect(logicalEndSide(element, 'inline')).toBe('left');
	expectMaskToward(element, 'left');
});

test('focus-visible clears the mask so the standard focus ring remains visible', async () => {
	const { locator } = render(
		<>
			<button type="button">Before</button>
			<ScrollMask
				aria-label="Focusable list"
				data-testid="scroll-mask"
				inlineSize="8rem"
				padding="sp8"
			>
				<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
					Overflowing inline content for focus
				</span>
			</ScrollMask>
		</>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
	expectMaskToward(element, 'right');

	locator.getByRole('button', { name: 'Before' }).element().focus();
	await userEvent.tab();

	expect(element).toHaveFocus();
	expect(element.matches(':focus-visible')).toBe(true);
	expect(getComputedStyle(element).maskImage).toBe('none');
	expect(getComputedStyle(element).outlineStyle).toBe('solid');
	expect(Number.parseFloat(getComputedStyle(element).outlineWidth)).toBeGreaterThan(0);
	expect(getComputedStyle(element).outlineOffset).toBe('2px');
});

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

	await loadImageSource(image, tallSvg);
	await waitForAttribute(element, 'role', 'region');

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Image list');
	expectMaskToward(element, 'bottom');

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

test('overflowing focus-visible state', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<ScrollMask
				aria-label="Focused overflow"
				data-testid="scroll-mask"
				inlineSize="10rem"
				padding="sp8"
			>
				<span style={{ display: 'inline-block', inlineSize: '22rem', whiteSpace: 'nowrap' }}>
					Design tokens · Layout · Forms · Feedback · Typography
				</span>
			</ScrollMask>,
			{ appearance },
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);
		element.focus({ focusVisible: true });
		expect(element.matches(':focus-visible')).toBe(true);
		expect(getComputedStyle(element).maskImage).toBe('none');
		await captureVisualAppearance(locator, 'scroll-mask/focus-visible', appearance);
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

function expectMaskToward(element: HTMLElement, side: 'bottom' | 'left' | 'right' | 'top'): void {
	const maskImage = getComputedStyle(element).maskImage;
	expect(maskImage).not.toBe('none');
	const angle = scrollMaskGradientAngle[side];
	// Chromium omits the default `180deg` direction from computed `mask-image`.
	expect(
		angle === 180
			? !/\b(?:0|90|270)deg\b/.test(maskImage)
			: maskImage.includes(`${String(angle)}deg`),
	).toBe(true);
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
