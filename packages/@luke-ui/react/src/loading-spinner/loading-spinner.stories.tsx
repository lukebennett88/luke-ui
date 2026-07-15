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

/** Use a value when progress can be measured against a known range. */
export const Determinate = meta.story({
	args: {
		'aria-label': 'Uploading',
		maxValue: 200,
		minValue: 100,
		value: 175,
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('progressbar', { name: 'Uploading' })).toHaveAttribute(
			'aria-valuenow',
			'175',
		);
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

const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'danger'] as const;

/**
 * Spinner color can use semantic content roles, or inherit its parent's color when omitted.
 */
export const Color = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		const inherited = canvas.getByRole('progressbar', { name: 'Inherited accent' });
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
	return root.getAnimations({ subtree: true }).filter((animation): animation is CSSAnimation => {
		return (
			animation instanceof CSSAnimation &&
			animation.effect instanceof KeyframeEffect &&
			animation.effect.target instanceof HTMLElement &&
			animation.effect.target.getAttribute('role') === 'progressbar'
		);
	});
}
