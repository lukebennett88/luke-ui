import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { Box } from '../box/box.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { Text } from '../text/text.js';
import { Container } from './container.js';

const sizes = ['ct448', 'ct672', 'ct896', 'ct1152', 'ct1280'] as const;

test('fixed maximum inline sizes', async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp12 }}>
				{sizes.map((maxInlineSize) => (
					<Container key={maxInlineSize} maxInlineSize={maxInlineSize} paddingInline="sp16">
						<Box
							backgroundColor="surface.floating"
							borderColor="decorative"
							borderRadius="detail"
							borderStyle="solid"
							borderWidth="thin"
							padding="sp12"
						>
							<Text>{maxInlineSize}</Text>
						</Box>
					</Container>
				))}
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'container/fixed-sizes', appearance);
	}
});
