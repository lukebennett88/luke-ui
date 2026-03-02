import type { LoadingSpinnerProps } from '@luke-ui/react/feedback';
import { LoadingSpinner } from '@luke-ui/react/feedback';
import { tokenKeys, tokens } from '@luke-ui/react/tokens';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: LoadingSpinner,
	title: 'Feedback/LoadingSpinner',
});

const baseArgs = {
	'aria-label': 'pending',
} as const satisfies Partial<LoadingSpinnerProps>;

const stackStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} as const satisfies CSSProperties;

/**
 * Use an indeterminate spinner when completion time is unknown.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole('progressbar', { name: 'pending' }),
		).toBeInTheDocument();
	},
});

const sizes: Array<NonNullable<LoadingSpinnerProps['size']>> = [
	'small',
	'medium',
];

/**
 * Size adjusts the spinner footprint for compact and standard layouts.
 */
export const Size = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			{sizes.map((size) => (
				<LoadingSpinner key={size} size={size} {...props} />
			))}
		</div>
	),
});

const colors = tokenKeys(tokens.foregroundColor);

/**
 * Spinner color can use any design-system foreground color token.
 */
export const Color = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			{colors.map((color) => (
				<LoadingSpinner color={color} key={color} {...props} />
			))}
		</div>
	),
});
