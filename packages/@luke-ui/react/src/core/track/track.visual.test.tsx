import { test } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, variantValuesFor } from '../test-utils/visual.js';
import { Track } from './track.js';

const railAlignments = variantValuesFor<typeof Track, 'railAlignment'>()([
	'start',
	'firstLine',
	'center',
	'end',
]);

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

const rowStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderRadius: vars.radius.surface,
	color: vars.color.text.primary,
	padding: vars.space.sp16,
} as const;

const railStart = <span style={itemStyle}>Start</span>;
const railEnd = <span style={itemStyle}>End</span>;

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				{railAlignments.map((railAlignment) => (
					<Track
						gap="sp8"
						key={railAlignment}
						railAlignment={railAlignment}
						railEnd={railEnd}
						railStart={railStart}
						style={{ ...rowStyle, inlineSize: '20rem' }}
					>
						<span style={itemStyle}>This centre wraps beside both rails ({railAlignment})</span>
					</Track>
				))}
				<Track gap="sp8" railStart={railStart} style={rowStyle}>
					<span style={itemStyle}>Start rail only</span>
				</Track>
				<Track gap="sp8" railEnd={railEnd} style={rowStyle}>
					<span style={itemStyle}>End rail only</span>
				</Track>
				<Track gap="sp8" railEnd={railEnd} railStart={railStart} style={rowStyle}>
					<span style={itemStyle}>Both rails</span>
				</Track>
				<Track gap="sp8" style={rowStyle}>
					<span style={itemStyle}>Neither rail</span>
				</Track>
				<Track
					gap="sp8"
					railEnd={railEnd}
					railStart={railStart}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					<span style={{ display: 'block', overflow: 'hidden', whiteSpace: 'nowrap' }}>
						Anunbrokenstringoftextthatoverflowsthecentrewithoutwrapping
					</span>
				</Track>
				<Track
					gap="sp8"
					railEnd={railEnd}
					railStart={railStart}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					This centre text wraps across multiple lines to show how the rails sit alongside multiline
					content.
				</Track>
				<Track
					gap="sp8"
					railAlignment="firstLine"
					railStart={<span style={{ ...itemStyle, blockSize: '3rem', display: 'block' }} />}
					style={{ ...rowStyle, inlineSize: '16rem' }}
				>
					A tall rail beside multiline text stays pinned to the first line instead of growing with
					the centre.
				</Track>
				<div dir="rtl">
					<Track gap="sp8" railEnd={railEnd} railStart={railStart} style={rowStyle}>
						<span style={itemStyle}>RTL</span>
					</Track>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'track/kitchen-sink', appearance);
	}
});
