import type { LoadingSpinnerProps } from '@luke-ui/react/loading-spinner';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { spinAnimationName } from '@luke-ui/react/recipes';
import { tokenKeys, tokens } from '@luke-ui/react/tokens';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: LoadingSpinner,
	tags: ['feedback'],
	title: 'Feedback/LoadingSpinner',
});

const baseArgs = {
	'aria-label': 'pending',
} as const satisfies Partial<LoadingSpinnerProps>;

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
 * Use an indeterminate spinner when completion time is unknown.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('progressbar', { name: 'pending' })).toBeInTheDocument();
	},
});

const sizes: Array<NonNullable<LoadingSpinnerProps['size']>> = ['small', 'medium'];

/**
 * Size adjusts the spinner footprint for compact and standard layouts.
 */
export const Size = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={flexRowStyle}>
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
		<div style={flexRowStyle}>
			{colors.map((color) => (
				<LoadingSpinner color={color} key={color} {...props} />
			))}
		</div>
	),
});

/**
 * All mounted indeterminate spinners rotate in sync, even when they mount at different times.
 */
export const Synchronized = meta.story({
	args: baseArgs,
	play: async ({ canvas, canvasElement }) => {
		const [first] = findSpinAnimations(canvasElement);
		if (!first) throw new Error('Expected a spin CSS animation.');
		// Pause so currentTime holds at 400 instead of drifting while we wait for the sync to run.
		first.pause();
		first.currentTime = 400;

		await userEvent.click(canvas.getByRole('button', { name: 'Mount another spinner' }));

		const [, second] = findSpinAnimations(canvasElement);
		if (!second) throw new Error('Expected a second spin CSS animation.');
		// Pause before the sync runs so its result can't drift away from 400 while we wait below,
		// no matter how many frames a loaded CI runner takes to get to it.
		second.pause();

		await new Promise(requestAnimationFrame);
		await new Promise(requestAnimationFrame);
		await expect(second.currentTime).toBe(400);
	},
	render: (props) => <StaggeredSpinners {...props} />,
});

function StaggeredSpinners(props: LoadingSpinnerProps) {
	const [spinnerCount, setSpinnerCount] = useState(1);

	return (
		<div style={flexStackStyle}>
			<div style={flexRowStyle}>
				{Array.from({ length: spinnerCount }, (_, index) => (
					<LoadingSpinner key={index} {...props} />
				))}
			</div>
			<button onClick={() => setSpinnerCount((count) => count + 1)} type="button">
				Mount another spinner
			</button>
		</div>
	);
}

function findSpinAnimations(root: Element): Array<CSSAnimation> {
	return root
		.getAnimations({ subtree: true })
		.filter(
			(animation): animation is CSSAnimation =>
				animation instanceof CSSAnimation && animation.animationName === spinAnimationName,
		);
}
