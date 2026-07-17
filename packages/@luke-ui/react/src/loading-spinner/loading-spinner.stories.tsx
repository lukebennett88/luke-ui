import type { LoadingSpinnerProps } from '@luke-ui/react/loading-spinner';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
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

/**
 * The spinner shows an animated loading indicator.
 */
export const Default = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('status', { name: 'loading' })).toBeInTheDocument();
	},
});

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
 * Spinner color can use semantic content roles, or inherit its parent's color when omitted.
 */
export const Color = meta.story({
	play: async ({ canvas }) => {
		const inherited = canvas.getByRole('status', { name: 'Inherited accent' });
		const parent = inherited.parentElement;
		if (!parent) throw new Error('Expected spinner parent.');

		await expect(getComputedStyle(inherited).color).toBe(getComputedStyle(parent).color);
	},
	render: (props) => (
		<div style={flexRowStyle}>
			<div style={{ color: vars.color.intent.accent.text }}>
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
		await expect(canvas.getByRole('status', { name: 'loading' })).toBeInTheDocument();
		await expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull();

		await userEvent.click(canvas.getByRole('button', { name: 'Toggle loading' }));

		await expect(canvas.queryByRole('status', { name: 'loading' })).toBeNull();
		await expect(canvas.getByRole('button', { name: 'Save' })).toBeInTheDocument();
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
