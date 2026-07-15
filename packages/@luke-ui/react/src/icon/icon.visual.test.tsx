import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import {
	captureVisual,
	captureVisualAppearance,
	renderVisual,
	Stack,
	variantValuesFor,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { vars } from '../theme/index.js';
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
	'closeCircle',
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

	await captureVisual(locator, 'icon/sizes-glyphs');
});

for (const appearance of visualAppearances) {
	test(`semantic content inheritance: ${appearance.theme} ${appearance.mode}`, async () => {
		const scene = renderVisual(
			<div style={{ color: vars.color.intent.accent.text }}>
				<Icon name="checkCircle" title="Inherited accent" />
			</div>,
			appearance,
		);
		const icon = scene.getByRole('img', { name: 'Inherited accent' });
		const parent = icon.element().parentElement;
		if (!parent) throw new Error('Expected icon parent.');

		expect(getComputedStyle(icon.element()).color).toBe(getComputedStyle(parent).color);
		await captureVisualAppearance(scene, 'icon/content-inheritance', appearance);
	});
}
