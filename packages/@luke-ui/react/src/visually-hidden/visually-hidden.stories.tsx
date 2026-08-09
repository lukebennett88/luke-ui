import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
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
	render: () => (
		<section>
			<VisuallyHidden elementType="h2">Search results</VisuallyHidden>
			<p>10 results found.</p>
		</section>
	),
});
