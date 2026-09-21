import { Prose, proseRecipe } from '@luke-ui/react/prose';
import type { CSSProperties } from 'react';
import { createRef } from 'react';
import { test, expect } from 'vite-plus/test';
import { Blockquote } from '../blockquote/blockquote.js';
import { Code } from '../code/code.js';
import { Heading } from '../heading/heading.js';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from '../text/text.js';

test('Prose forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLDivElement>();
	const { container } = render(
		<Prose className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</Prose>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Prose element.');

	expectForwardsDomProps(target, ref);
});

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

// Typed ols outside Prose stay on the ordinary markerless reset.
test('keeps typed ordered lists markerless outside Prose', () => {
	const { container } = render(
		<div>
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
			<ol>
				<li>one</li>
			</ol>
		</div>,
	);

	expect(listStyleTypes(container)).toEqual(['none', 'none', 'none', 'none', 'none']);
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
		<Text elementType="pre">
			<Code>{'padding-inline: var(--luke-space-sp16);'}</Code>
		</Text>
		<img alt="" height={64} src={swatch} width={320} />
		<picture>
			<img alt="" height={64} src={swatch} width={320} />
		</picture>
		<video aria-label="Spacing scale animation" height={64} muted poster={swatch} width={320} />

		<table>
			<thead>
				<tr>
					<th scope="col">Step</th>
					<th scope="col">Value</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<Code>sp8</Code>
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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<Stack width="40rem">{document}</Stack>, { appearance });

		await captureVisualAppearance(locator, 'prose/kitchen-sink', appearance);
	}
});
