import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Prose } from './prose.js';

testConformance({
	path: 'prose',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected Prose element.');
		return target;
	},
	render: (props = {}) => render(<Prose {...props}>Content</Prose>),
});

function query(root: Element, selector: string) {
	const element = root.querySelector(selector);
	if (element == null) throw new Error(`Expected a ${selector} in the document.`);
	return element;
}

/**
 * The rendered distance between two boxes. Vertical rhythm is the whole contract, and it is a
 * distance a reader sees rather than a declaration: a margin that collapses, or one the reset
 * left on a descendant, both change this number without changing any single declaration. So
 * these tests measure geometry, which is the case `TESTING.md` allows computed layout for.
 */
function gapBetween(previous: Element, next: Element) {
	return next.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
}

/** The step's resolved pixel value, read from the theme rather than restated as a literal. */
function space(root: Element, step: string) {
	const value = getComputedStyle(root).getPropertyValue(`--luke-space-${step}`);
	const pixels = Number.parseFloat(value);
	if (!Number.isFinite(pixels)) throw new Error(`Expected --luke-space-${step} to resolve.`);
	return pixels;
}

// Layout rounds to subpixels, so measured distances are asserted with `toBeCloseTo` at this
// precision (a tolerance of half a pixel) rather than exact equality, which would be brittle in a
// way the contract is not. Half a pixel still falsifies a wrong token, a doubled gap, or a
// margin that escaped, since every value in the scale is at least 4px apart from its neighbours.
const subpixel = 0;

const article = (
	<>
		<p>Opening paragraph.</p>
		<p>Second paragraph.</p>
		<h2>A section</h2>
		<p>Body paragraph.</p>
	</>
);

function renderArticle(style?: CSSProperties) {
	const { locator } = render(<Prose style={style}>{article}</Prose>);
	const root = locator.element();
	const [first, second, body] = root.querySelectorAll('p');
	const heading = query(root, 'h2');
	if (first == null || second == null || body == null) throw new Error('Expected 3 paragraphs.');
	return {
		root,
		bodyGap: gapBetween(first, second),
		sectionGap: gapBetween(second, heading),
		afterHeadingGap: gapBetween(heading, body),
	};
}

// Every gap belongs to the following sibling, so each measured distance is exactly one authored
// lead-in margin: the body step between two paragraphs, the larger section step before a
// heading, and the smaller step after one, because a heading groups with what it introduces.
test('spaces the blocks of a document by the following block lead-in', () => {
	const { root, bodyGap, sectionGap, afterHeadingGap } = renderArticle();

	expect(bodyGap).toBeCloseTo(space(root, 'sp24'), subpixel);
	expect(sectionGap).toBeCloseTo(space(root, 'sp48'), subpixel);
	expect(afterHeadingGap).toBeCloseTo(space(root, 'sp16'), subpixel);
	expect(afterHeadingGap).toBeLessThan(sectionGap);
});

// The rhythm must not depend on margin collapse. Two authored margins between one pair would
// collapse to the larger in normal flow and sum in a grid or flex container, so rendering the
// same document in all three formatting contexts is what falsifies a collapse dependency.
for (const display of ['grid', 'flex'] as const) {
	test(`keeps the same rhythm when the root is display: ${display}`, () => {
		const flow = renderArticle();
		const contained = renderArticle(
			display === 'flex' ? { display: 'flex', flexDirection: 'column' } : { display: 'grid' },
		);

		expect(contained.bodyGap).toBeCloseTo(flow.bodyGap, subpixel);
		expect(contained.sectionGap).toBeCloseTo(flow.sectionGap, subpixel);
		expect(contained.afterHeadingGap).toBeCloseTo(flow.afterHeadingGap, subpixel);
	});
}

// Nothing carries a block-end margin, so there is structurally no trailing space to escape,
// however deep the last element sits. A list's final `li` and a description list's final `dd`
// are the two the previous model leaked through, because zeroing the container's own direct
// last child never reached them.
//
// These render into a grid root deliberately. In normal flow a leaked descendant margin
// collapses through its parent's bottom edge and measures zero, hiding the defect; with
// collapse off it becomes the visible trailing space a consumer would actually get.
test('lets no space escape the container, at any depth', () => {
	const { locator } = render(
		<Prose style={{ display: 'grid' }}>
			<p>Opening paragraph.</p>
			<ul>
				<li>First item</li>
				<li>Last item</li>
			</ul>
		</Prose>,
	);
	const root = locator.element();
	const items = root.querySelectorAll('li');
	const lastItem = items[items.length - 1];
	if (lastItem == null) throw new Error('Expected list items.');

	// The first block opens no space above the container, and the last closes none below it.
	expect(
		query(root, 'p').getBoundingClientRect().top - root.getBoundingClientRect().top,
	).toBeCloseTo(0, subpixel);
	expect(root.getBoundingClientRect().bottom - lastItem.getBoundingClientRect().bottom).toBeCloseTo(
		0,
		subpixel,
	);
});

test('lets no space escape below a trailing description list', () => {
	const { locator } = render(
		<Prose style={{ display: 'grid' }}>
			<p>Opening paragraph.</p>
			<dl>
				<dt>Step</dt>
				<dd>One named value on the scale.</dd>
			</dl>
		</Prose>,
	);
	const root = locator.element();
	const description = query(root, 'dd');

	expect(
		root.getBoundingClientRect().bottom - description.getBoundingClientRect().bottom,
	).toBeCloseTo(0, subpixel);
});

// The shared reset leaves `pre` alone, and a `pre` inside a `blockquote` is neither a first
// child of the container nor reachable by a sibling rule, so the browser's default margin
// survived the previous model. The unconditional sweep is what clears it. The quote lays out as
// a grid so that margin cannot hide by collapsing into the quote's own edge.
test('clears the browser margin from a nested pre', () => {
	const { locator } = render(
		<Prose>
			<blockquote style={{ display: 'grid' }}>
				<pre>code</pre>
			</blockquote>
		</Prose>,
	);
	const root = locator.element();
	const quote = query(root, 'blockquote');
	const block = query(root, 'pre');

	expect(getComputedStyle(block).marginBlockStart).toBe('0px');
	expect(block.getBoundingClientRect().top - quote.getBoundingClientRect().top).toBeCloseTo(
		0,
		subpixel,
	);
});

// The reset strips `list-style` and `padding-inline-start` from every list, so a document
// inside `Prose` has to get its markers and indent back.
test('restores list markers and indent', () => {
	const { locator } = render(
		<Prose>
			<ul>
				<li>Unordered item</li>
			</ul>
			<ol>
				<li>Ordered item</li>
			</ol>
		</Prose>,
	);
	const root = locator.element();
	const unordered = getComputedStyle(query(root, 'ul'));

	expect(unordered.listStyleType).toBe('disc');
	expect(getComputedStyle(query(root, 'ol')).listStyleType).toBe('decimal');
	expect(Number.parseFloat(unordered.paddingInlineStart)).toBeGreaterThan(0);
});
