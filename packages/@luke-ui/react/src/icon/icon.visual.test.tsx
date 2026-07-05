import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { renderVisual, Stack, variantValuesFor } from '../test-utils/render-visual.js';
import { Icon } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const sizes = variantValuesFor<typeof Icon, 'size'>()(['xsmall', 'small', 'medium', 'large']);
const names = variantValuesFor<typeof Icon, 'name'>()([
	'add',
	'checkCircle',
	'critical',
	'externalLink',
	'search',
]);

test('sizes and glyphs', async () => {
	const locator = renderVisual(
		<Stack>
			<div style={rowStyle}>
				{sizes.map((size) => (
					<Icon key={size} name="add" size={size} title={`Add ${size}`} />
				))}
			</div>
			<div style={rowStyle}>
				{names.map((name) => (
					<Icon key={name} name={name} title={name} />
				))}
			</div>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('icon-sizes-glyphs');
});
