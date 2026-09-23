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

test('fitting content has no mask, tab stop, or automatic region role', async () => {
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
	expect(getComputedStyle(element).maskImage).toBe('none');
});

test('overflowing inline content is keyboard-focusable with a region role and mask', async () => {
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
	expect(getComputedStyle(element).overflowX).toBe('auto');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
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
	expect(getComputedStyle(element).overflowY).toBe('auto');
	expect(getComputedStyle(element).maskImage).not.toBe('none');
});

test('semantic roots keep native semantics without an automatic region role', async () => {
	const { locator } = render(
		<ScrollMask
			aria-label="Navigation"
			axis="block"
			blockSize="6rem"
			data-testid="scroll-mask"
			elementType="nav"
			inlineSize="12rem"
		>
			<div style={{ blockSize: '18rem' }}>Overflowing navigation</div>
		</ScrollMask>,
	);
	const element = await waitForScrollport(locator.getByTestId('scroll-mask').element(), true);

	expect(element.tagName).toBe('NAV');
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBeNull();
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

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, true);
	expect(element.tabIndex).toBe(0);
	expect(element.getAttribute('role')).toBe('region');

	await userEvent.click(locator.getByRole('button', { name: 'Toggle' }));
	await waitForScrollport(element, false);
	expect(element.tabIndex).toBe(-1);
	expect(element.getAttribute('role')).toBeNull();
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

async function waitForScrollport(node: Element, shouldOverflow?: boolean): Promise<HTMLElement> {
	if (!(node instanceof HTMLElement)) throw new Error('Expected ScrollMask element.');

	const deadline = Date.now() + 2000;
	while (Date.now() < deadline) {
		const overflows =
			node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
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
