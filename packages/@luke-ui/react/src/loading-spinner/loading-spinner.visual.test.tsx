import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { renderVisual, Stack, variantValuesFor } from '../test-utils/render-visual.js';
import { LoadingSpinner } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const sizes = variantValuesFor<typeof LoadingSpinner, 'size'>()(['small', 'medium', 'large']);
const colors = variantValuesFor<typeof LoadingSpinner, 'color'>()([
	'neutralBold',
	'informative',
	'critical',
]);

test('sizes colors and modes', async () => {
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
				<LoadingSpinner aria-label="25 percent" value={25} />
				<LoadingSpinner aria-label="75 percent" value={75} />
			</div>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('loading-spinner-sizes-colors-modes');
});
