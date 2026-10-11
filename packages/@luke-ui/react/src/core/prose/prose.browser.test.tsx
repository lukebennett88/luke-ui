import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Heading } from '@luke-ui/react/heading';
import { Prose, proseRecipe } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

function query(root: Element, selector: string) {
	const element = root.querySelector(selector);
	if (element == null) throw new Error(`Expected a ${selector} in the document.`);

	return element;
}

function gapBetween(previous: Element, next: Element) {
	return next.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
}

function renderSection(style?: CSSProperties) {
	const { locator } = render(
		<Prose style={style}>
			<p>Paragraph.</p>
			<h2>Section</h2>
		</Prose>,
	);
	const root = locator.element();

	return gapBetween(query(root, 'p'), query(root, 'h2'));
}

function listStyleTypes(root: ParentNode) {
	return [...root.querySelectorAll('ol')].map((ol) => getComputedStyle(ol).listStyleType);
}

// A two-sided model collapses in block flow but sums in a grid.
test('keeps the rhythm when the root is a grid', () => {
	expect(renderSection({ display: 'grid' })).toBeCloseTo(renderSection(), 0);
});

// Grid exposes a descendant's trailing margin instead of collapsing it through the list edge.
test('does not leak space from a nested final block', () => {
	const { locator } = render(
		<Prose style={{ display: 'grid' }}>
			<ul>
				<li>
					<p>Last item.</p>
				</li>
			</ul>
		</Prose>,
	);
	const root = locator.element();
	const last = query(root, 'p');

	expect(root.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom).toBeCloseTo(
		0,
		0,
	);
});

// The user agent gives `pre` a block margin, so Prose must normalise a nested one itself.
test('normalises a nested pre margin', () => {
	const { locator } = render(
		<Prose>
			<blockquote style={{ display: 'grid' }}>
				<pre>code</pre>
			</blockquote>
		</Prose>,
	);
	const root = locator.element();

	expect(
		query(root, 'pre').getBoundingClientRect().top -
			query(root, 'blockquote').getBoundingClientRect().top,
	).toBeCloseTo(0, 0);
});

function TypedLists() {
	return (
		<>
			{['1', 'a', 'A', 'i', 'I'].map((type) => (
				<ol key={type} type={type as '1'}>
					<li>{type}</li>
				</ol>
			))}
		</>
	);
}

const nativeTypedMarkers = ['decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman'];

/** A `list-style: none` reset below Luke UI, as Tailwind Preflight writes it. */
function addListReset() {
	// This file's `document` is a fixture, so reach the page document explicitly.
	const style = globalThis.document.head.appendChild(globalThis.document.createElement('style'));
	style.textContent = '@layer base { ol, ul { list-style: none; } }';
	return style;
}

test('keeps native typed ordered-list markers under proseRecipe', () => {
	const { locator } = render(
		<div className={proseRecipe()}>
			<TypedLists />
		</div>,
	);

	expect(listStyleTypes(locator.element())).toEqual(nativeTypedMarkers);
});

// HTML matches `type` case-insensitively, so only a browser with the `s` selector flag can restore
// `A` and `I` over a reset. Elsewhere Prose restores `type="1"` and the reset wins for the rest.
test('restores typed ordered-list markers over a list reset where the s flag is supported', () => {
	const style = addListReset();
	try {
		const { locator } = render(
			<div className={proseRecipe()}>
				<TypedLists />
				<div className="not-prose">
					<ol type="1">
						<li>Outside Prose</li>
					</ol>
				</div>
			</div>,
		);
		const hasCaseSensitiveSelectors = CSS.supports('selector([type="A" s])');

		expect(listStyleTypes(locator.element())).toEqual([
			...(hasCaseSensitiveSelectors
				? nativeTypedMarkers
				: ['decimal', 'none', 'none', 'none', 'none']),
			'none',
		]);
	} finally {
		style.remove();
	}
});

function margin(element: Element) {
	return getComputedStyle(element).marginBlockStart;
}

function boundaryFixture() {
	return (
		<Prose>
			<p>Before.</p>
			<p data-testid="outside">Outside.</p>
			<div className="not-prose" data-testid="boundary">
				<p>Inside.</p>
				<p data-testid="inside">Second.</p>
				<ul>
					<li>One</li>
					<li data-testid="item">Two</li>
				</ul>
				<table>
					<tbody>
						<tr>
							<td>Cell</td>
						</tr>
					</tbody>
				</table>
				<Prose data-testid="nested">
					<p>First.</p>
					<p data-testid="nested-second">Second.</p>
					<ul data-testid="nested-list">
						<li>One</li>
					</ul>
				</Prose>
			</div>
		</Prose>
	);
}

test('applies Prose rhythm to elements outside a not-prose boundary', () => {
	const { locator } = render(boundaryFixture());
	const root = locator.element();

	expect(margin(query(root, '[data-testid="outside"]'))).toBe('32px');
});

test('leaves browser defaults inside a not-prose boundary', () => {
	const { locator } = render(
		<div>
			{boundaryFixture()}
			<div data-testid="reference">
				<p>Inside.</p>
				<p data-testid="inside">Second.</p>
				<ul>
					<li>One</li>
					<li data-testid="item">Two</li>
				</ul>
				<table>
					<tbody>
						<tr>
							<td>Cell</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>,
	);
	const boundary = query(locator.element(), '[data-testid="boundary"]');
	const reference = query(locator.element(), '[data-testid="reference"]');

	expect(margin(boundary)).toBe('0px');
	for (const selector of ['[data-testid="inside"]', '[data-testid="item"]', 'ul']) {
		expect(margin(query(boundary, selector))).toBe(margin(query(reference, selector)));
	}
	const list = getComputedStyle(query(boundary, 'ul'));
	const referenceList = getComputedStyle(query(reference, 'ul'));
	expect(list.listStyleType).toBe(referenceList.listStyleType);
	expect(list.paddingInlineStart).toBe(referenceList.paddingInlineStart);
	expect(getComputedStyle(query(boundary, 'td')).paddingInlineStart).toBe(
		getComputedStyle(query(reference, 'td')).paddingInlineStart,
	);
});

test('excludes an element that carries not-prose itself', () => {
	const { locator } = render(
		<div>
			<Prose>
				<p>Before.</p>
				<p className="not-prose" data-testid="marked">
					Marked.
				</p>
			</Prose>
			<p data-testid="reference">Reference.</p>
		</div>,
	);

	expect(margin(query(locator.element(), '[data-testid="marked"]'))).toBe(
		margin(query(locator.element(), '[data-testid="reference"]')),
	);
});

test('keeps the gap after a heading for a not-prose element but not for its descendants', () => {
	const { locator } = render(
		<Prose>
			<h2>Section</h2>
			<div className="not-prose" data-testid="widget">
				<h2>Inner</h2>
				<div className="not-prose" data-testid="inner-widget" />
			</div>
		</Prose>,
	);
	const root = locator.element();

	expect(margin(query(root, '[data-testid="widget"]'))).toBe('32px');
	expect(margin(query(root, '[data-testid="inner-widget"]'))).toBe('0px');
});

test('restores Prose rhythm for a Prose nested inside a not-prose boundary', () => {
	const { locator } = render(boundaryFixture());
	const nested = query(locator.element(), '[data-testid="nested"]');

	expect(margin(query(nested, '[data-testid="nested-second"]'))).toBe('32px');
	expect(getComputedStyle(query(nested, 'ul')).listStyleType).toBe('disc');
	expect(getComputedStyle(query(nested, 'ul')).paddingInlineStart).toBe('24px');
});

test('lets utility classes override Prose margins', () => {
	const { locator } = render(
		<Prose>
			<h2>Before.</h2>
			<Box data-testid="utility" marginBlockStart="sp8">
				Utility.
			</Box>
		</Prose>,
	);

	expect(margin(query(locator.element(), '[data-testid="utility"]'))).toBe('8px');
});

test('fits media inside a narrow prose column', async () => {
	const { locator } = render(
		<Prose style={{ inlineSize: 160 }}>
			<img alt="" height={64} src={swatch} width={320} />
			<picture>
				<img alt="" height={64} src={swatch} width={320} />
			</picture>
			<video aria-label="Animation" height={64} muted poster={swatch} width={320} />
		</Prose>,
	);
	const root = query(locator.element(), 'div');
	const rootBounds = root.getBoundingClientRect();
	await Promise.all([...root.querySelectorAll('img')].map((img) => img.decode()));

	for (const media of root.querySelectorAll('img, picture, video')) {
		const bounds = media.getBoundingClientRect();
		expect(bounds.right).toBeLessThanOrEqual(rootBounds.right + 1);
	}

	for (const media of root.querySelectorAll('img, video')) {
		const bounds = media.getBoundingClientRect();
		expect(bounds.width / bounds.height).toBeCloseTo(5, 0);
	}
});

test('scrolls long preformatted lines without widening a narrow grid column', async () => {
	const code = 'padding-inline: var(--luke-space-sp16);'.repeat(5);
	const { locator, user } = render(
		<Prose style={{ display: 'grid', inlineSize: 160 }}>
			<button type="button">Before code</button>
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable pre */}
			<pre tabIndex={0}>
				<code>{code}</code>
			</pre>
		</Prose>,
	);
	const root = query(locator.element(), 'div');
	const pre = query(root, 'pre');

	expect(pre.getBoundingClientRect().right).toBeLessThanOrEqual(
		root.getBoundingClientRect().right + 1,
	);
	expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);

	locator.getByRole('button', { name: 'Before code' }).element().focus();
	await user.tab();
	expect(pre).toHaveFocus();
	await user.keyboard('{ArrowRight}');
	await expect.poll(() => pre.scrollLeft).toBeGreaterThan(0);
});

test('preserves whitespace in multiline pre code', () => {
	const { locator } = render(
		<Prose>
			<pre>
				<code>{'first line\nsecond line'}</code>
			</pre>
		</Prose>,
	);
	expect(getComputedStyle(query(locator.element(), 'pre')).whiteSpace).toBe('pre');
});

test('styles table headers and body cells', () => {
	const { locator } = render(
		<Prose style={{ inlineSize: 160 }}>
			<table>
				<thead>
					<tr>
						<th scope="col">Step</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Small</th>
						<td>8px</td>
					</tr>
				</tbody>
			</table>
		</Prose>,
	);
	const root = locator.element();
	const columnHeader = query(root, 'thead th');
	const rowHeader = query(root, 'tbody th');
	const cell = query(root, 'tbody td');

	expect(query(root, 'table').getBoundingClientRect().width).toBeCloseTo(160, 0);
	expect(getComputedStyle(columnHeader).verticalAlign).toBe('bottom');
	expect(getComputedStyle(columnHeader).textAlign).toBe('start');
	expect(getComputedStyle(rowHeader).verticalAlign).not.toBe('bottom');
	expect(getComputedStyle(cell).verticalAlign).toBe('baseline');
	expect(getComputedStyle(cell).paddingInlineStart).toBe('12px');
});

test('keeps pre chrome outside a not-prose boundary', () => {
	const { locator } = render(
		<Prose>
			<pre data-testid="styled">code</pre>
			<div className="not-prose">
				<pre data-testid="plain">code</pre>
			</div>
		</Prose>,
	);
	const root = locator.element();
	const styled = getComputedStyle(query(root, '[data-testid="styled"]'));
	const plain = getComputedStyle(query(root, '[data-testid="plain"]'));

	expect(styled.overflowX).toBe('auto');
	expect(styled.paddingInlineStart).toBe('16px');
	expect(plain.overflowX).not.toBe('auto');
	expect(plain.paddingInlineStart).toBe('0px');
});

const headingLevels = [1, 2, 3, 4, 5, 6] as const;

function typeMetrics(element: Element) {
	const style = getComputedStyle(element);
	return {
		blockSize: element.getBoundingClientRect().height,
		fontFamily: style.fontFamily,
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		letterSpacing: style.letterSpacing,
		lineHeight: style.lineHeight,
	};
}

// Plain markup from a CMS must look like the component. The block size proves the trims match.
for (const level of headingLevels) {
	test(`gives a plain h${level} the type style of Heading level ${level}`, () => {
		const Plain = `h${level}` as const;
		const { locator } = render(
			<Prose>
				<Plain>Plain heading</Plain>
				<Heading level={level}>Plain heading</Heading>
			</Prose>,
		);
		const root = locator.element();

		expect(typeMetrics(query(root, `${Plain}:not([class])`))).toEqual(
			typeMetrics(query(root, `${Plain}[class]`)),
		);
	});
}

test('gives a plain p the type style of Text', () => {
	const { locator } = render(
		<Prose>
			<p>Plain paragraph</p>
			<Text elementType="p">Plain paragraph</Text>
		</Prose>,
	);
	const root = locator.element();

	expect(typeMetrics(query(root, 'p:not([class])'))).toEqual(typeMetrics(query(root, 'p[class]')));
});

// A component keeps its own props inside Prose. The block size proves the trims match too.
const overrides = [
	{
		name: 'Heading with shouldDisableTrim',
		node: (
			<Heading level={2} shouldDisableTrim>
				Override
			</Heading>
		),
	},
	{
		name: 'Heading with typography display',
		node: (
			<Heading level={2} typography="display">
				Override
			</Heading>
		),
	},
	{
		name: 'Text with typography lead',
		node: (
			<Text elementType="p" typography="lead">
				Override
			</Text>
		),
	},
	{
		name: 'Text with lineClamp',
		node: (
			<Text elementType="p" lineClamp={2}>
				Override
			</Text>
		),
	},
];

for (const { name, node } of overrides) {
	test(`keeps the props of a ${name} inside Prose`, () => {
		const { locator } = render(
			<div>
				<Prose>{node}</Prose>
				{node}
			</div>,
		);
		const [inside, outside] = locator.element().querySelectorAll('h2, p');

		expect(typeMetrics(inside!)).toEqual(typeMetrics(outside!));
		expect(getComputedStyle(inside!, '::before').content).toBe(
			getComputedStyle(outside!, '::before').content,
		);
	});
}

test('leaves a plain heading inside a not-prose boundary unstyled', () => {
	const { locator } = render(
		<div>
			<Prose>
				<div className="not-prose">
					<h2>Heading</h2>
				</div>
			</Prose>
			<h2>Heading</h2>
		</div>,
	);
	const [inside, outside] = locator.element().querySelectorAll('h2');

	expect(typeMetrics(inside!)).toEqual(typeMetrics(outside!));
});

// A list marker and a cell baseline align to the first box, which the trim box would take.
test('gives a loose list item the block size of a tight one', () => {
	const { locator } = render(
		<Prose>
			<ul>
				<li>
					<p>Item</p>
				</li>
				<li>Item</li>
			</ul>
		</Prose>,
	);
	const [loose, tight] = locator.element().querySelectorAll('li');

	expect(loose!.getBoundingClientRect().height).toBe(tight!.getBoundingClientRect().height);
});

test('aligns the text of a paragraph cell with a plain cell', () => {
	const { locator } = render(
		<Prose>
			<table>
				<tbody>
					<tr>
						<td>
							<p>Cell</p>
						</td>
						<td>Cell</td>
					</tr>
				</tbody>
			</table>
		</Prose>,
	);
	const [paragraphCell, plainCell] = locator.element().querySelectorAll('td');
	const textTop = (cell: Element) => {
		const range = new Range();
		range.selectNodeContents(cell.querySelector('p') ?? cell);
		return range.getBoundingClientRect().top;
	};

	expect(textTop(paragraphCell!)).toBe(textTop(plainCell!));
});

// A Prose below a not-prose element and a Prose inside a Prose both start a scope.
const proseBoundaries = [
	{
		name: 'a Prose inside a not-prose element',
		node: (
			<Prose>
				<div className="not-prose">
					<Prose>
						<h2>Heading</h2>
						<p>Paragraph</p>
					</Prose>
				</div>
			</Prose>
		),
	},
	{
		name: 'a Prose inside a Prose',
		node: (
			<Prose>
				<Prose>
					<h2>Heading</h2>
					<p>Paragraph</p>
				</Prose>
			</Prose>
		),
	},
];

for (const { name, node } of proseBoundaries) {
	test(`styles plain elements in ${name} like Heading and Text`, () => {
		const { locator } = render(
			<div>
				{node}
				<Heading level={2}>Heading</Heading>
				<Text elementType="p">Paragraph</Text>
			</div>,
		);
		const root = locator.element();

		expect(typeMetrics(query(root, 'h2:not([class])'))).toEqual(
			typeMetrics(query(root, 'h2[class]')),
		);
		expect(typeMetrics(query(root, 'p:not([class])'))).toEqual(
			typeMetrics(query(root, 'p[class]')),
		);
	});
}

const document = (
	<Prose>
		<Heading level={2}>Choosing a spacing scale</Heading>
		<Text elementType="p">
			A spacing scale trades range for consistency. Nine steps cover a component library without
			offering two values a designer cannot tell apart.
		</Text>
		<Text elementType="p">
			Every step below is a token. Reach for the nearest one rather than a raw pixel value.
		</Text>

		<Heading level={3}>Picking a step</Heading>
		<Text elementType="p">Work outwards from the tightest gap the layout needs.</Text>
		<ol>
			<li>Measure the smallest gap in the design.</li>
			<li>
				Round it to the nearest step.
				<ul>
					<li>Round down inside a control.</li>
					<li>Round up between sections.</li>
				</ul>
			</li>
			<li>Use that step everywhere the same relationship appears.</li>
		</ol>

		<Heading level={4}>Rounding in practice</Heading>
		<ul>
			<li>
				<Text elementType="p">A loose item holds more than one paragraph.</Text>
				<Text elementType="p">The second takes a tighter gap than a document paragraph.</Text>
			</li>
			<li>
				<Text elementType="p">Each item keeps the list rhythm.</Text>
			</li>
		</ul>
		<ol type="1">
			<li>Decimal markers.</li>
		</ol>
		<ol type="a">
			<li>Lower-alpha markers.</li>
		</ol>
		<ol type="A">
			<li>Upper-alpha markers.</li>
		</ol>
		<ol type="i">
			<li>Lower-roman markers.</li>
		</ol>
		<ol type="I">
			<li>Upper-roman markers.</li>
		</ol>

		<Blockquote>
			Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
			near it in obstinacy.
		</Blockquote>

		<Heading level={4}>Reading a token</Heading>
		{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable pre */}
		<pre tabIndex={0}>
			<code>{'padding-inline: var(--luke-space-sp16);\nmargin-block: 0;'}</code>
		</pre>
		<img alt="" height={64} src={swatch} width={320} />
		<picture>
			<img alt="" height={64} src={swatch} width={320} />
		</picture>
		<video aria-label="Spacing scale animation" height={64} muted poster={swatch} width={320} />

		<table>
			<thead>
				<tr>
					<th scope="col">
						Step
						<br />
						name
					</th>
					<th scope="col">Value</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<Code>sp8</Code>
						<br />
						Small gap
					</td>
					<td>8px</td>
				</tr>
				<tr>
					<td>
						<Code>sp24</Code>
					</td>
					<td>24px</td>
				</tr>
			</tbody>
			<tfoot>
				<tr>
					<td>Total steps</td>
					<td>2</td>
				</tr>
			</tfoot>
		</table>

		<hr />

		<Heading level={3}>Terms</Heading>
		<dl>
			<dt>
				<Text elementType="span" fontWeight="emphasis">
					Step
				</Text>
			</dt>
			<dd>
				<Text elementType="span">One named value on the scale.</Text>
			</dd>
			<dt>
				<Text elementType="span" fontWeight="emphasis">
					Gap
				</Text>
			</dt>
			<dd>
				<Text elementType="span">The measured distance between two boxes.</Text>
			</dd>
		</dl>

		<figure>
			<img alt="" height={64} src={swatch} width={320} />
			<figcaption>
				<Text color="secondary" elementType="span" typography="caption">
					Grouping changes with distance alone.
				</Text>
			</figcaption>
		</figure>
	</Prose>
);

test('the prose document has no axe violations', async () => {
	const { container } = render(<Stack width="18rem">{document}</Stack>);

	await expectNoAxeViolations(container);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<Stack width="18rem">{document}</Stack>, { appearance });

		await captureVisualAppearance(locator, 'prose/kitchen-sink', appearance);
	}
});
