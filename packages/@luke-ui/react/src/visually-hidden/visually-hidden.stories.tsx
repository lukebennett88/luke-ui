import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: VisuallyHidden,
	tags: ['layout'],
	title: 'Layout/VisuallyHidden',
});

/**
 * A visually hidden label gives the button an accessible name without adding visible text.
 */
export const Default = meta.story({
	play: async ({ canvas }) => {
		const button = canvas.getByRole('button', { name: 'Add to favourites' });
		await expect(button).toBeInTheDocument();

		const label = canvas.getByText('Add to favourites');
		const style = getComputedStyle(label);
		await expect(style.position).toBe('absolute');
		await expect(style.width).toBe('1px');
		await expect(style.height).toBe('1px');
	},
	render: () => (
		<button type="button">
			<span aria-hidden="true">★</span>
			<VisuallyHidden>Add to favourites</VisuallyHidden>
		</button>
	),
});

/**
 * Pass `elementType` when hidden content needs a specific semantic element, such as a section heading.
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
