import type { CSSProperties, ReactNode } from 'react';
import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	captureVisual,
	renderVisual,
	Stack,
	variantValuesFor,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { vars } from '../theme/index.js';
import { LoadingSpinner } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const sizes = variantValuesFor<typeof LoadingSpinner, 'size'>()(['small', 'medium', 'large']);
const colors = variantValuesFor<typeof LoadingSpinner, 'color'>()(['primary', 'info', 'danger']);

const fixedChildStyle = {
	blockSize: '2.5rem',
	inlineSize: '8rem',
} satisfies CSSProperties;

test('sizes and colors', async () => {
	const locator = renderVisual(
		<Stack>
			<div style={rowStyle}>
				{sizes.map((size) => (
					<LoadingSpinner aria-label={`${size} spinner`} key={size} size={size} />
				))}
			</div>
			<div style={rowStyle}>
				{colors.map((color) => (
					<LoadingSpinner aria-label={`${color} spinner`} color={color} key={color} />
				))}
			</div>
			<div style={rowStyle}>
				<LoadingSpinner aria-label="loading fixed size button">
					<button style={fixedChildStyle} type="button">
						Save
					</button>
				</LoadingSpinner>
				<LoadingSpinner aria-label="loaded fixed size button" loading={false}>
					<button style={fixedChildStyle} type="button">
						Save
					</button>
				</LoadingSpinner>
			</div>
		</Stack>,
	);

	await captureVisual(locator, 'loading-spinner/sizes-and-colors');
});

test.each(visualAppearances)('theme matrix: $theme $mode', async (appearance) => {
	const oppositeMode = appearance.mode === 'light' ? 'dark' : 'light';
	const scene = renderVisual(
		<div style={themeMatrixStyle}>
			<ThemeMatrixScope label="Root scope">
				<LoadingSpinner aria-label="Root theme pending" style={spinnerStyle} />
			</ThemeMatrixScope>
			<ThemeMatrixScope label="Opposite mode" mode={oppositeMode}>
				<LoadingSpinner aria-label="Opposite mode theme" style={spinnerStyle} />
			</ThemeMatrixScope>
		</div>,
		appearance,
	);

	await expect.element(scene).toHaveAttribute('data-color-mode', appearance.mode);
	await captureVisualAppearance(scene, 'loading-spinner/theme-matrix', appearance);
});

const themeMatrixStyle = {
	backgroundColor: vars.color.surface.canvas,
	display: 'flex',
	gap: '1rem',
	padding: '1rem',
} satisfies CSSProperties;

const spinnerStyle = {
	color: vars.color.intent.accent.text,
} satisfies CSSProperties;

function ThemeMatrixScope({
	children,
	label,
	mode,
}: {
	children: ReactNode;
	label: string;
	mode?: 'light' | 'dark';
}) {
	return (
		<div
			data-color-mode={mode}
			style={{
				alignItems: 'center',
				backgroundColor: vars.color.surface.resting,
				border: `1px solid ${vars.color.border.decorative}`,
				color: vars.color.text.primary,
				display: 'flex',
				gap: '0.5rem',
				padding: '1rem',
			}}
		>
			{children}
			<span>{label}</span>
		</div>
	);
}
