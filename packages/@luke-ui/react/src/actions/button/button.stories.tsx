import { Button } from '@luke-ui/react/actions';
import { Icon } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Button,
	title: 'Actions/Button (Primitive)',
});

const rowStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

/**
 * The primitive `Button` renders a single `<button>` element with no internal
 * structure. Use it when you need full control over children layout — for
 * example, custom loading indicators, render-prop children, or non-standard
 * content that the composed `Button` doesn't support.
 *
 * For most cases, prefer the composed `Button` from `@luke-ui/react/actions/composed`
 * which adds text truncation and a pending spinner automatically.
 */
export const Default = meta.story({
	args: { children: 'Primitive button' },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Primitive button' })).toBeInTheDocument();
	},
});

/**
 * The primitive accepts arbitrary children without wrapping them, so icons
 * and text are direct flex items of the button.
 */
export const CustomContent = meta.story({
	render: (props) => (
		<div style={rowStyle}>
			<Button {...props}>
				<Icon name="add" />
				With icon
			</Button>
			<Button {...props} aria-label="Add item">
				<Icon name="add" />
			</Button>
		</div>
	),
});
