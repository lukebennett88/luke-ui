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
test('preserves native ordered-list type markers inside Prose', () => {
	const { locator } = render(
		<Prose>
			<ol>
				<li>default</li>
			</ol>
			<ol type="1">
				<li>one</li>
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
		</Prose>,
	);

	expect(listStyleTypes(locator.element())).toEqual([
		'decimal',
		'decimal',
		'lower-alpha',
		'upper-alpha',
		'lower-roman',
		'upper-roman',
	]);
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
