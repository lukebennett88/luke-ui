import { Heading } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { expectForwardsDomProps, forwardedDomProps } from '../test-utils/forwarding.js';
import { getCentre, measureCapCentre } from '../test-utils/measure-cap-centre.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

const longText =
	'This centre text is long enough that it wraps across multiple lines in the fixed width.';

function getHtmlElement(root: ParentNode, testId: string): HTMLElement {
	const element = root.querySelector(`[data-testid="${testId}"]`);
	if (!(element instanceof HTMLElement)) throw new Error(`Expected an element with ${testId}.`);
	return element;
}

/**
 * Distance between the centre of `rail` and the cap-height centre of the first line of
 * `textElement`. The cap height comes from `textElement`'s font, so pass the innermost element that
 * carries the text.
 */
async function railOffsetFromCapCentre(rail: Element, textElement: Element): Promise<number> {
	await document.fonts.ready;
	return Math.abs(getCentre(rail) - measureCapCentre(textElement));
}

const railBox = (
	<span data-testid="rail" style={{ blockSize: '1rem', display: 'block', inlineSize: '1rem' }} />
);

test('omits a rail wrapper and its gap when a rail prop is absent', () => {
	const neither = render(
		<Track data-testid="track" gap="sp8">
			Centre
		</Track>,
	);
	const neitherElement = neither.locator.getByTestId('track').element();
	if (!(neitherElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(neitherElement.children).toHaveLength(1);
	const [centreOnly] = neitherElement.children;
	if (!(centreOnly instanceof HTMLElement)) throw new Error('Expected centre wrapper.');
	// No phantom gap: with no rails, the centre's own inline extent matches the
	// root's content box exactly.
	const rootStyle = getComputedStyle(neitherElement);
	const rootContentWidth =
		neitherElement.getBoundingClientRect().width -
		Number.parseFloat(rootStyle.paddingLeft) -
		Number.parseFloat(rootStyle.paddingRight);
	expect(centreOnly.getBoundingClientRect().width).toBeCloseTo(rootContentWidth, 0);

	const startOnly = render(
		<Track data-testid="track" gap="sp8" railStart={<span>Start</span>}>
			Centre
		</Track>,
	);
	const startElement = startOnly.locator.getByTestId('track').element();
	if (!(startElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(startElement.children).toHaveLength(2);
	expect(startElement.children[1]?.textContent).toBe('Centre');

	const endOnly = render(
		<Track data-testid="track" gap="sp8" railEnd={<span>End</span>}>
			Centre
		</Track>,
	);
	const endElement = endOnly.locator.getByTestId('track').element();
	if (!(endElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(endElement.children).toHaveLength(2);
	expect(endElement.children[0]?.textContent).toBe('Centre');

	const both = render(
		<Track data-testid="track" gap="sp8" railEnd={<span>End</span>} railStart={<span>Start</span>}>
			Centre
		</Track>,
	);
	const bothElement = both.locator.getByTestId('track').element();
	if (!(bothElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(bothElement.children).toHaveLength(3);
	expect(bothElement.children[0]?.textContent).toBe('Start');
	expect(bothElement.children[1]?.textContent).toBe('Centre');
	expect(bothElement.children[2]?.textContent).toBe('End');
});

test('rails keep their natural inline size while the centre can shrink', () => {
	const { locator } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railEnd={<span data-testid="rail-end" style={{ display: 'block', inlineSize: '4rem' }} />}
			railStart={<span data-testid="rail-start" style={{ display: 'block', inlineSize: '4rem' }} />}
			style={{ inlineSize: '12rem' }}
		>
			<span data-testid="centre" style={{ display: 'block', whiteSpace: 'nowrap' }}>
				Anunbrokenstringoftextthatwouldotherwiseforcethistrackrowtooverflowitscontainer
			</span>
		</Track>,
	);
	const element = locator.getByTestId('track').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Track element.');
	const start = locator.getByTestId('rail-start').element();
	const end = locator.getByTestId('rail-end').element();
	const centre = locator.getByTestId('centre').element();
	if (
		!(start instanceof HTMLElement) ||
		!(end instanceof HTMLElement) ||
		!(centre instanceof HTMLElement)
	) {
		throw new Error('Expected rail and centre elements.');
	}

	// Rails keep their declared inline size (flexShrink: 0).
	expect(start.getBoundingClientRect().width).toBeCloseTo(64, 0);
	expect(end.getBoundingClientRect().width).toBeCloseTo(64, 0);
	// The centre can shrink below its unbroken content's natural size (minInlineSize: 0).
	expect(centre.getBoundingClientRect().width).toBeLessThan(64);
});

test('defaults railAlignment to start', () => {
	const { locator } = render(
		<Track data-testid="track" gap="sp8">
			Centre
		</Track>,
	);
	const element = getHtmlElement(locator.element(), 'track');
	expect(getComputedStyle(element).alignItems).toBe('flex-start');
});

test('firstLine centres a rail on the cap height of the first line of wrapping text', async () => {
	const { container } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railAlignment="firstLine"
			railStart={railBox}
			style={{ inlineSize: '8rem' }}
		>
			<span data-testid="text">{longText}</span>
		</Track>,
	);
	const text = getHtmlElement(container, 'text');
	const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);

	// The text wraps, so the row is several lines tall and the rail stays on the first.
	expect(text.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 2);
	expect(
		await railOffsetFromCapCentre(getHtmlElement(container, 'rail'), text),
	).toBeLessThanOrEqual(0.5);
});

test('firstLine centres a rail beside trimmed block Text', async () => {
	const { container } = render(
		<Track gap="sp8" railAlignment="firstLine" railStart={railBox} style={{ inlineSize: '14rem' }}>
			<Text data-testid="text" elementType="p">
				{longText}
			</Text>
		</Track>,
	);

	expect(
		await railOffsetFromCapCentre(
			getHtmlElement(container, 'rail'),
			getHtmlElement(container, 'text'),
		),
	).toBeLessThanOrEqual(0.5);
});

test('a Heading around a span Track aligns the rail to the heading and keeps the markup valid', async () => {
	const { container } = render(
		<Heading data-testid="heading" level={2} style={{ inlineSize: '16rem' }}>
			<Track
				data-testid="track"
				elementType="span"
				gap="sp8"
				railAlignment="firstLine"
				railStart={railBox}
			>
				<span data-testid="text">Title that wraps across several lines of the heading</span>
			</Track>
		</Heading>,
	);
	const heading = getHtmlElement(container, 'heading');
	const track = getHtmlElement(container, 'track');

	expect(track.parentElement).toBe(heading);
	// A span root stays inline-level and holds only phrasing content, so it is valid in a heading.
	expect(getComputedStyle(track).display).toBe('inline-flex');
	expect(heading.querySelectorAll(':not(span)')).toHaveLength(0);
	expect(
		await railOffsetFromCapCentre(
			getHtmlElement(container, 'rail'),
			getHtmlElement(container, 'text'),
		),
	).toBeLessThanOrEqual(0.5);
});

test('Text around a div Track aligns the rail to the inherited caption typography', async () => {
	const { container } = render(
		<Text elementType="div" style={{ inlineSize: '12rem' }} typography="caption">
			<Track gap="sp8" railAlignment="firstLine" railStart={railBox}>
				<Text data-testid="text" shouldInheritFont>
					{longText}
				</Text>
			</Track>
		</Text>,
	);

	expect(
		await railOffsetFromCapCentre(
			getHtmlElement(container, 'rail'),
			getHtmlElement(container, 'text'),
		),
	).toBeLessThanOrEqual(0.5);
});

test('firstLine centres a rail on the first line of a compound centre', async () => {
	const { container } = render(
		<Text elementType="div" style={{ inlineSize: '14rem' }}>
			<Track gap="sp8" railAlignment="firstLine" railStart={railBox}>
				<Stack gap="sp4">
					<Text data-testid="text" fontWeight="emphasis">
						Title
					</Text>
					<Text color="secondary" typography="caption">
						{longText}
					</Text>
				</Stack>
			</Track>
		</Text>,
	);

	expect(
		await railOffsetFromCapCentre(
			getHtmlElement(container, 'rail'),
			getHtmlElement(container, 'text'),
		),
	).toBeLessThanOrEqual(0.5);
});

test('a rail taller than the line grows the row and stays centred on the first line', async () => {
	const { container } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railAlignment="firstLine"
			railStart={
				<span
					data-testid="rail"
					style={{ blockSize: '40px', display: 'block', inlineSize: '40px' }}
				/>
			}
			style={{ inlineSize: '14rem' }}
		>
			<Text data-testid="text" elementType="p">
				Short
			</Text>
		</Track>,
	);
	const track = getHtmlElement(container, 'track').getBoundingClientRect();
	const rail = getHtmlElement(container, 'rail');
	const railRect = rail.getBoundingClientRect();

	expect(railRect.height).toBe(40);
	expect(railRect.top).toBeGreaterThanOrEqual(track.top - 0.5);
	expect(railRect.bottom).toBeLessThanOrEqual(track.bottom + 0.5);
	expect(track.height).toBeGreaterThanOrEqual(40);
	expect(
		await railOffsetFromCapCentre(rail, getHtmlElement(container, 'text')),
	).toBeLessThanOrEqual(0.5);
});

test('firstLine aligns an IconButton rail and keeps it reachable by role', async () => {
	const { container, locator } = render(
		<Text elementType="div" style={{ inlineSize: '14rem' }}>
			<Track
				gap="sp8"
				railAlignment="firstLine"
				railEnd={<IconButton aria-label="Dismiss" icon="close" size="small" />}
			>
				<span data-testid="text">{longText}</span>
			</Track>
		</Text>,
	);
	const button = locator.getByRole('button', { name: 'Dismiss' });

	await expect.element(button).toBeVisible();
	expect(
		await railOffsetFromCapCentre(button.element(), getHtmlElement(container, 'text')),
	).toBeLessThanOrEqual(0.5);
});

test('firstLine aligns a Kbd rail', async () => {
	const { container } = render(
		<Text elementType="div" style={{ inlineSize: '14rem' }}>
			<Track gap="sp8" railAlignment="firstLine" railEnd={<Kbd data-testid="rail">K</Kbd>}>
				<span data-testid="text">{longText}</span>
			</Track>
		</Text>,
	);

	expect(
		await railOffsetFromCapCentre(
			getHtmlElement(container, 'rail'),
			getHtmlElement(container, 'text'),
		),
	).toBeLessThanOrEqual(0.5);
});

test('a Link in the centre keeps its underline and stays aligned', async () => {
	const { container } = render(
		<Text elementType="div" style={{ inlineSize: '14rem' }}>
			<Track gap="sp8" railAlignment="firstLine" railStart={railBox}>
				<Link data-testid="link" href="https://example.com/">
					Read the documentation for the wrapping link
				</Link>
			</Track>
		</Text>,
	);
	const link = getHtmlElement(container, 'link');

	expect(getComputedStyle(link).textDecorationLine).toContain('underline');
	expect(
		await railOffsetFromCapCentre(getHtmlElement(container, 'rail'), link),
	).toBeLessThanOrEqual(0.5);
});

test('a line-clamped centre is clamped to two lines and aligned', async () => {
	const { container } = render(
		<Text elementType="div" style={{ inlineSize: '14rem' }}>
			<Track gap="sp8" railAlignment="firstLine" railStart={railBox}>
				<Text data-testid="text" lineClamp={2}>
					{longText} {longText}
				</Text>
			</Track>
		</Text>,
	);
	const text = getHtmlElement(container, 'text');
	const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);

	expect(text.getBoundingClientRect().height).toBeCloseTo(lineHeight * 2, 0);
	expect(
		await railOffsetFromCapCentre(getHtmlElement(container, 'rail'), text),
	).toBeLessThanOrEqual(0.5);
});

test('firstLine stays aligned under RTL with railStart on the inline-start side', async () => {
	const { container } = render(
		<div dir="rtl" style={{ inlineSize: '14rem' }}>
			<Text elementType="div">
				<Track gap="sp8" railAlignment="firstLine" railStart={railBox}>
					<span data-testid="text">{longText}</span>
				</Track>
			</Text>
		</div>,
	);
	const rail = getHtmlElement(container, 'rail');
	const text = getHtmlElement(container, 'text');

	expect(rail.getBoundingClientRect().left).toBeGreaterThan(text.getBoundingClientRect().left);
	expect(await railOffsetFromCapCentre(rail, text)).toBeLessThanOrEqual(0.5);
});

test('resolves a responsive gap against the container width', async () => {
	const originalWidth = window.innerWidth;
	const originalHeight = window.innerHeight;
	const { container } = render(
		<>
			<Track data-testid="track" gap={{ initial: 'sp8', bp768: 'sp24' }} railStart={railBox}>
				Centre
			</Track>
			<span data-testid="sp8" style={{ display: 'block', inlineSize: vars.space.sp8 }} />
			<span data-testid="sp24" style={{ display: 'block', inlineSize: vars.space.sp24 }} />
		</>,
	);
	const gap = () =>
		Number.parseFloat(getComputedStyle(getHtmlElement(container, 'track')).columnGap);
	const tokenSize = (testId: string) =>
		getHtmlElement(container, testId).getBoundingClientRect().width;

	try {
		expect(gap()).toBeCloseTo(tokenSize('sp8'), 1);

		await page.viewport(breakpoints.bp768, originalHeight);
		expect(gap()).toBeCloseTo(tokenSize('sp24'), 1);
	} finally {
		await page.viewport(originalWidth, originalHeight);
	}
});

test('forwards className, data attributes, id, and ref to the root element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Track {...forwardedDomProps} ref={ref}>
			Centre
		</Track>,
	);
	const target = container.firstElementChild;
	if (target == null) throw new Error('Expected a Track element.');

	expectForwardsDomProps(target, ref);
});

test('renders the documented element types and matching internal wrappers', () => {
	const spanResult = render(
		<Track data-testid="track" elementType="span" gap="sp8" railStart={<span>Start</span>}>
			Centre
		</Track>,
	);
	const spanElement = spanResult.locator.getByTestId('track').element();
	if (!(spanElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(spanElement.tagName).toBe('SPAN');
	for (const child of spanElement.children) {
		expect(child.tagName).toBe('SPAN');
	}
	// A span root must stay inline-level so Track can sit inside a sentence,
	// not break onto its own line.
	expect(getComputedStyle(spanElement).display).toBe('inline-flex');

	const listResult = render(
		<ul>
			<Track elementType="li" gap="sp8">
				List item content
			</Track>
		</ul>,
	);
	const listItem = listResult.locator.getByRole('listitem');
	expect(listItem.element().tagName).toBe('LI');
	expect(getComputedStyle(listItem.element()).display).toBe('flex');

	const defaultResult = render(
		<Track data-testid="track" gap="sp8" railStart={<span>Start</span>}>
			Centre
		</Track>,
	);
	const defaultElement = defaultResult.locator.getByTestId('track').element();
	if (!(defaultElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(defaultElement.tagName).toBe('DIV');
	for (const child of defaultElement.children) {
		expect(child.tagName).toBe('DIV');
	}
	expect(getComputedStyle(defaultElement).display).toBe('flex');
});

test('keeps rail order logical under RTL, putting railStart on the inline-start side', () => {
	const { locator } = render(
		<div dir="rtl">
			<Track
				gap="sp8"
				railEnd={<span data-testid="rail-end">End</span>}
				railStart={<span data-testid="rail-start">Start</span>}
			>
				Centre
			</Track>
		</div>,
	);
	const start = locator.getByTestId('rail-start').element();
	const end = locator.getByTestId('rail-end').element();
	if (!(start instanceof HTMLElement) || !(end instanceof HTMLElement)) {
		throw new Error('Expected rail elements.');
	}

	// Under RTL, inline-start is the right edge, so railStart renders to the
	// right of railEnd.
	expect(start.getBoundingClientRect().left).toBeGreaterThan(end.getBoundingClientRect().left);
});

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

const railStart = <span style={itemStyle}>Start</span>;
const railEnd = <span style={itemStyle}>End</span>;

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				<Track
					gap="sp8"
					railEnd={railEnd}
					railStart={railStart}
					style={{ ...rowStyle, inlineSize: '20rem' }}
				>
					<span style={itemStyle}>Both rails beside wrapping centre</span>
				</Track>
				<Track
					gap="sp8"
					railAlignment="firstLine"
					railStart={<span style={{ ...itemStyle, blockSize: '3rem', display: 'block' }} />}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					A tall rail beside multiline text stays on the first line and grows the row.
				</Track>
				<Heading level={2} style={{ ...rowStyle, inlineSize: '20rem' }}>
					<Track
						elementType="span"
						gap="sp8"
						railAlignment="firstLine"
						railStart={<span style={{ ...itemStyle, blockSize: '1rem', display: 'block' }} />}
					>
						A heading that wraps beside a rail centred on its caps
					</Track>
				</Heading>
				<div dir="rtl">
					<Track gap="sp8" railEnd={railEnd} railStart={railStart} style={rowStyle}>
						<span style={itemStyle}>RTL</span>
					</Track>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'track/kitchen-sink', appearance);
	}
});
