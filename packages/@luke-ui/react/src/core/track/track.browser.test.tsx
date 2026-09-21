import { Heading } from '@luke-ui/react/heading';
// Only styles the visual fixture below; no test asserts a resolved token value.
// oxlint-disable-next-line no-restricted-imports
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, variantValuesFor } from '../test-utils/visual.js';

test('Track forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Track gap="sp8" className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</Track>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected Track element.');

	expectForwardsDomProps(target, ref);
});

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

test('maps every railAlignment to the expected cross-axis alignment, defaulting to start', () => {
	const alignments = [
		['start', 'flex-start'],
		['firstLine', 'flex-start'],
		['center', 'center'],
		['end', 'flex-end'],
	] as const;

	for (const [railAlignment, expected] of alignments) {
		const { locator } = render(
			<Track data-testid="track" gap="sp8" railAlignment={railAlignment}>
				Centre
			</Track>,
		);
		const element = locator.getByTestId('track').element();
		if (!(element instanceof HTMLElement)) throw new Error('Expected Track element.');
		expect(getComputedStyle(element).alignItems).toBe(expected);
	}

	const { locator: defaultLocator } = render(
		<Track data-testid="track" gap="sp8">
			Centre
		</Track>,
	);
	const defaultElement = defaultLocator.getByTestId('track').element();
	if (!(defaultElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(getComputedStyle(defaultElement).alignItems).toBe('flex-start');
});

test('pins a rail taller than the line box to the centre’s first line under firstLine', () => {
	const { locator } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railAlignment="firstLine"
			railStart={<span data-testid="rail" style={{ blockSize: '3rem', display: 'block' }} />}
			style={{ inlineSize: '8rem' }}
		>
			This centre text is long enough that it wraps across multiple lines in the fixed width.
		</Track>,
	);
	const element = locator.getByTestId('track').element();
	const rail = locator.getByTestId('rail').element();
	if (!(element instanceof HTMLElement) || !(rail instanceof HTMLElement)) {
		throw new Error('Expected Track elements.');
	}
	const railWrapper = rail.parentElement;
	if (!(railWrapper instanceof HTMLElement)) throw new Error('Expected rail wrapper.');

	const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
	expect(railWrapper.getBoundingClientRect().height).toBeCloseTo(lineHeight, 0);
	// The rail itself is taller than the wrapper it is pinned into.
	expect(rail.getBoundingClientRect().height).toBeGreaterThan(
		railWrapper.getBoundingClientRect().height,
	);
});

test('uses Track line-height for firstLine when the centre contains a Heading', () => {
	const { locator } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railAlignment="firstLine"
			railStart={<span data-testid="rail" />}
		>
			<Heading data-testid="heading" level={2} style={{ lineHeight: '4rem' }}>
				Quarterly performance
			</Heading>
		</Track>,
	);
	const element = locator.getByTestId('track').element();
	const rail = locator.getByTestId('rail').element();
	const heading = locator.getByTestId('heading').element();
	if (
		!(element instanceof HTMLElement) ||
		!(rail instanceof HTMLElement) ||
		!(heading instanceof HTMLElement)
	) {
		throw new Error('Expected Track elements.');
	}
	const railWrapper = rail.parentElement;
	if (!(railWrapper instanceof HTMLElement)) throw new Error('Expected rail wrapper.');

	const trackLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
	const headingLineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
	expect(headingLineHeight).toBeGreaterThan(trackLineHeight);
	expect(railWrapper.getBoundingClientRect().height).toBeCloseTo(trackLineHeight, 0);
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

const railAlignments = variantValuesFor<typeof Track, 'railAlignment'>()([
	'start',
	'firstLine',
	'center',
	'end',
]);

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

const rowStyle = {
	backgroundColor: vars.color.surface.recessed,
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
				{railAlignments.map((railAlignment) => (
					<Track
						gap="sp8"
						key={railAlignment}
						railAlignment={railAlignment}
						railEnd={railEnd}
						railStart={railStart}
						style={{ ...rowStyle, inlineSize: '20rem' }}
					>
						<span style={itemStyle}>This centre wraps beside both rails ({railAlignment})</span>
					</Track>
				))}
				<Track gap="sp8" railStart={railStart} style={rowStyle}>
					<span style={itemStyle}>Start rail only</span>
				</Track>
				<Track gap="sp8" railEnd={railEnd} style={rowStyle}>
					<span style={itemStyle}>End rail only</span>
				</Track>
				<Track gap="sp8" railEnd={railEnd} railStart={railStart} style={rowStyle}>
					<span style={itemStyle}>Both rails</span>
				</Track>
				<Track gap="sp8" style={rowStyle}>
					<span style={itemStyle}>Neither rail</span>
				</Track>
				<Track
					gap="sp8"
					railEnd={railEnd}
					railStart={railStart}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					<span style={{ display: 'block', overflow: 'hidden', whiteSpace: 'nowrap' }}>
						Anunbrokenstringoftextthatoverflowsthecentrewithoutwrapping
					</span>
				</Track>
				<Track
					gap="sp8"
					railEnd={railEnd}
					railStart={railStart}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					This centre text wraps across multiple lines to show how the rails sit alongside multiline
					content.
				</Track>
				<Track
					gap="sp8"
					railAlignment="firstLine"
					railStart={<span style={{ ...itemStyle, blockSize: '3rem', display: 'block' }} />}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					A tall rail beside multiline text stays pinned to the first line instead of growing with
					the centre.
				</Track>
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
