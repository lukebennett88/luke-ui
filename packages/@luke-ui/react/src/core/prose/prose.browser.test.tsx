import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Prose } from './prose.js';
import { proseRecipe } from './recipe.js';

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

// A consumer's own generic `class="prose"` (e.g. a Tailwind Typography convention) must not pick
// up Luke UI's rhythm rules. The scope class is the private, namespaced `luke-ui-prose` literal
// (`lukeUiClassNames.proseScope`), not the collision-prone `prose` — this fails if that regresses.
test('does not apply Prose rhythm to an unrelated element literally classed "prose"', () => {
	const { locator: unrelated } = render(
		<div className="prose">
			<p>Paragraph.</p>
			<h2>Section</h2>
		</div>,
	);
	const unrelatedRoot = unrelated.element();
	const unrelatedGap = gapBetween(query(unrelatedRoot, 'p'), query(unrelatedRoot, 'h2'));

	// Proves the assertion isn't vacuous: the same markup under a real `<Prose>` does get the gap.
	const proseGap = renderSection();

	expect(unrelatedGap).toBeCloseTo(0, 0);
	expect(proseGap).toBeGreaterThan(0);
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
