import { Box } from '@luke-ui/react/box';
import { createSprinkles } from '@luke-ui/react/styles';
import { createRef } from 'react';
import { test, expect } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('Box forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<Box className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</Box>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Box element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
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

test('layout', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<Box
				display="flex"
				flexDirection="column"
				gap="sp8"
				padding="sp16"
				style={{
					backgroundColor: vars.color.surface.recessed,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.recessed,
					color: vars.color.text.primary,
				}}
			>
				<Box>Account</Box>
				<Box display="flex" gap="sp8">
					<Box>Profile</Box>
					<Box>Security</Box>
				</Box>
			</Box>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'box/layout', appearance);
	}
});
