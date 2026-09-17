import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { Box } from '../box/box.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { Text } from '../text/text.js';
import { AspectRatio } from './aspect-ratio.js';

const ratios = ['1 / 1', '4 / 3', '3 / 2', '16 / 9', '21 / 9'] as const;

test('locked ratios', async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'grid', gap: vars.space.sp16 }}>
				{ratios.map((ratio) => (
					<AspectRatio key={ratio} inlineSize="18rem" ratio={ratio}>
						<Box
							backgroundColor="surface.floating"
							blockSize="100%"
							borderColor="decorative"
							borderRadius="detail"
							borderStyle="solid"
							borderWidth="thin"
							inlineSize="100%"
							padding="sp12"
						>
							<Text>{ratio}</Text>
						</Box>
					</AspectRatio>
				))}
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'aspect-ratio/ratios', appearance);
	}
});
