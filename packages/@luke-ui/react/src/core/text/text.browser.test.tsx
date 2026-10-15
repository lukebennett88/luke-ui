import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Em } from '@luke-ui/react/em';
import { Emoji } from '@luke-ui/react/emoji';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Link } from '@luke-ui/react/link';
import { Quote } from '@luke-ui/react/quote';
import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { createRef } from 'react';
import { Menu, MenuItem } from 'react-aria-components/Menu';
import { TextContext } from 'react-aria-components/Text';
import { expect, test } from 'vite-plus/test';
import { typeStyles } from '../../theme/type-styles.js';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';

const slottedTextContext = { slots: { description: {}, errorMessage: {} } };

test('Text fills a React Aria MenuItem label and description', async () => {
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text slot="label" typography="label">
					Save changes
				</Text>
				<Text color="secondary" slot="description" typography="caption">
					Updates the current document
				</Text>
			</MenuItem>
		</Menu>,
	);

	const item = locator.getByRole('menuitem');
	await expect.element(item).toHaveAccessibleName('Save changes');
	await expect.element(item).toHaveAccessibleDescription('Updates the current document');
});

test('Text slot null opts out of surrounding slotted text context', () => {
	const { locator } = render(
		<TextContext.Provider value={slottedTextContext}>
			<Text slot={null}>Opted out label</Text>
		</TextContext.Provider>,
	);

	expect(locator.getByText('Opted out label').element().tagName).toBe('SPAN');
});

// Inline typography sits inside a field's label, description, or error, where React Aria provides
// slotted text context. It never fills a slot.
const inlineTypography = [
	{ element: <Code>Inline code</Code>, name: 'Code', text: 'Inline code' },
	{ element: <Em>Inline emphasis</Em>, name: 'Em', text: 'Inline emphasis' },
	{ element: <Emoji emoji="🙂" label="Inline emoji" />, name: 'Emoji', text: '🙂' },
	{ element: <Kbd>Inline key</Kbd>, name: 'Kbd', text: 'Inline key' },
	{ element: <Quote>Inline quote</Quote>, name: 'Quote', text: 'Inline quote' },
	{ element: <Strong>Inline strong</Strong>, name: 'Strong', text: 'Inline strong' },
];

for (const { element, name, text } of inlineTypography) {
	test(`${name} renders inside slotted text context without a slot`, () => {
		const { locator } = render(
			<TextContext.Provider value={slottedTextContext}>{element}</TextContext.Provider>,
		);

		expect(locator.getByText(text).element()).toBeInTheDocument();
	});
}

test('Text isVisuallyHidden keeps named slots without an extra wrapper', async () => {
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text isVisuallyHidden slot="label" typography="label">
					Save changes
				</Text>
				<Text isVisuallyHidden slot="description">
					Updates the current document
				</Text>
			</MenuItem>
		</Menu>,
	);
	const item = locator.getByRole('menuitem');
	const label = locator.getByText('Save changes').element();
	const description = locator.getByText('Updates the current document').element();

	expect(label.tagName).toBe('SPAN');
	expect(label.parentElement).toBe(item.element());
	expect(description.parentElement).toBe(item.element());
	await expect.element(item).toHaveAccessibleName('Save changes');
	await expect.element(item).toHaveAccessibleDescription('Updates the current document');
});

test('Text isVisuallyHidden keeps slot null opt-out without an extra wrapper', () => {
	const { locator, container } = render(
		<TextContext.Provider value={slottedTextContext}>
			<Text isVisuallyHidden slot={null}>
				Hidden opted out
			</Text>
		</TextContext.Provider>,
	);
	const label = locator.getByText('Hidden opted out').element();

	expect(label.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(label);
	expect(container.childElementCount).toBe(1);
});

test('Text isVisuallyHidden hides visually while keeping accessible text', async () => {
	const { locator, container } = render(
		<button type="button">
			<Text isVisuallyHidden style={{ color: 'rgb(1, 2, 3)' }}>
				Save changes
			</Text>
		</button>,
	);
	const label = locator.getByText('Save changes').element();

	expect(label.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(label.parentElement);
	expect(label.style.position).toBe('absolute');
	expect(label.style.overflow).toBe('hidden');
	expect(label.style.clip).toBe('rect(1px, 1px, 1px, 1px)');
	expect(label.style.color).toBe('rgb(1, 2, 3)');
	await expect.element(locator.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
});

test('ordinary Text remains a single React Aria Text root', () => {
	const { locator, container } = render(<Text>Body copy</Text>);
	const text = locator.getByText('Body copy').element();

	expect(text.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(text);
	expect(container.childElementCount).toBe(1);
});

// `shouldInheritFont` inherits `textTransform` and `fontVariantNumeric` along with the other font
// properties, and their variants default to emitting nothing. Without both halves, a composing
// component would reset the surrounding uppercase and numeric styling to `none`/`normal`.
test('components composed on Text inherit surrounding case and numeric styling', () => {
	const { container } = render(
		<Text fontVariantNumeric="tabular-nums" textTransform="uppercase">
			total <Code>abc123</Code> <Kbd>esc</Kbd> <Em>em</Em> <Strong>strong</Strong>
		</Text>,
	);

	for (const selector of ['code', 'kbd', 'em', 'strong']) {
		const element = container.querySelector(selector);
		if (!(element instanceof HTMLElement)) throw new Error(`Expected a ${selector} element.`);

		const styles = getComputedStyle(element);
		expect(styles.textTransform).toBe('uppercase');
		expect(styles.fontVariantNumeric).toBe('tabular-nums');
	}
});

test('an explicit textTransform still wins over the inherited one', () => {
	// `textTransform` is declared after `shouldInheritFont`, so an explicit value outranks the
	// inherited one. Nested `Text` stands in for any composed component that forwards the prop.
	const { container } = render(
		<Text textTransform="uppercase">
			total{' '}
			<Text elementType="em" shouldInheritFont textTransform="lowercase">
				ABC
			</Text>
		</Text>,
	);
	const nested = container.querySelector('em');
	if (!(nested instanceof HTMLElement)) throw new Error('Expected the nested Text element.');

	expect(getComputedStyle(nested).textTransform).toBe('lowercase');
});

test('Text on its own does not inherit case or numeric styling from the page', () => {
	// The resets live in the recipe base, so a plain `Text` stays insulated from ambient page
	// styling. Only `shouldInheritFont` lifts them.
	const { container } = render(
		<div style={{ fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
			<Text>Body copy</Text>
		</div>,
	);
	const text = container.querySelector('span');
	if (!(text instanceof HTMLElement)) throw new Error('Expected a Text element.');

	const styles = getComputedStyle(text);
	expect(styles.textTransform).toBe('none');
	expect(styles.fontVariantNumeric).toBe('normal');
});

// The baseline of the line a zero-size inline-block sits on is its bottom edge.
const baselineMarkerStyle = {
	blockSize: 0,
	display: 'inline-block',
	inlineSize: 0,
} satisfies CSSProperties;

for (const typography of typeStyles) {
	test(`trimmed ${typography} Text aligns by its first baseline in a baseline row`, () => {
		const { locator } = render(
			<div style={{ alignItems: 'baseline', display: 'flex', gap: '1rem', inlineSize: '20rem' }}>
				<Text elementType="p" typography={typography}>
					<span data-testid="trimmed" style={baselineMarkerStyle} />
					Trimmed text that wraps onto a second line
				</Text>
				<Text>
					<span data-testid="untrimmed" style={baselineMarkerStyle} />
					Inline
				</Text>
			</div>,
		);
		const trimmed = locator.getByTestId('trimmed').element().getBoundingClientRect();
		const untrimmed = locator.getByTestId('untrimmed').element().getBoundingClientRect();

		expect(untrimmed.bottom).toBeCloseTo(trimmed.bottom, 0);
	});
}

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} satisfies CSSProperties;

test('typography styles', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack width="40rem">
				<div style={rowStyle}>
					{typeStyles.map((typography) => (
						<Text key={typography} typography={typography}>
							{typography}
						</Text>
					))}
				</div>
				<div style={rowStyle}>
					<Text fontWeight="body">Body</Text>
					<Text fontWeight="label">Label</Text>
					<Text fontWeight="heading">Heading</Text>
					<Text fontWeight="emphasis">Emphasis</Text>
				</div>
				<Text fontWeight="emphasis" typography="body">
					Nested defaults and overrides: <Text typography="label">Label default</Text>{' '}
					<Text fontWeight="body" typography="label">
						Label with body weight
					</Text>{' '}
					<Text shouldInheritFont>Inherited emphasis</Text>
				</Text>
				<div style={rowStyle}>
					<Text color="primary">Primary</Text>
					<Text color="secondary">Secondary</Text>
					<Text color="accent">Accent</Text>
					<Text color="info">Info</Text>
					<Text color="success">Success</Text>
					<Text color="warning">Warning</Text>
					<Text color="danger">Danger</Text>
				</div>
				<Text>Trimmed by default</Text>
				<Text shouldDisableTrim>Trim disabled</Text>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'text/type-scale', appearance);
	}
});

test('Em, Strong, and Kbd inheritance', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="24rem">
			<Text fontWeight="emphasis" typography="lead">
				Read the <Em>full</Em> guide, mark the <Strong>required</Strong> steps, then run{' '}
				<Kbd>Cmd+S</Kbd> to save.
			</Text>
			<Text typography="caption">
				A caption sentence with <Em>emphasis</Em>, <Strong>importance</Strong>, and a <Kbd>Tab</Kbd>{' '}
				key at a smaller size — the Kbd chip stays the same size as above.
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/em-strong-kbd-inheritance');
});

test('line clamp and transforms', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="18rem">
			<Text lineClamp={2}>
				A short paragraph of placeholder copy that wraps across multiple lines and then clamps.
			</Text>
			<Text textDecoration="underline" textTransform="uppercase">
				Decorated text
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/line-clamp-transforms');
});

// A zero-width box one cap height tall, sitting on the baseline, spans the capitals of its line.
const capProbeStyle = {
	blockSize: '1cap',
	display: 'inline-block',
	inlineSize: 0,
} satisfies CSSProperties;

const wrappingCopy = 'Example text that wraps onto several lines when the column is narrow';

function verticalCentre(element: Element): number {
	const rect = element.getBoundingClientRect();
	return rect.top + rect.height / 2;
}

function lineRects(element: Element): Array<DOMRect> {
	const range = document.createRange();
	range.selectNodeContents(element);
	return [...range.getClientRects()];
}

function querySvg(container: Element): SVGSVGElement {
	const svg = container.querySelector('svg');
	if (svg == null) throw new Error('Expected an icon.');
	return svg;
}

for (const typography of typeStyles) {
	for (const size of ['xsmall', 'medium', 'large'] as const) {
		test(`centres a ${size} startContent icon on the first line of ${typography} text`, () => {
			const { container, locator } = render(
				<div style={{ inlineSize: '16rem' }}>
					<Text
						elementType="p"
						startContent={<Icon name="checkCircle" size={size} />}
						typography={typography}
					>
						<span data-testid="cap" style={capProbeStyle} />
						{wrappingCopy}
					</Text>
				</div>,
			);
			const cap = locator.getByTestId('cap').element();

			expect(verticalCentre(querySvg(container))).toBeCloseTo(verticalCentre(cap), 0);
		});
	}
}

for (const typography of ['caption', 'heading2'] as const) {
	test(`centres an IconButton endContent on the first line of ${typography} text`, () => {
		const { locator } = render(
			<div style={{ inlineSize: '16rem' }}>
				<Text
					elementType="p"
					endContent={<IconButton aria-label="Dismiss" icon="close" size="small" />}
					typography={typography}
				>
					<span data-testid="cap" style={capProbeStyle} />
					{wrappingCopy}
				</Text>
			</div>,
		);
		const button = locator.getByRole('button', { name: 'Dismiss' }).element();
		const cap = locator.getByTestId('cap').element();

		expect(verticalCentre(button)).toBeCloseTo(verticalCentre(cap), 0);
	});
}

test('wrapped lines of adorned text align with the first line, not the adornment', () => {
	const { container, locator } = render(
		<div style={{ inlineSize: '12rem' }}>
			<Text elementType="p" startContent={<Icon name="checkCircle" />}>
				<span data-testid="copy">{wrappingCopy}</span>
			</Text>
		</div>,
	);
	const lines = lineRects(locator.getByTestId('copy').element());
	const [first] = lines;
	if (first == null) throw new Error('Expected the copy to render.');

	expect(lines.length).toBeGreaterThan(1);
	expect(first.left).toBeGreaterThan(querySvg(container).getBoundingClientRect().right);
	for (const line of lines) expect(line.left).toBeCloseTo(first.left, 0);
});

test('a trimmed Heading keeps its trim when it has startContent', () => {
	const { locator } = render(
		<Heading data-testid="heading" level={2} startContent={<Icon name="checkCircle" />}>
			<span data-testid="cap" style={capProbeStyle} />
			Section heading
		</Heading>,
	);
	const heading = locator.getByTestId('heading').element();
	const cap = locator.getByTestId('cap').element();

	expect(cap.getBoundingClientRect().top).toBeCloseTo(heading.getBoundingClientRect().top, 0);
	expect(cap.getBoundingClientRect().bottom).toBeCloseTo(heading.getBoundingClientRect().bottom, 0);
});

test('an adornment taller than the line grows the row and stays centred on the first line', () => {
	const { locator } = render(
		<Text
			data-testid="text"
			elementType="div"
			shouldDisableTrim
			startContent={
				<Box
					backgroundColor="neutral.subtle.rest"
					blockSize="3rem"
					borderRadius="full"
					data-testid="avatar"
					display="inline-flex"
					elementType="span"
					inlineSize="3rem"
				/>
			}
			typography="caption"
		>
			<span data-testid="cap" style={capProbeStyle} />
			Caption beside a large avatar
		</Text>,
	);
	const text = locator.getByTestId('text').element().getBoundingClientRect();
	const avatar = locator.getByTestId('avatar').element();
	const cap = locator.getByTestId('cap').element();

	expect(avatar.getBoundingClientRect().top).toBeGreaterThanOrEqual(text.top - 0.5);
	expect(avatar.getBoundingClientRect().bottom).toBeLessThanOrEqual(text.bottom + 0.5);
	expect(verticalCentre(avatar)).toBeCloseTo(verticalCentre(cap), 0);
});

const directions = [
	{ direction: 'ltr', endEdge: 'right', startEdge: 'left' },
	{ direction: 'rtl', endEdge: 'left', startEdge: 'right' },
] as const;

for (const { direction, endEdge, startEdge } of directions) {
	test(`places startContent and endContent at the inline edges in ${direction}`, () => {
		const { locator } = render(
			<div dir={direction} style={{ inlineSize: '16rem' }}>
				<Text
					data-testid="text"
					elementType="p"
					endContent={<Kbd data-testid="end">Esc</Kbd>}
					startContent={<Icon name="checkCircle" />}
				>
					Short
				</Text>
			</div>,
		);
		const text = locator.getByTestId('text').element().getBoundingClientRect();
		const end = locator.getByTestId('end').element().getBoundingClientRect();
		const start = locator.getByTestId('text').element().querySelector('svg');
		if (start == null) throw new Error('Expected an icon.');
		const startRect = start.getBoundingClientRect();

		expect(startRect[startEdge]).toBeCloseTo(text[startEdge], 0);
		expect(end[endEdge]).toBeCloseTo(text[endEdge], 0);
	});
}

test('long unbroken adorned text wraps inside the row', () => {
	const { locator } = render(
		<div style={{ inlineSize: '12rem' }}>
			<Text
				data-testid="text"
				elementType="p"
				endContent={<Icon data-testid="end" name="checkCircle" />}
				startContent={<Icon name="checkCircle" />}
			>
				https://example.com/a/very/long/unbroken/path/that/would/otherwise/overflow
			</Text>
		</div>,
	);
	const text = locator.getByTestId('text').element();

	expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
});

test('lineClamp clamps adorned text and keeps the adornments', () => {
	const { container, locator } = render(
		<div style={{ inlineSize: '12rem' }}>
			<Text
				data-testid="text"
				elementType="p"
				lineClamp={1}
				startContent={<Icon name="checkCircle" />}
			>
				<span data-testid="copy">{wrappingCopy}</span>
			</Text>
		</div>,
	);
	const copy = locator.getByTestId('copy').element();
	const clamped = copy.parentElement;
	if (clamped == null) throw new Error('Expected the clamped content.');
	const tops = new Set(lineRects(copy).map((line) => Math.round(line.top)));

	expect(tops.size).toBe(1);
	expect(getComputedStyle(clamped).textOverflow).toBe('ellipsis');
	expect(clamped.scrollWidth).toBeGreaterThan(clamped.clientWidth);
	expect(querySvg(container).getBoundingClientRect().width).toBeGreaterThan(0);
});

test('an inline adorned Text sits on the baseline of the surrounding sentence', () => {
	const { locator } = render(
		<p style={{ margin: 0 }}>
			<span data-testid="sentence" style={baselineMarkerStyle} />
			Status:{' '}
			<Text data-testid="inline" startContent={<Icon name="checkCircle" size="xsmall" />}>
				<span data-testid="adorned" style={baselineMarkerStyle} />
				Approved
			</Text>{' '}
			by the reviewer.
		</p>,
	);
	const sentence = locator.getByTestId('sentence').element().getBoundingClientRect();
	const adorned = locator.getByTestId('adorned').element().getBoundingClientRect();

	expect(getComputedStyle(locator.getByTestId('inline').element()).display).toBe('inline-flex');
	expect(adorned.bottom).toBeCloseTo(sentence.bottom, 0);
});

test('adorned Text keeps its root element, attributes, ref, and slot', async () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text slot="label">Save changes</Text>
				<Text
					className="custom"
					data-testid="description"
					elementType="p"
					ref={ref}
					slot="description"
					startContent={<Icon name="checkCircle" />}
					style={{ color: 'rgb(1, 2, 3)' }}
				>
					Updates the current document
				</Text>
			</MenuItem>
		</Menu>,
	);
	const description = locator.getByTestId('description').element();

	expect(description.tagName).toBe('P');
	expect(ref.current).toBe(description);
	expect(description.classList.contains('custom')).toBe(true);
	expect(getComputedStyle(description).color).toBe('rgb(1, 2, 3)');
	await expect
		.element(locator.getByRole('menuitem'))
		.toHaveAccessibleDescription('Updates the current document');
});

test('a visually hidden adorned Text stays hidden and named', async () => {
	const { locator } = render(
		<button type="button">
			<Text isVisuallyHidden startContent={<Icon name="checkCircle" />}>
				Save changes
			</Text>
		</button>,
	);
	const button = locator.getByRole('button', { name: 'Save changes' });

	await expect.element(button).toBeInTheDocument();
	expect(locator.getByText('Save changes').element().getBoundingClientRect().width).toBeLessThan(2);
});

test('adornments join the accessible name only when they carry text', async () => {
	const { container, locator, user } = render(
		<Box display="flex" flexDirection="column" gap="sp8">
			<Heading level={2} startContent={<Icon name="checkCircle" />}>
				Billing
			</Heading>
			<Heading endContent={<Kbd>Beta</Kbd>} level={2}>
				Reports
			</Heading>
			<Link href="#docs">
				<Text elementType="span" shouldInheritFont startContent={<Icon name="checkCircle" />}>
					Documentation
				</Text>
			</Link>
			<Text
				elementType="p"
				endContent={<IconButton aria-label="Dismiss" icon="close" size="small" />}
				startContent={<Icon name="checkCircle" />}
			>
				{wrappingCopy}
			</Text>
		</Box>,
	);

	await expect.element(locator.getByRole('heading', { name: 'Billing' })).toBeInTheDocument();
	await expect.element(locator.getByRole('heading', { name: 'Reports Beta' })).toBeInTheDocument();
	const link = locator.getByRole('link', { name: 'Documentation' });
	await user.keyboard('{Tab}');
	await expect.element(link).toHaveFocus();
	await user.keyboard('{Tab}');
	await expect.element(locator.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
	await expectNoAxeViolations(container);
});

test('adornments', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack width="18rem">
				<Heading level={2} startContent={<Icon name="checkCircle" />} typography="heading3">
					Section heading that wraps
				</Heading>
				<Text
					elementType="p"
					endContent={<Kbd>Esc</Kbd>}
					startContent={<Icon name="exclamationTriangle" size="small" />}
				>
					Example message that wraps onto a second line
				</Text>
				<Text
					elementType="p"
					endContent={<IconButton aria-label="Dismiss" icon="close" size="small" />}
					typography="label"
				>
					https://example.com/a/very/long/unbroken/path
				</Text>
				<Text
					elementType="div"
					startContent={
						<Box
							backgroundColor="neutral.subtle.rest"
							blockSize="2.5rem"
							borderRadius="full"
							display="inline-flex"
							elementType="span"
							inlineSize="2.5rem"
						/>
					}
					typography="caption"
				>
					Caption beside an avatar taller than the line
				</Text>
				<Text elementType="p" lineClamp={1} startContent={<Icon name="bookOpen" size="small" />}>
					Clamped text that is long enough to be truncated
				</Text>
				<div dir="rtl">
					<Text elementType="p" startContent={<Icon name="checkCircle" size="small" />}>
						نص طويل يلتف على سطرين
					</Text>
				</div>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'text/adornments', appearance);
	}
});
