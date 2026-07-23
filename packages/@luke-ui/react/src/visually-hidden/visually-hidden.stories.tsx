import type { VisuallyHiddenProps } from '@luke-ui/react/visually-hidden';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ComponentPropsWithRef } from 'react';
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
 * Use `render` to keep the hidden styles on a custom or semantic element. Spread the
 * supplied props on the element you return so it keeps the class name and other DOM props.
 */
export const CustomElement = meta.story({
	args: {
		children: 'Add to favourites',
		className: 'consumer-class',
		id: 'favourite-label',
		render: (domProps) => <MotionSpan {...domProps} />,
	} satisfies Partial<VisuallyHiddenProps>,
	play: async ({ canvas }) => {
		const label = canvas.getByText('Add to favourites');
		await expect(label).toHaveClass('consumer-class');
		await expect(label).toHaveAttribute('data-motion', 'enabled');
		await expect(label).toHaveAttribute('id', 'favourite-label');
		await expect(getComputedStyle(label).position).toBe('absolute');
	},
});

function MotionSpan(props: ComponentPropsWithRef<'span'>) {
	return <span data-motion="enabled" {...props} />;
}
