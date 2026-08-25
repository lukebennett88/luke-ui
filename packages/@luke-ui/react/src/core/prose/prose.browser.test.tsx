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

function marginBlock(root: Element, selector: string) {
	const style = getComputedStyle(query(root, selector));
	return {
		end: Number.parseFloat(style.marginBlockEnd),
		start: Number.parseFloat(style.marginBlockStart),
	};
}

// Vertical rhythm is the whole contract, and the reset flattens these margins to zero, so
// browser-computed layout is the only thing that can falsify it. These assert relationships
// rather than resolved token values, which belong to the visual fixture.
test('spaces the blocks of a document it wraps', () => {
	const { locator } = render(
		<Prose>
			<p>Opening paragraph.</p>
			<h2>A section</h2>
			<p>Body paragraph.</p>
			<ul>
				<li>First item</li>
			</ul>
		</Prose>,
	);
	const root = locator.element();
	const opening = marginBlock(root, 'p');
	const section = marginBlock(root, 'h2');

	// A paragraph ends with a real gap, and the heading opens a larger one above itself.
	expect(opening.end).toBeGreaterThan(0);
	expect(section.start).toBeGreaterThan(section.end);
	// The element after a heading adds nothing, so the heading's own gap is the whole distance.
	expect(marginBlock(root, 'p ~ p').start).toBe(0);
	// The first and last blocks add no space outside the container.
	expect(opening.start).toBe(0);
	expect(marginBlock(root, 'ul').end).toBe(0);
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
