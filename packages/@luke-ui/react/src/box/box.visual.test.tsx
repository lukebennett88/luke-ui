import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { vars } from '../theme/index.js';
import { Box } from './index.js';

for (const appearance of visualAppearances) {
	test(`layout: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator: scene } = render(
			<Box
				display="flex"
				flexDirection="column"
				gap="200"
				padding="400"
				style={{
					backgroundColor: vars.color.surface.recessed,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.recessed,
					color: vars.color.text.primary,
				}}
			>
				<Box>Account</Box>
				<Box display="flex" gap="200">
					<Box>Profile</Box>
					<Box>Security</Box>
				</Box>
			</Box>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'box/layout', appearance);
	});
}
