import { Button } from '@luke-ui/react/button';
import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Grid } from '../test-utils/visual.js';

for (const appearance of visualAppearances) {
	test(
		`danger high Button interaction states in ${appearance.theme} ${appearance.mode}`,
		{ tags: ['visual'] },
		async () => {
			const { locator } = render(
				<Grid columns={3}>
					{['Rest', 'Hover', 'Pressed'].map((state) => (
						<Button key={state} prominence="high" tone="danger">
							{state}
						</Button>
					))}
				</Grid>,
				{ appearance },
			);
			locator.getByRole('button', { name: 'Hover' }).element().setAttribute('data-hovered', 'true');
			locator
				.getByRole('button', { name: 'Pressed' })
				.element()
				.setAttribute('data-pressed', 'true');
			await captureVisualAppearance(locator, 'button/critical-interaction-states', appearance);
		},
	);
}
