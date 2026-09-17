import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Track } from './track.js';

testConformance({
	path: 'track',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected Track element.');
		return target;
	},
	render: (props = {}) =>
		render(
			<Track gap="sp8" {...props}>
				Content
			</Track>,
		),
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

test('rails keep their natural inline size while the centre shrinks and prevents overflow', () => {
	const { locator } = render(
		<Track
			data-testid="track"
			gap="sp8"
			railEnd={<span data-testid="rail-end" style={{ display: 'block', inlineSize: '4rem' }} />}
			railStart={<span data-testid="rail-start" style={{ display: 'block', inlineSize: '4rem' }} />}
			style={{ inlineSize: '12rem' }}
		>
			<span
				data-testid="centre"
				style={{ display: 'block', overflow: 'hidden', whiteSpace: 'nowrap' }}
			>
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

	// Rails keep their declared inline size (flexShrink: 0)...
	expect(start.getBoundingClientRect().width).toBeCloseTo(64, 0);
	expect(end.getBoundingClientRect().width).toBeCloseTo(64, 0);
	// ...while the centre is squeezed below its unbroken content's natural size
	// (minInlineSize: 0), so the row never overflows its own container.
	expect(centre.getBoundingClientRect().width).toBeLessThan(64);
	expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
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
