import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps, forwardedDomProps } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	Stack,
	variantValuesFor,
} from '../test-utils/visual.js';

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

function LoadingSpinnerScene() {
	return (
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
				<LoadingSpinner aria-label="loaded fixed size button" isLoading={false}>
					<button style={fixedChildStyle} type="button">
						Save
					</button>
				</LoadingSpinner>
			</div>
		</Stack>
	);
}

test('LoadingSpinner forwards className, data attributes, id, and ref to its status element', () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(<LoadingSpinner {...forwardedDomProps} ref={ref} />);
	const target = locator.getByRole('status').element();

	expectForwardsDomProps(target, ref);
});

test('the LoadingSpinner scene has no axe violations', async () => {
	const { container } = render(<LoadingSpinnerScene />);

	await expectNoAxeViolations(container);
});

test('sizes and colors', { tags: ['visual'] }, async () => {
	const { locator } = render(<LoadingSpinnerScene />);

	await captureVisual(locator, 'loading-spinner/sizes-and-colors');
});

const themeMatrixStyle = {
	backgroundColor: vars.color.surface.canvas,
	display: 'flex',
	gap: '1rem',
	padding: '1rem',
} satisfies CSSProperties;

const spinnerStyle = {
	color: vars.color.foreground.accent.rest,
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
				backgroundColor: vars.color.surface.recessed,
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

test('theme matrix', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const oppositeMode = appearance.mode === 'light' ? 'dark' : 'light';
		const { locator } = render(
			<div style={themeMatrixStyle}>
				<ThemeMatrixScope label="Root scope">
					<LoadingSpinner aria-label="Root theme pending" style={spinnerStyle} />
				</ThemeMatrixScope>
				<ThemeMatrixScope label="Opposite mode" mode={oppositeMode}>
					<LoadingSpinner aria-label="Opposite mode theme" style={spinnerStyle} />
				</ThemeMatrixScope>
			</div>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'loading-spinner/theme-matrix', appearance);
	}
});
