import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { AspectRatio } from './aspect-ratio.js';

const ratios = ['1 / 1', '4 / 3', '3 / 2', '16 / 9', '21 / 9'] as const;
const objectFits = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;

/** Wide asymmetric SVG so cover, contain, and fill are visually distinct. */
const mediaSrc = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
		<rect width="200" height="200" fill="#1d4ed8"/>
		<rect x="200" width="200" height="200" fill="#f59e0b"/>
		<circle cx="100" cy="100" r="48" fill="#ffffff"/>
		<rect x="260" y="60" width="80" height="80" fill="#111827"/>
	</svg>`,
)}`;

test('media frame ratios and objectFit values', async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'grid', gap: vars.space.sp16 }}>
				{ratios.map((ratio) => (
					<AspectRatio key={ratio} inlineSize="18rem" ratio={ratio}>
						<img alt={`Ratio ${ratio}`} src={mediaSrc} />
					</AspectRatio>
				))}
				{objectFits.map((objectFit) => (
					<AspectRatio key={objectFit} inlineSize="18rem" objectFit={objectFit} ratio="16 / 9">
						<img alt={`objectFit ${objectFit}`} src={mediaSrc} />
					</AspectRatio>
				))}
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'aspect-ratio/media-frame', appearance);
	}
});
