import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';
import { Stack } from './stack.js';

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
				<Stack
					gap="sp12"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Block axis</span>
					<span style={itemStyle}>Required gap</span>
				</Stack>
				<Stack
					alignItems="center"
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Aligned</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<Stack
					elementType="section"
					gap="0"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Touching</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<div dir="rtl">
					<Stack
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>First</span>
						<span style={itemStyle}>Second</span>
					</Stack>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'stack/kitchen-sink', appearance);
	}
});
