import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import type { CSSProperties, ReactNode } from 'react';
import { expect, test } from 'vite-plus/test';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

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

test('defaults railAlignment to start and pins firstLine to the centre’s first line', () => {
	const { locator: defaultLocator } = render(
		<Track data-testid="track" gap="sp8">
			Centre
		</Track>,
	);
	const defaultElement = defaultLocator.getByTestId('track').element();
	if (!(defaultElement instanceof HTMLElement)) throw new Error('Expected Track element.');
	expect(getComputedStyle(defaultElement).alignItems).toBe('flex-start');

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

// A zero-width box one cap height tall, sitting on the baseline, spans the capitals of its line.
const capProbeStyle = {
	blockSize: '1cap',
	display: 'inline-block',
	inlineSize: 0,
} satisfies CSSProperties;

function verticalCentre(element: Element): number {
	const rect = element.getBoundingClientRect();
	return rect.top + rect.height / 2;
}

function renderCompound(
	title: ReactNode,
	avatarSize: '1.5rem' | '2.5rem',
	appearance?: VisualAppearance,
) {
	return render(
		<Track
			data-testid="track"
			gap="sp12"
			railAlignment="firstBaseline"
			railEnd={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
			railStart={
				<Box
					backgroundColor="neutral.subtle.rest"
					blockSize={avatarSize}
					borderRadius="full"
					data-testid="avatar"
					display="inline-flex"
					elementType="span"
					inlineSize={avatarSize}
				/>
			}
			style={{ inlineSize: '20rem' }}
		>
			<Stack gap="sp4">
				{title}
				<Text typography="caption">Description that may wrap onto a second line of text</Text>
			</Stack>
		</Track>,
		{ appearance },
	);
}

for (const avatarSize of ['1.5rem', '2.5rem'] as const) {
	test(`firstBaseline centres ${avatarSize} rails on the first line of a stacked title`, () => {
		const { locator } = renderCompound(
			<Text fontWeight="emphasis">
				<span data-testid="cap" style={capProbeStyle} />
				Notification title
			</Text>,
			avatarSize,
		);
		const cap = verticalCentre(locator.getByTestId('cap').element());
		const avatar = locator.getByTestId('avatar').element();
		const track = locator.getByTestId('track').element();

		expect(verticalCentre(avatar)).toBeCloseTo(cap, 0);
		expect(verticalCentre(locator.getByRole('button', { name: 'Dismiss' }).element())).toBeCloseTo(
			cap,
			0,
		);
		// A rail taller than the line grows the row instead of overflowing it.
		expect(avatar.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			track.getBoundingClientRect().top - 0.5,
		);
	});
}

test('firstBaseline follows the title when Track inherits the title typography', () => {
	const { locator } = render(
		<Text elementType="div" shouldDisableTrim typography="heading2">
			<Track
				gap="sp12"
				railAlignment="firstBaseline"
				railStart={<IconButton aria-label="Dismiss" icon="close" size="small" />}
			>
				<Stack gap="sp4">
					<Heading level={2}>
						<span data-testid="cap" style={capProbeStyle} />
						Section title
					</Heading>
					<Text>Description</Text>
				</Stack>
			</Track>
		</Text>,
	);

	expect(verticalCentre(locator.getByRole('button', { name: 'Dismiss' }).element())).toBeCloseTo(
		verticalCentre(locator.getByTestId('cap').element()),
		0,
	);
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

test('first baseline with compound content', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = renderCompound(
			<Text fontWeight="emphasis">Notification title that wraps</Text>,
			'2.5rem',
			appearance,
		);

		await captureVisualAppearance(locator, 'track/first-baseline-compound', appearance);
	}
});
