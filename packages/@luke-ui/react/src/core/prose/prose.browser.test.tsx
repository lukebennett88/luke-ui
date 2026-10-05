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

// A nested pre is not covered by the shared reset, so Prose must normalise it itself.
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

// Chromium and Safari match `type` case-insensitively, so CSS must not restate A/a or I/i.
// `proseRecipe` is public, so the scope must ride the recipe class, not the component.
test('preserves native ordered-list type markers under proseRecipe alone', () => {
	const { locator } = render(
		<div className={proseRecipe()}>
			<ol type="1">
				<li>1</li>
			</ol>
			<ol type="a">
				<li>a</li>
			</ol>
			<ol type="A">
				<li>A</li>
			</ol>
			<ol type="i">
				<li>i</li>
			</ol>
			<ol type="I">
				<li>I</li>
			</ol>
		</div>,
	);

	expect(listStyleTypes(locator.element())).toEqual([
		'decimal',
		'lower-alpha',
		'upper-alpha',
		'lower-roman',
		'upper-roman',
	]);
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

test('removes Prose margins, list styles, and cell padding inside a not-prose boundary', () => {
	const { locator } = render(boundaryFixture());
	const boundary = query(locator.element(), '[data-testid="boundary"]');

	expect(margin(boundary)).toBe('0px');
	expect(margin(query(boundary, '[data-testid="inside"]'))).toBe('0px');
	expect(margin(query(boundary, '[data-testid="item"]'))).toBe('0px');
	expect(margin(query(boundary, 'ul'))).toBe('0px');
	expect(getComputedStyle(query(boundary, 'ul')).listStyleType).toBe('none');
	expect(getComputedStyle(query(boundary, 'ul')).paddingInlineStart).toBe('0px');
	expect(getComputedStyle(query(boundary, 'td')).paddingInlineStart).toBe('0px');
});

test('excludes an element that carries not-prose itself', () => {
	const { locator } = render(
		<Prose>
			<p>Before.</p>
			<p className="not-prose" data-testid="marked">
				Marked.
			</p>
		</Prose>,
	);

	expect(margin(query(locator.element(), '[data-testid="marked"]'))).toBe('0px');
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
			{/* Scrollable code needs keyboard focus. */}
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
			<pre tabIndex={0}>
				<code>{code}</code>
			</pre>
			<Text elementType="pre" tabIndex={0}>
				<Code>{code}</Code>
			</Text>
		</Prose>,
	);
	const root = query(locator.element(), 'div');

	for (const pre of root.querySelectorAll('pre')) {
		expect(pre.getBoundingClientRect().right).toBeLessThanOrEqual(
			root.getBoundingClientRect().right + 1,
		);
		expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
		pre.scrollLeft = 100;
		expect(pre.scrollLeft).toBe(100);
	}

	const firstPre = query(root, 'pre:first-of-type');
	firstPre.scrollLeft = 0;
	locator.getByRole('button', { name: 'Before code' }).element().focus();
	await user.tab();
	expect(firstPre).toHaveFocus();
	await user.keyboard('{ArrowRight}');
	await expect.poll(() => firstPre.scrollLeft).toBeGreaterThan(0);
});

test('preserves line breaks in multiline Code inside pre', () => {
	const code = 'first line\nsecond line';
	const { locator } = render(
		<Prose>
			<Text elementType="pre">first line</Text>
			<Text elementType="pre">{code}</Text>
			<Text elementType="pre">
				<Code>first line</Code>
			</Text>
			<Text elementType="pre">
				<Code>{code}</Code>
			</Text>
		</Prose>,
	);
	const root = locator.element();
	const plainSingle = query(root, 'pre:nth-of-type(1)').getBoundingClientRect().height;
	const plainMultiline = query(root, 'pre:nth-of-type(2)').getBoundingClientRect().height;
	const composedSingle = query(root, 'pre:nth-of-type(3)').getBoundingClientRect().height;
	const composedMultiline = query(root, 'pre:nth-of-type(4)').getBoundingClientRect().height;

	expect(plainMultiline).toBeGreaterThan(plainSingle);
	expect(composedMultiline).toBeGreaterThan(composedSingle);
	expect(composedMultiline).toBeCloseTo(plainMultiline, 0);
});

const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

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
		{/* Scrollable code needs keyboard focus. */}
		{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
		<pre tabIndex={0}>
			<code>{'padding-inline: var(--luke-space-sp16);\nmargin-block: 0;'}</code>
		</pre>
		<Text elementType="pre" tabIndex={0}>
			<Code>{'padding-inline: var(--luke-space-sp16);\nmargin-block: 0;'}</Code>
		</Text>
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
