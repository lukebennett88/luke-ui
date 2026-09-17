import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { Cluster } from './cluster.js';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				<Cluster
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						inlineSize: '14rem',
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Wrapping</span>
					<span style={itemStyle}>Inline</span>
					<span style={itemStyle}>Items</span>
					<span style={itemStyle}>Share</span>
					<span style={itemStyle}>Space</span>
				</Cluster>
				<Cluster
					alignItems="stretch"
					gap="sp8"
					justifyContent="space-between"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Start</span>
					<span style={itemStyle}>End</span>
				</Cluster>
				<div dir="rtl">
					<Cluster
						elementType="ul"
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							listStyle: 'none',
							margin: 0,
							padding: vars.space.sp16,
						}}
					>
						<li style={itemStyle}>One</li>
						<li style={itemStyle}>Two</li>
						<li style={itemStyle}>Three</li>
					</Cluster>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'cluster/kitchen-sink', appearance);
	}
});
