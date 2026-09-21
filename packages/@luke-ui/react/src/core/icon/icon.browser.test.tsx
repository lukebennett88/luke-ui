import { Icon } from '@luke-ui/react/icon';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { expectNoAxeViolations } from '../test-utils/axe.js';
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

const sizes = variantValuesFor<typeof Icon, 'size'>()(['xsmall', 'small', 'medium', 'large']);
const names = variantValuesFor<typeof Icon, 'name'>()([
	'add',
	'checkCircle',
	'closeCircle',
	'externalLink',
	'search',
]);

/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface.
 */
function IconScene() {
	return (
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
		</Stack>
	);
}

// Icon's public props are a closed set: `ref` and `data-*` are not forwarded,
// so only `className` and `id` are part of its DOM contract.
test('forwards className and id to the svg', () => {
	const { container } = render(<Icon className="forwarded-class" id="forwarded-id" name="add" />);
	const svg = container.querySelector('svg');
	if (!(svg instanceof SVGSVGElement)) throw new Error('Expected an svg.');

	expect(svg).toHaveClass('forwarded-class');
	expect(svg).toHaveAttribute('id', 'forwarded-id');
});

test('the Icon scene has no axe violations', async () => {
	const { container } = render(<IconScene />);

	await expectNoAxeViolations(container);
});

test('sizes and glyphs', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconScene />);

	await captureVisual(locator, 'icon/sizes-glyphs');
});

test('semantic content inheritance', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<div style={{ color: vars.color.foreground.accent.rest }}>
				<Icon name="checkCircle" title="Inherited accent" />
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'icon/content-inheritance', appearance);
	}
});
