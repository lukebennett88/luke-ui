import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { createSprinkles } from '../styles/utilities.css.js';
import { render } from '../test-utils/render.js';
import { Box } from './box.js';

testConformance({
	path: 'box',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Box element.');
		return target;
	},
	render: (props = {}) => render(<Box {...props}>Content</Box>),
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const semanticResult = render(
		<Box aria-label="Account summary" elementType="section">
			Account summary content
		</Box>,
	);
	const section = semanticResult.locator.getByRole('region', { name: 'Account summary' });
	expect(section.element().tagName).toBe('SECTION');

	let receivedAriaLabel = false;
	const customResult = render(
		<Box
			aria-label="Ignored Box label"
			render={(resolvedProps) => {
				receivedAriaLabel = Object.hasOwn(resolvedProps, 'aria-label');
				return <div {...resolvedProps} />;
			}}
			style={{ display: 'grid' }}
		>
			Custom div
		</Box>,
	);
	const div = customResult.locator.getByText('Custom div').element();
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(receivedAriaLabel).toBe(false);
	expect(div.style.display).toBe('grid');
});

test('consumer className and style win collisions on the ordinary element path', () => {
	const ref = createRef<HTMLElement>();
	const utility = createSprinkles({ display: 'flex', inlineSize: '12rem' });
	const { locator } = render(
		<Box
			ref={ref}
			className="consumer-class"
			data-testid="box-element"
			display="flex"
			gap="sp16"
			id="box-root"
			inlineSize="12rem"
			style={{ backgroundColor: 'rgb(1, 2, 3)', display: 'grid' }}
		>
			Element path
		</Box>,
	);
	const element = locator.getByTestId('box-element').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Box element.');

	expect(ref.current).toBe(element);
	expect(element.id).toBe('box-root');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('192px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
	expectConsumerClassAfterUtilities(element.className, utility.className);
});

test('consumer className and style win collisions on the render callback path', () => {
	const ref = createRef<HTMLElement>();
	const utility = createSprinkles({ display: 'flex', inlineSize: '10rem' });
	let receivedRef: unknown;
	const { locator } = render(
		<Box
			ref={ref}
			className="consumer-class"
			display="flex"
			gap={{ initial: 'sp8', bp768: 'sp24' }}
			inlineSize="10rem"
			render={(resolvedProps) => {
				receivedRef = resolvedProps.ref;
				return <article {...resolvedProps} data-testid="box-render" />;
			}}
			style={{ backgroundColor: 'rgb(4, 5, 6)', display: 'grid' }}
		>
			Render path
		</Box>,
	);
	const element = locator.getByTestId('box-render').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected render callback element.');

	expect(element.tagName).toBe('ARTICLE');
	expect(ref.current).toBe(element);
	expect(typeof receivedRef).toBe('function');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('160px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(4, 5, 6)');
	expectConsumerClassAfterUtilities(element.className, utility.className);
});

/** Consumer `className` is merged after utility classes, so it appears later in the token list. */
function expectConsumerClassAfterUtilities(className: string, utilityClassName: string): void {
	const classes = className.split(/\s+/).filter(Boolean);
	const utilityClasses = utilityClassName.split(/\s+/).filter(Boolean);
	const consumerIndex = classes.indexOf('consumer-class');

	expect(consumerIndex).toBeGreaterThan(-1);
	expect(utilityClasses.length).toBeGreaterThan(0);
	for (const utilityClass of utilityClasses) {
		const utilityIndex = classes.indexOf(utilityClass);
		expect(utilityIndex).toBeGreaterThan(-1);
		expect(utilityIndex).toBeLessThan(consumerIndex);
	}
}
