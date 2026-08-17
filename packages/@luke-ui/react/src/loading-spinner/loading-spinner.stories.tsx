import type { LoadingSpinnerProps } from '@luke-ui/react/loading-spinner';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { userEvent } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: LoadingSpinner,
	tags: ['feedback'],
	title: 'Feedback/LoadingSpinner',
});

const flexRowStyle = {
	display: 'flex',
	gap: '1rem',
} as const satisfies CSSProperties;

const flexStackStyle = {
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} as const satisfies CSSProperties;

export const Default = meta.story({});

const sizes: Array<NonNullable<LoadingSpinnerProps['size']>> = ['small', 'medium'];

/**
 * Size adjusts the spinner footprint for compact and standard layouts.
 */
export const Size = meta.story({
	render: (props) => (
		<div style={flexRowStyle}>
			{sizes.map((size) => (
				<LoadingSpinner key={size} size={size} {...props} />
			))}
		</div>
	),
});

const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'danger'] as const;

/**
 * Choose a semantic content colour, or omit `color` to inherit the parent's colour.
 */
export const Color = meta.story({
	render: (props) => (
		<div style={flexRowStyle}>
			<div style={{ color: vars.color.foreground.accent.rest }}>
				<LoadingSpinner {...props} aria-label="Inherited accent" />
			</div>
			{colors.map((color) => (
				<LoadingSpinner {...props} aria-label={color} color={color} key={color} />
			))}
		</div>
	),
});

/**
 * Wrap content in `LoadingSpinner` to show the spinner in its place while `isLoading` is `true`.
 * Interactive descendants become unavailable until loading finishes.
 */
export const Children = meta.story({
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Toggle loading' }));
	},
	render: () => <ToggleableChildren />,
});

function ToggleableChildren() {
	const [loading, setLoading] = useState(true);

	return (
		<div style={flexStackStyle}>
			<LoadingSpinner isLoading={loading}>
				<button type="button">Save</button>
			</LoadingSpinner>
			<button onClick={() => setLoading((current) => !current)} type="button">
				Toggle loading
			</button>
		</div>
	);
}
