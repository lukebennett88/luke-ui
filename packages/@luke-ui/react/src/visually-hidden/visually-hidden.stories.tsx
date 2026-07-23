import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: VisuallyHidden,
	tags: ['layout'],
	title: 'Layout/VisuallyHidden',
});

/**
 * The label is hidden visually but stays in the accessibility tree, so the button
 * still has an accessible name and screen readers announce it.
 */
export const Default = meta.story({
	play: async ({ canvas }) => {
		const button = canvas.getByRole('button', { name: 'Add to favourites' });
		await expect(button).toBeInTheDocument();

		const label = canvas.getByText('Add to favourites');
		const style = getComputedStyle(label);
		await expect(style.position).toBe('absolute');
		await expect(style.clipPath).toMatch(/circle/);
	},
	render: () => (
		<button type="button">
			<span aria-hidden="true">★</span>
			<VisuallyHidden>Add to favourites</VisuallyHidden>
		</button>
	),
});

/**
 * Pass `elementType` to render a different element while keeping the hidden styles —
 * here a screen-reader-only section heading, exposed to assistive technology as an `h2`.
 */
export const CustomElementType = meta.story({
	play: async ({ canvas }) => {
		const heading = canvas.getByRole('heading', { name: 'Search results' });
		await expect(heading).toBeInTheDocument();
		await expect(heading.tagName).toBe('H2');
		await expect(getComputedStyle(heading).position).toBe('absolute');
	},
	render: () => (
		<section>
			<VisuallyHidden elementType="h2">Search results</VisuallyHidden>
			<p>10 results found.</p>
		</section>
	),
});
