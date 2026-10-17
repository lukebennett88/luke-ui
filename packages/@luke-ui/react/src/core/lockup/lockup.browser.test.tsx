import { Heading } from '@luke-ui/react/heading';
import { Kbd } from '@luke-ui/react/kbd';
import type { LockupRailProps } from '@luke-ui/react/lockup';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { INTER_CAP_HEIGHT_EM, loadInter } from '../test-utils/load-inter.js';
import {
	measureBaseline,
	measureCapCentre,
	measureLastBaseline,
} from '../test-utils/measure-first-line.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

const longText =
	'This body text is long enough that it wraps across multiple lines in the fixed width.';

function Square({ size, testId = 'rail-content' }: { size: string; testId?: string }) {
	return (
		<span data-testid={testId} style={{ blockSize: size, display: 'block', inlineSize: size }} />
	);
}

function getElement(root: ParentNode, testId: string): HTMLElement {
	return expectHtmlElement(
		root.querySelector(`[data-testid="${testId}"]`),
		`Expected an element with ${testId}.`,
	);
}

function centreOf(element: Element): number {
	const { height, top } = element.getBoundingClientRect();
	return top + height / 2;
}

/** Distance between the centre of `element` and the cap-height centre of `textElement`'s first line. */
function offsetFromFirstLine(element: Element, textElement: Element): number {
	return Math.abs(centreOf(element) - measureCapCentre(textElement));
}

/**
 * Distance between the centre of `rail` and the middle of the capital letters on `textElement`'s
 * first line, where the capitals stand on the first baseline and rise by Inter's cap height. It
 * uses Inter's published metrics, not the CSS `cap` unit that the layout under test relies on.
 */
function offsetFromInterCapCentre(rail: Element, textElement: Element): number {
	const fontSize = Number.parseFloat(getComputedStyle(textElement).fontSize);
	const capCentre = measureBaseline(textElement) - (INTER_CAP_HEIGHT_EM * fontSize) / 2;
	return Math.abs(centreOf(rail) - capCentre);
}

test('centres a rail on the capitals of the first line of wrapping text in Inter', async () => {
	await loadInter();
	const { container } = render(
		<Lockup gap="sp8" style={{ inlineSize: '8rem' }}>
			<LockupRail>
				<Square size="1rem" />
			</LockupRail>
			<LockupBody>
				<span data-testid="text">{longText}</span>
			</LockupBody>
		</Lockup>,
	);
	const text = getElement(container, 'text');
	const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);

	// The body wraps, so a rail centred on the whole body would sit far from the first line.
	expect(measureLastBaseline(text) - measureBaseline(text)).toBeGreaterThan(lineHeight * 2);
	expect(offsetFromInterCapCentre(getElement(container, 'rail-content'), text)).toBeLessThanOrEqual(
		0.5,
	);
});

test('centres a rail on the capitals of the first line of trimmed block Text in Inter', async () => {
	await loadInter();
	const { container } = render(
		<Lockup gap="sp8" style={{ inlineSize: '14rem' }}>
			<LockupRail>
				<Square size="1rem" />
			</LockupRail>
			<LockupBody>
				<Text data-testid="text" elementType="p">
					{longText}
				</Text>
			</LockupBody>
		</Lockup>,
	);

	expect(
		offsetFromInterCapCentre(getElement(container, 'rail-content'), getElement(container, 'text')),
	).toBeLessThanOrEqual(0.5);
});

test('a rail taller than the first line leads the row and stays centred on that line in Inter', async () => {
	await loadInter();
	const { container } = render(
		<Lockup data-testid="lockup" gap="sp8" style={{ inlineSize: '14rem' }}>
			<LockupRail>
				<Square size="40px" />
			</LockupRail>
			<LockupBody>
				<Text data-testid="text" elementType="p">
					{longText}
				</Text>
			</LockupBody>
		</Lockup>,
	);
	const lockup = getElement(container, 'lockup').getBoundingClientRect();
	const rail = getElement(container, 'rail-content');
	const railRect = rail.getBoundingClientRect();
	const text = getElement(container, 'text');

	// Trimmed text starts at its capitals, below the top of a rail this tall, so the rail sets the
	// top of the row instead of overflowing it.
	expect(text.getBoundingClientRect().top).toBeGreaterThan(railRect.top);
	expect(railRect.top).toBeCloseTo(lockup.top, 0);
	expect(railRect.bottom).toBeLessThanOrEqual(lockup.bottom);
	expect(offsetFromInterCapCentre(rail, text)).toBeLessThanOrEqual(0.5);
});

test('center centres a tall avatar rail on a two-line body', () => {
	const { container } = render(
		<Lockup gap="sp12" railAlignment="center">
			<LockupRail>
				<Square size="3rem" testId="avatar" />
			</LockupRail>
			<LockupBody data-testid="body">
				<Stack gap="sp4">
					<Text fontWeight="emphasis">Example name</Text>
					<Text typography="caption">Example description</Text>
				</Stack>
			</LockupBody>
		</Lockup>,
	);

	expect(
		Math.abs(centreOf(getElement(container, 'avatar')) - centreOf(getElement(container, 'body'))),
	).toBeLessThanOrEqual(0.5);
});

test('under center, a rail shorter than the cap height is as tall as its content', () => {
	const { container } = render(
		<Lockup gap="sp8" railAlignment="center">
			<LockupRail data-testid="rail">
				<Square size="2px" />
			</LockupRail>
			<LockupBody>Body</LockupBody>
		</Lockup>,
	);

	expect(getElement(container, 'rail').getBoundingClientRect().height).toBeCloseTo(2, 1);
});

test('a phrase wrapped in one element keeps its whitespace and aligns with the first line', () => {
	const { container } = render(
		<Lockup gap="sp8" style={{ inlineSize: '16rem' }}>
			<LockupBody>
				<span data-testid="text">{longText}</span>
			</LockupBody>
			<LockupRail>
				<span data-testid="phrase">
					Press <Kbd data-testid="kbd">K</Kbd>
				</span>
			</LockupRail>
		</Lockup>,
	);
	const phrase = getElement(container, 'phrase');
	const words = phrase.firstChild;
	if (words == null) throw new Error('Expected the phrase text.');
	const press = document.createRange();
	press.setStart(words, 0);
	press.setEnd(words, 'Press'.length);
	const pressEnd = press.getBoundingClientRect().right;
	const kbdStart = getElement(container, 'kbd').getBoundingClientRect().left;

	expect(words.textContent).toBe('Press ');
	expect(kbdStart - pressEnd).toBeGreaterThan(0);
	expect(offsetFromFirstLine(phrase, getElement(container, 'text'))).toBeLessThanOrEqual(0.5);
});

test('an image inside a rail aligns with the first line', async () => {
	const { container } = render(
		<Lockup gap="sp8" style={{ inlineSize: '12rem' }}>
			<LockupRail>
				<img alt="" data-testid="image" height={20} src={squareImage} width={20} />
			</LockupRail>
			<LockupBody>
				<span data-testid="text">{longText}</span>
			</LockupBody>
		</Lockup>,
	);
	const image = getElement(container, 'image');
	if (image instanceof HTMLImageElement) await image.decode();

	expect(offsetFromFirstLine(image, getElement(container, 'text'))).toBeLessThanOrEqual(0.5);
});

test('rails keep their inline size while the body shrinks and truncates inside the row', () => {
	const { container } = render(
		<Lockup data-testid="lockup" gap="sp8" style={{ inlineSize: '12rem' }}>
			<LockupRail>
				<Square size="2rem" testId="start" />
			</LockupRail>
			<LockupBody data-testid="body">
				<span
					data-testid="truncated"
					style={{
						display: 'block',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					Anunbrokenstringoftextthatwouldotherwiseforcethisrowtooverflowitscontainer
				</span>
			</LockupBody>
			<LockupRail>
				<Square size="2rem" testId="end" />
			</LockupRail>
		</Lockup>,
	);
	const lockup = getElement(container, 'lockup');
	const truncated = getElement(container, 'truncated');

	expect(getElement(container, 'start').getBoundingClientRect().width).toBeCloseTo(32, 0);
	expect(getElement(container, 'end').getBoundingClientRect().width).toBeCloseTo(32, 0);
	expect(truncated.scrollWidth).toBeGreaterThan(truncated.clientWidth);
	expect(lockup.scrollWidth).toBeLessThanOrEqual(lockup.clientWidth);
});

test('an absent rail leaves no part or gap, and several rails sit in DOM order', () => {
	function Row({ hasRail }: { hasRail: boolean }) {
		return (
			<Lockup data-testid="lockup" gap="sp8">
				{hasRail && (
					<LockupRail>
						<Square size="1rem" testId="first" />
					</LockupRail>
				)}
				{hasRail && (
					<LockupRail>
						<Square size="1rem" testId="second" />
					</LockupRail>
				)}
				<LockupBody data-testid="body">Body</LockupBody>
			</Lockup>
		);
	}
	const { container, rerender } = render(<Row hasRail={false} />);
	const lockup = getElement(container, 'lockup');

	expect(lockup.children).toHaveLength(1);
	expect(getElement(container, 'body').getBoundingClientRect().width).toBeCloseTo(
		lockup.getBoundingClientRect().width,
		0,
	);

	rerender(<Row hasRail />);
	const first = getElement(container, 'first').getBoundingClientRect();
	const second = getElement(container, 'second').getBoundingClientRect();
	const body = getElement(container, 'body').getBoundingClientRect();

	expect(second.left - first.right).toBeCloseTo(8, 0);
	expect(body.left - second.right).toBeCloseTo(8, 0);
});

test('places parts in DOM order under RTL', () => {
	const { container } = render(
		<div dir="rtl">
			<Lockup gap="sp8">
				<LockupRail>
					<Square size="1rem" testId="before" />
				</LockupRail>
				<LockupBody>Body</LockupBody>
				<LockupRail>
					<Square size="1rem" testId="after" />
				</LockupRail>
			</Lockup>
		</div>,
	);

	expect(getElement(container, 'before').getBoundingClientRect().left).toBeGreaterThan(
		getElement(container, 'after').getBoundingClientRect().left,
	);
});

test('resolves a responsive gap against the container width', async () => {
	const originalWidth = window.innerWidth;
	const originalHeight = window.innerHeight;
	const { container } = render(
		<Lockup data-testid="lockup" gap={{ bp768: 'sp24', initial: 'sp8' }}>
			<LockupRail>
				<Square size="1rem" />
			</LockupRail>
			<LockupBody>Body</LockupBody>
		</Lockup>,
	);
	const gap = () => getComputedStyle(getElement(container, 'lockup')).columnGap;

	try {
		expect(gap()).toBe('8px');

		await page.viewport(breakpoints.bp768, originalHeight);
		expect(gap()).toBe('24px');
	} finally {
		await page.viewport(originalWidth, originalHeight);
	}
});

// Each root sits in a parent whose content model allows it.
for (const [elementType, Parent, partTagName] of [
	['div', 'div', 'DIV'],
	['li', 'ul', 'DIV'],
	['span', 'p', 'SPAN'],
] as const) {
	test(`a ${elementType} Lockup renders ${partTagName.toLowerCase()} parts by default`, () => {
		const { container } = render(
			<Parent>
				<Lockup data-testid="lockup" elementType={elementType} gap="sp8">
					<LockupRail>Rail</LockupRail>
					<LockupBody>Body</LockupBody>
				</Lockup>
			</Parent>,
		);
		const root = getElement(container, 'lockup');

		expect(root.tagName).toBe(elementType.toUpperCase());
		expect([...root.children].map((child) => child.tagName)).toEqual([partTagName, partTagName]);
		expect(getComputedStyle(root).display).toBe(elementType === 'span' ? 'inline-flex' : 'flex');
	});
}

test('a nested Lockup inside a span Lockup renders phrasing content', () => {
	const { container } = render(
		<p>
			<Lockup elementType="span" gap="sp4">
				<LockupBody>
					<Lockup data-testid="nested" gap="sp4">
						<LockupRail>Rail</LockupRail>
						<LockupBody>Body</LockupBody>
					</Lockup>
				</LockupBody>
			</Lockup>
		</p>,
	);
	const paragraph = expectHtmlElement(container.querySelector('p'), 'Expected a paragraph.');

	expect(getElement(container, 'nested').tagName).toBe('SPAN');
	expect(paragraph.querySelectorAll(':not(span)')).toHaveLength(0);
});

test('renderRoot owns each part’s element and keeps its layout', () => {
	const { container } = render(
		<Lockup gap="sp8" renderRoot={(domProps) => <section {...domProps} data-testid="lockup" />}>
			<LockupRail renderRoot={(domProps) => <span {...domProps} data-testid="rail" />}>
				<Square size="1rem" />
			</LockupRail>
			<LockupBody renderRoot={(domProps) => <p {...domProps} data-testid="body" />}>
				<span data-testid="text">{longText}</span>
			</LockupBody>
		</Lockup>,
	);

	expect(getElement(container, 'lockup').tagName).toBe('SECTION');
	expect(getElement(container, 'rail').tagName).toBe('SPAN');
	expect(getElement(container, 'body').tagName).toBe('P');
	expect(
		offsetFromFirstLine(getElement(container, 'rail-content'), getElement(container, 'text')),
	).toBeLessThanOrEqual(0.5);
});

test('a renderRoot Lockup is block-level unless it sits inside a span Lockup', () => {
	function LinkLockup({ testId }: { testId: string }) {
		return (
			<Lockup
				gap="sp4"
				renderRoot={({ children, ...domProps }) => (
					<a {...domProps} data-testid={testId} href="#example">
						{children}
					</a>
				)}
			>
				<LockupBody elementType="span">Link</LockupBody>
			</Lockup>
		);
	}
	const { container } = render(
		<>
			<LinkLockup testId="flow" />
			<p>
				<Lockup elementType="span" gap="sp4">
					<LockupBody>
						<LinkLockup testId="phrasing" />
					</LockupBody>
				</Lockup>
			</p>
		</>,
	);

	expect(getComputedStyle(getElement(container, 'flow')).display).toBe('flex');
	expect(getComputedStyle(getElement(container, 'phrasing')).display).toBe('inline-flex');
});

test('a rail ignores the flex item props it owns', () => {
	// Cast past the types to prove the runtime drops a prop a JavaScript caller could still pass.
	const railProps = { 'data-testid': 'rail', flexGrow: '1' } as LockupRailProps;
	const { container } = render(
		<Lockup gap="sp8" inlineSize="20rem">
			<LockupRail {...railProps}>
				<Square size="1rem" />
			</LockupRail>
			<LockupBody>Body</LockupBody>
		</Lockup>,
	);

	expect(getElement(container, 'rail').getBoundingClientRect().width).toBeCloseTo(16, 0);
});

test('Lockup and its parts forward className, data attributes, id, and ref', () => {
	for (const Part of [Lockup, LockupRail, LockupBody]) {
		const ref = createRef<HTMLElement>();
		const { container, unmount } = render(
			<Part {...forwardedDomProps} ref={ref}>
				Content
			</Part>,
		);

		expectForwardsDomProps(
			expectHtmlElement(container.firstElementChild, 'Expected a rendered part.'),
			ref,
		);
		unmount();
	}
});

test('the Lockup scene has no axe violations', async () => {
	const { container } = render(<LockupScene />);

	await expectNoAxeViolations(container);
});

const squareImage =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1'/%3E%3C/svg%3E";

const itemStyle = {
	backgroundColor: vars.color.surface.base,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

const rowStyle = {
	backgroundColor: vars.color.surface.subdued,
	borderRadius: vars.radius.surface,
	color: vars.color.text.primary,
	padding: vars.space.sp16,
} as const;

function LockupScene() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
			<Lockup gap="sp8" style={{ ...rowStyle, inlineSize: '20rem' }}>
				<LockupRail>
					<span style={itemStyle}>Rail</span>
				</LockupRail>
				<LockupBody>A body that wraps beside a rail centred on its first line.</LockupBody>
				<LockupRail>
					<span style={itemStyle}>Rail</span>
				</LockupRail>
			</Lockup>
			<Lockup gap="sp8" style={{ ...rowStyle, inlineSize: '16rem' }}>
				<LockupRail>
					<span style={{ ...itemStyle, blockSize: '3rem', display: 'block' }} />
				</LockupRail>
				<LockupBody>
					A tall rail stays centred on the first line and makes the row taller.
				</LockupBody>
			</Lockup>
			<Lockup gap="sp12" railAlignment="center" style={{ ...rowStyle, inlineSize: '16rem' }}>
				<LockupRail>
					<span
						style={{ ...itemStyle, blockSize: '3rem', borderRadius: '50%', display: 'block' }}
					/>
				</LockupRail>
				<LockupBody>
					<Stack gap="sp4">
						<Text fontWeight="emphasis">Centred on the whole body</Text>
						<Text typography="caption">A second line</Text>
					</Stack>
				</LockupBody>
			</Lockup>
			<Heading level={2} style={{ ...rowStyle, inlineSize: '20rem' }}>
				<Lockup elementType="span" gap="sp8">
					<LockupRail>
						<span style={{ ...itemStyle, blockSize: '1rem', display: 'block' }} />
					</LockupRail>
					<LockupBody>A heading around a phrasing Lockup</LockupBody>
				</Lockup>
			</Heading>
			<div dir="rtl">
				<Lockup gap="sp8" style={rowStyle}>
					<LockupRail>
						<span style={itemStyle}>Rail</span>
					</LockupRail>
					<LockupBody>RTL</LockupBody>
				</Lockup>
			</div>
		</div>
	);
}

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<LockupScene />, { appearance });
		await captureVisualAppearance(locator, 'lockup/kitchen-sink', appearance);
	}
});
