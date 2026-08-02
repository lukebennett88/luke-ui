import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useId, useState } from 'react';

const MIN_WIDTH = 320;
const MAX_WIDTH = 1600;
const DEFAULT_WIDTH = 480;
const WIDTH_STEP = 8;

const BREAKPOINTS = [
	{ minWidth: 1536, name: 'xxlarge' },
	{ minWidth: 1280, name: 'xlarge' },
	{ minWidth: 1024, name: 'large' },
	{ minWidth: 768, name: 'medium' },
	{ minWidth: 640, name: 'small' },
] as const;

export default function BreakpointPreview() {
	const sliderId = useId();
	const [width, setWidth] = useState(DEFAULT_WIDTH);
	const breakpointName = getBreakpointName(width);

	return (
		<Box display="flex" flexDirection="column" gap="600" padding="600">
			<Box display="flex" flexDirection="column" gap="200">
				<label
					htmlFor={sliderId}
					style={{ color: vars.color.text.secondary, fontSize: '0.875rem' }}
				>
					Simulated viewport width
				</label>
				<input
					aria-valuetext={`${width} pixels, ${breakpointName} breakpoint`}
					id={sliderId}
					max={MAX_WIDTH}
					min={MIN_WIDTH}
					onChange={(event) => setWidth(Number(event.target.value))}
					step={WIDTH_STEP}
					style={{ inlineSize: '100%' }}
					type="range"
					value={width}
				/>
				<Text elementType="p" size="200">
					{width}px — <Text fontWeight="label">{breakpointName}</Text> breakpoint
				</Text>
			</Box>
			<PreviewLayout width={width} />
		</Box>
	);
}

/** Mirrors the real Sprinkles thresholds so the label always matches a genuine breakpoint. */
function getBreakpointName(width: number): string {
	const match = BREAKPOINTS.find((breakpoint) => width >= breakpoint.minWidth);
	return match?.name ?? 'xsmall';
}

interface PreviewLayoutProps {
	width: number;
}

/** The simulated container. Its inline size tracks the slider, capped by the frame it sits in. */
function PreviewLayout({ width }: PreviewLayoutProps) {
	const isRow = width >= 640;
	const showBadge = width >= 1024;

	return (
		<Box
			style={{
				backgroundColor: vars.color.surface.recessed,
				border: `1px solid ${vars.color.border.decorative}`,
				borderRadius: vars.radius.surface,
				display: 'flex',
				flexDirection: isRow ? 'row' : 'column',
				gap: vars.space[300],
				inlineSize: `${width}px`,
				maxInlineSize: '100%',
				padding: vars.space[300],
			}}
		>
			<PreviewCard />
			<PreviewCard />
			{showBadge ? <PreviewBadge /> : null}
		</Box>
	);
}

function PreviewCard() {
	return (
		<Box
			style={{
				alignItems: 'center',
				backgroundColor: vars.color.background.neutral.subtle.rest,
				blockSize: '3rem',
				borderRadius: vars.radius.control,
				color: vars.color.foreground.neutral.rest,
				display: 'flex',
				flex: 1,
				justifyContent: 'center',
			}}
		>
			<Text fontWeight="label" size="100">
				Card
			</Text>
		</Box>
	);
}

/** Only rendered from the `large` breakpoint up, to show `display` used as a show/hide switch. */
function PreviewBadge() {
	return (
		<Box
			style={{
				alignItems: 'center',
				backgroundColor: vars.color.background.info.solid.rest,
				borderRadius: vars.radius.full,
				color: vars.color.foreground.info.onSolid,
				display: 'flex',
				inlineSize: 'fit-content',
				paddingBlock: vars.space[100],
				paddingInline: vars.space[300],
			}}
		>
			<Text fontWeight="label" size="100">
				Wide layout
			</Text>
		</Box>
	);
}
