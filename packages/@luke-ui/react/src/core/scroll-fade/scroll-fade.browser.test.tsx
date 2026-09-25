import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { hydrate, render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Grid } from '../test-utils/visual.js';
import { ScrollFade as ScrollFadeSource, logicalEndSide, overflowsOnAxis } from './scroll-fade.js';

/** Standards-based physical gradient angles for logical-end sides. Hard-coded so tests do not share a wrong production mapping. */
const maskGradientAngle = {
	bottom: 180,
	left: 270,
	right: 90,
	top: 0,
} as const;

test('ScrollFade forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<ScrollFade {...forwardedDomProps} aria-label="Topics" ref={ref}>
			Content
		</ScrollFade>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected ScrollFade element.');

	expectForwardsDomProps(target, ref);
	expect(target.tagName).toBe('DIV');
});

test('fitting div has no mask, tab stop, region role, or accessible name', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="Short list"
			blockSize="6rem"
			data-testid="scroll-fade"
			inlineSize="12rem"
		>
			Fits
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element());

	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('overflowing div applies accessible name with the automatic region role', async () => {
	const { locator } = render(
		<ScrollFade aria-label="Wide list" data-testid="scroll-fade" inlineSize="8rem" padding="sp8">
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing inline content for the mask
			</span>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Wide list');
	expect(element.hasAttribute('aria-labelledby')).toBe(false);
	expect(getComputedStyle(element).overflowInline).toBe('auto');
	expect(getComputedStyle(element).overflowBlock).toBe('hidden');
	expect(getComputedStyle(element).scrollbarWidth).toBe('none');
	expect(getComputedStyle(element, '::-webkit-scrollbar').display).toBe('none');
	expectMaskToward(element, 'right');
});

test('overflowing block content is keyboard-focusable with a region role and mask', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="Tall list"
			axis="block"
			blockSize="6rem"
			data-testid="scroll-fade"
			inlineSize="12rem"
			padding="sp8"
		>
			<div style={{ blockSize: '18rem' }}>Overflowing block content for the mask</div>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Tall list');
	expect(getComputedStyle(element).overflowBlock).toBe('auto');
	expect(getComputedStyle(element).overflowInline).toBe('hidden');
	expect(getComputedStyle(element).scrollbarWidth).toBe('none');
	expect(getComputedStyle(element, '::-webkit-scrollbar').display).toBe('none');
	element.focus();
	await userEvent.keyboard('{ArrowDown}');
	await expect.poll(() => element.scrollTop).toBeGreaterThan(0);
	expectMaskToward(element, 'bottom');
});

test('region role and accessible name appear together when a fitting div overflows', async () => {
	function Fixture() {
		const [expanded, setExpanded] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setExpanded((value) => !value)}>
					Toggle
				</button>
				<ScrollFade
					aria-label="Dynamic list"
					axis="block"
					blockSize="6rem"
					data-testid="scroll-fade"
					inlineSize="12rem"
				>
					<div style={{ blockSize: expanded ? '18rem' : '2rem' }}>Dynamic content</div>
				</ScrollFade>
			</>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element());
	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
	expect(element.hasAttribute('aria-label')).toBe(false);

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
});

test('replacing overflowing content still measures overflow after removal', async () => {
	function Fixture() {
		const [generation, setGeneration] = useState(0);
		return (
			<>
				<button
					data-testid="replace"
					type="button"
					onClick={() => setGeneration((value) => value + 1)}
				>
					Replace
				</button>
				<ScrollFade
					aria-label="Replaced list"
					axis="block"
					blockSize="6rem"
					data-testid="scroll-fade"
					inlineSize="12rem"
				>
					<div key={generation} style={{ blockSize: '18rem' }}>
						Generation {generation}
					</div>
				</ScrollFade>
			</>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	expect(element.getAttribute('role')).toBe('region');
	expectMaskToward(element, 'bottom');

	const replaceButton = expectHtmlElement(
		locator.getByTestId('replace').element(),
		'Expected replace button.',
	);
	replaceButton.click();
	await waitForScrollport(element, true);
	expect(element.textContent).toContain('Generation 1');
	expect(element.getAttribute('role')).toBe('region');
	expectMaskToward(element, 'bottom');

	replaceButton.click();
	await waitForScrollport(element, true);
	expect(element.textContent).toContain('Generation 2');
	expect(element.tabIndex).toBe(0);
	expectMaskToward(element, 'bottom');
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
				<ScrollFade
					aria-label={`Inline ${writingCase.label}`}
					blockSize="10rem"
					data-testid="scroll-fade"
					inlineSize="5rem"
					padding="sp8"
				>
					<div style={{ inlineSize: '16rem', whiteSpace: 'nowrap' }}>
						長いインライン内容 for logical overflow
					</div>
				</ScrollFade>
			</div>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingCase.writingMode);
		expect(styles.direction).toBe(writingCase.direction);
		expect(overflowsOnAxis(element, 'inline')).toBe(true);
		expect(overflowsOnAxis(element, 'block')).toBe(false);
		expect(styles.overflowInline).toBe('auto');
		expect(styles.overflowBlock).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.getAttribute('data-scroll-fade-end')).toBe(writingCase.expectedInlineEnd);
		expect(logicalEndSide(element, 'inline')).toBe(writingCase.expectedInlineEnd);
		expectMaskToward(element, writingCase.expectedInlineEnd);
	});

	test(`block overflow maps correctly for ${writingCase.label}`, async () => {
		const { locator } = render(
			<div dir={writingCase.direction} style={{ writingMode: writingCase.writingMode }}>
				<ScrollFade
					aria-label={`Block ${writingCase.label}`}
					axis="block"
					blockSize="5rem"
					data-testid="scroll-fade"
					inlineSize="10rem"
					padding="sp8"
				>
					<div style={{ blockSize: '16rem' }}>長いブロック内容 for logical overflow</div>
				</ScrollFade>
			</div>,
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
		const styles = getComputedStyle(element);

		expect(styles.writingMode).toBe(writingCase.writingMode);
		expect(styles.direction).toBe(writingCase.direction);
		expect(overflowsOnAxis(element, 'block')).toBe(true);
		expect(overflowsOnAxis(element, 'inline')).toBe(false);
		expect(styles.overflowBlock).toBe('auto');
		expect(styles.overflowInline).toBe('hidden');
		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.getAttribute('data-scroll-fade-end')).toBe(writingCase.expectedBlockEnd);
		expect(logicalEndSide(element, 'block')).toBe(writingCase.expectedBlockEnd);
		expectMaskToward(element, writingCase.expectedBlockEnd);
	});
}

test('CSS direction rtl on the scrollport flips the inline mask', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="CSS direction"
			data-testid="scroll-fade"
			inlineSize="8rem"
			padding="sp8"
			style={{ direction: 'rtl' }}
		>
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing inline content for CSS direction
			</span>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

	expect(getComputedStyle(element).direction).toBe('rtl');
	expect(element.getAttribute('data-scroll-fade-end')).toBe('left');
	expect(logicalEndSide(element, 'inline')).toBe('left');
	expectMaskToward(element, 'left');
});

test('inherited CSS direction updates the inline mask without remounting', async () => {
	function Fixture() {
		const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
		return (
			<div style={{ direction }}>
				<button type="button" onClick={() => setDirection('rtl')}>
					Switch to RTL
				</button>
				<ScrollFade
					aria-label="Direction switch"
					data-testid="scroll-fade"
					inlineSize="8rem"
					padding="sp8"
				>
					<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
						Overflowing inline content for direction switch
					</span>
				</ScrollFade>
			</div>
		);
	}

	const { locator } = render(<Fixture />);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

	expect(getComputedStyle(element).direction).toBe('ltr');
	expectMaskToward(element, 'right');

	await userEvent.click(locator.getByRole('button', { name: 'Switch to RTL' }));
	await expect.poll(() => getComputedStyle(element).direction).toBe('rtl');
	await expect.poll(() => element.getAttribute('data-scroll-fade-end')).toBe('left');

	expect(logicalEndSide(element, 'inline')).toBe('left');
	expectMaskToward(element, 'left');
});

test('vertical writing mode with RTL and text-orientation upright keeps logical inline end', async () => {
	const { locator } = render(
		<div style={{ writingMode: 'vertical-rl', direction: 'rtl', textOrientation: 'upright' }}>
			<ScrollFade
				aria-label="Upright vertical"
				blockSize="10rem"
				data-testid="scroll-fade"
				inlineSize="5rem"
				padding="sp8"
			>
				<div style={{ inlineSize: '16rem', whiteSpace: 'nowrap' }}>長い upright contents</div>
			</ScrollFade>
		</div>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	const styles = getComputedStyle(element);

	expect(styles.writingMode).toBe('vertical-rl');
	expect(styles.direction).toBe('rtl');
	expect(styles.textOrientation).toBe('upright');
	expect(overflowsOnAxis(element, 'inline')).toBe(true);
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('data-scroll-fade-end')).toBe('top');
	expect(logicalEndSide(element, 'inline')).toBe('top');
	expectMaskToward(element, 'top');
});

test('inline scroll progression fades start then end across the scroll range', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="Inline progression"
			data-testid="scroll-fade"
			inlineSize="10rem"
			padding="sp8"
		>
			<span style={{ display: 'inline-block', inlineSize: '40rem', whiteSpace: 'nowrap' }}>
				Overflowing inline content for scroll progression
			</span>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	const maxScroll = element.scrollWidth - element.clientWidth;
	expect(maxScroll).toBeGreaterThan(96);

	await assertInlineProgression(element, maxScroll);
});

test('block scroll progression fades start then end across the scroll range', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="Block progression"
			axis="block"
			blockSize="8rem"
			data-testid="scroll-fade"
			inlineSize="12rem"
			padding="sp8"
		>
			<div style={{ blockSize: '40rem' }}>Overflowing block content for scroll progression</div>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	const maxScroll = element.scrollHeight - element.clientHeight;
	expect(maxScroll).toBeGreaterThan(96);

	await assertBlockProgression(element, maxScroll);
});

test('scroll progression stays coherent when overflow is shorter than the reveal distance', async () => {
	const { locator } = render(
		<ScrollFade
			aria-label="Short overflow"
			data-testid="scroll-fade"
			inlineSize="10rem"
			padding="sp8"
		>
			{/* Viewport ~160px; content ~200px → overflow ~40px, well under sp96. */}
			<span style={{ display: 'inline-block', inlineSize: '12.5rem', whiteSpace: 'nowrap' }}>
				Short overflow progression
			</span>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	const maxScroll = element.scrollWidth - element.clientWidth;
	expect(maxScroll).toBeGreaterThan(0);
	expect(maxScroll).toBeLessThan(96);

	await assertInlineProgression(element, maxScroll);
});

test('focus-visible keeps the mask and a visible focus ring on the scrollport', async () => {
	const { locator } = render(
		<>
			<button type="button">Before</button>
			<ScrollFade
				aria-label="Focusable list"
				data-testid="scroll-fade"
				inlineSize="8rem"
				padding="sp8"
			>
				<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
					Overflowing inline content for focus
				</span>
			</ScrollFade>
		</>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	expectMaskToward(element, 'right');

	locator.getByRole('button', { name: 'Before' }).element().focus();
	await userEvent.tab();

	expect(element).toHaveFocus();
	expect(element.matches(':focus-visible')).toBe(true);
	expectMaskToward(element, 'right');
	expect(getComputedStyle(element).outlineStyle).toBe('solid');
	expect(Number.parseFloat(getComputedStyle(element).outlineWidth)).toBeGreaterThan(0);
	expect(getComputedStyle(element).outlineOffset).toBe('2px');
});

test('focusing an interactive descendant near a faded edge keeps the mask', async () => {
	const { locator } = render(
		<ScrollFade aria-label="Nested focus" data-testid="scroll-fade" inlineSize="8rem" padding="sp8">
			<div style={{ display: 'flex', gap: '1rem', inlineSize: '24rem' }}>
				<button type="button">Near start</button>
				<span style={{ flex: 'none', inlineSize: '16rem' }}>Spacer</span>
				<button type="button">Near end</button>
			</div>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
	expectMaskToward(element, 'right');

	const nearEnd = locator.getByRole('button', { name: 'Near end' }).element();
	nearEnd.focus();
	expect(nearEnd).toHaveFocus();
	expectMaskToward(element, 'right');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
});

test('overflowing scrollport remains a named tab stop with tabbable descendants', async () => {
	const { locator } = render(
		<ScrollFade aria-label="Example items" data-testid="scroll-fade" inlineSize="8rem">
			<div style={{ display: 'flex', gap: '1rem' }}>
				<button style={{ flex: 'none', inlineSize: '6rem' }} type="button">
					First item
				</button>
				<button style={{ flex: 'none', inlineSize: '6rem' }} type="button">
					Second item
				</button>
			</div>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');
	expect(element.getAttribute('aria-label')).toBe('Example items');
	expect(locator.getByRole('button', { name: 'First item' }).element().tabIndex).toBe(0);
});

test('nested intrinsic image load updates overflow from fitting to overflowing', async () => {
	const tinySvg = svgDataUri(16, 16);
	const tallSvg = svgDataUri(16, 320);

	const { locator } = render(
		<ScrollFade
			aria-label="Image list"
			axis="block"
			blockSize="6rem"
			data-testid="scroll-fade"
			inlineSize="8rem"
		>
			<div>
				<img alt="" data-testid="intrinsic" src={tinySvg} />
			</div>
		</ScrollFade>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-fade').element());
	expect(element.tabIndex).toBe(-1);
	expect(element.hasAttribute('role')).toBe(false);
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
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('SSR markup hydrates without mismatch and then measures overflow', async () => {
	// Source import so renderToString shares the browser React instance (dist hits invalid hook call).
	const tree = (
		<ScrollFadeSource
			aria-label="Hydrated list"
			data-testid="scroll-fade"
			inlineSize="8rem"
			padding="sp8"
		>
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing inline content for hydration
			</span>
		</ScrollFadeSource>
	);

	const markup = renderToString(tree);
	expect(markup).not.toContain('role="region"');
	expect(markup).not.toMatch(/tabindex=/i);
	expect(markup).not.toContain('aria-label="Hydrated list"');
	expect(markup).toContain('data-testid="scroll-fade"');

	const { locator, recoverableErrors, unmount } = hydrate(markup, tree);
	try {
		const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);

		expect(element.tabIndex).toBe(0);
		expect(element.getAttribute('role')).toBe('region');
		expect(element.getAttribute('aria-label')).toBe('Hydrated list');
		expectMaskToward(element, 'right');
		expect(recoverableErrors).toEqual([]);
	} finally {
		unmount();
	}
});

test('fitting and overflowing default divs have no axe violations', async () => {
	const { container: fitting, locator: fittingLocator } = render(
		<ScrollFade aria-label="Fits" blockSize="6rem" data-testid="fitting-axe" inlineSize="12rem">
			Short
		</ScrollFade>,
	);
	const fittingElement = await waitForScrollport(
		fittingLocator.getByTestId('fitting-axe').element(),
	);
	expect(fittingElement.hasAttribute('role')).toBe(false);
	await expectNoAxeViolations(fitting);

	const { container: overflowing, locator } = render(
		<ScrollFade
			aria-label="Overflows"
			data-testid="overflowing-axe"
			inlineSize="8rem"
			padding="sp8"
		>
			<span style={{ display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' }}>
				Overflowing content for axe
			</span>
		</ScrollFade>,
	);
	const overflowingElement = await waitForScrollport(
		locator.getByTestId('overflowing-axe').element(),
		true,
	);
	expect(overflowingElement.getAttribute('role')).toBe('region');
	await expectNoAxeViolations(overflowing);
});

test('the ScrollFade scene has no axe violations', async () => {
	const { container } = render(<ScrollFadeScene />);

	await expectNoAxeViolations(container);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<ScrollFadeScene />, { appearance });
		await captureVisualAppearance(locator, 'scroll-mask/kitchen-sink', appearance);
	}
});

test('overflowing focus-visible state', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<ScrollFade
				aria-label="Focused overflow"
				data-testid="scroll-fade"
				inlineSize="10rem"
				padding="sp8"
			>
				<span style={{ display: 'inline-block', inlineSize: '22rem', whiteSpace: 'nowrap' }}>
					Design tokens · Layout · Forms · Feedback · Typography
				</span>
			</ScrollFade>,
			{ appearance },
		);
		const element = await waitForScrollport(locator.getByTestId('scroll-fade').element(), true);
		element.focus({ focusVisible: true });
		expect(element.matches(':focus-visible')).toBe(true);
		expectMaskToward(element, 'right');
		await captureVisualAppearance(locator, 'scroll-mask/focus-visible', appearance);
	}
});

function ScrollFadeScene() {
	return (
		<Grid columns={2}>
			<ScrollFade aria-label="Inline topics" inlineSize="10rem" padding="sp8">
				<span style={{ display: 'inline-block', inlineSize: '22rem', whiteSpace: 'nowrap' }}>
					Design tokens · Layout · Forms · Feedback · Typography
				</span>
			</ScrollFade>
			<ScrollFade
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
			</ScrollFade>
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

/** Waits for ScrollFade's observer-driven React update, not for size polling. */
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
	const angle = maskGradientAngle[side];
	// Chromium omits the default `180deg` direction from computed `mask-image`.
	expect(
		angle === 180
			? !/\b(?:0|90|270)deg\b/.test(maskImage)
			: maskImage.includes(`${String(angle)}deg`),
	).toBe(true);
}

function fadeLayer(maskImage: string): string {
	const index = maskImage.lastIndexOf('linear-gradient(');
	return index === -1 ? maskImage : maskImage.slice(index);
}

function hasStartFade(maskImage: string): boolean {
	const layer = fadeLayer(maskImage);
	// No fade: `0px` or `calc(0% + (0 * …))`. Partial/full fade uses a non-zero multiplier or bare min().
	if (/rgb\(0,\s*0,\s*0\)\s+0px/.test(layer)) return false;
	if (/rgb\(0,\s*0,\s*0\)\s+calc\(0%\s*\+\s*\(0\s*\*/.test(layer)) return false;
	return /rgb\(0,\s*0,\s*0\)\s+calc\(0%\s*\+/.test(layer);
}

function hasEndFade(maskImage: string): boolean {
	const layer = fadeLayer(maskImage);
	if (/calc\(100%\s*-\s*\(0\s*\*/.test(layer)) return false;
	if (/rgb\(0,\s*0,\s*0\)\s+100%/.test(layer) && /rgba?\(0,\s*0,\s*0,\s*0\)\s+100%/.test(layer)) {
		return false;
	}
	return /calc\(100%\s*-/.test(layer);
}

async function assertInlineProgression(element: HTMLElement, maxScroll: number): Promise<void> {
	element.scrollLeft = 0;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: false, end: true });

	element.scrollLeft = maxScroll / 2;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: true, end: true });

	element.scrollLeft = maxScroll;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: true, end: false });
}

async function assertBlockProgression(element: HTMLElement, maxScroll: number): Promise<void> {
	element.scrollTop = 0;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: false, end: true });

	element.scrollTop = maxScroll / 2;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: true, end: true });

	element.scrollTop = maxScroll;
	await expect
		.poll(() => {
			const maskImage = getComputedStyle(element).maskImage;
			return { start: hasStartFade(maskImage), end: hasEndFade(maskImage) };
		})
		.toEqual({ start: true, end: false });
}

async function waitForScrollport(node: Element, shouldOverflow?: boolean): Promise<HTMLElement> {
	if (!(node instanceof HTMLElement)) throw new Error('Expected ScrollFade element.');

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
		`Timed out waiting for ScrollFade overflow=${String(shouldOverflow)} (tabIndex=${node.tabIndex}).`,
	);
}
