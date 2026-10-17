import { Box } from '@luke-ui/react/box';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import { parseCubicBezier } from '../lib/cubic-bezier.js';
import { tokenSections } from '../lib/token-grammar.js';
import { useTokenValue } from '../lib/use-token-value.js';
import { TokenGroup, TokenPanel, TokenRow } from './token-reference-parts.js';
import * as styles from './token-reference.css.js';

const MOTION_TREATMENTS = [
	{ id: 'motionFeedback', label: 'Feedback' },
	{ id: 'motionEnter', label: 'Enter' },
	{ id: 'motionExit', label: 'Exit' },
] as const;

/**
 * The three motion treatments. Each group shows that treatment's duration and easing together. A
 * duration plays when someone hovers, focuses, or taps its row, and holds still under reduced
 * motion. An easing is plotted as its curve.
 */
export function MotionTokens() {
	const { scales } = tokenSections;
	return (
		<TokenPanel>
			{MOTION_TREATMENTS.map(({ id, label }) => {
				const tokens = scales[id].tokens;
				const duration = tokens.find((token) => token.path.endsWith('.duration'));
				const easing = tokens.find((token) => token.path.endsWith('.easing'));
				return (
					<TokenGroup key={id} label={label}>
						{duration === undefined ? null : (
							<TokenRow
								sample={<DurationSample duration={duration} easing={easing} />}
								sampleInlineSize={styles.MOTION_TRACK_SIZE}
								token={duration}
							/>
						)}
						{easing === undefined ? null : (
							<TokenRow
								sample={<EasingPlot token={easing} />}
								sampleInlineSize="3.5rem"
								token={easing}
							/>
						)}
					</TokenGroup>
				);
			})}
		</TokenPanel>
	);
}

/** A dot at the start of a track. It crosses the track over the treatment's duration and easing. */
function DurationSample({
	duration,
	easing,
}: {
	duration: ThemeToken;
	easing: ThemeToken | undefined;
}) {
	return (
		<Box
			alignItems="center"
			blockSize={styles.MOTION_DOT_SIZE}
			display="flex"
			inlineSize={styles.MOTION_TRACK_SIZE}
			position="relative"
		>
			<Box
				backgroundColor="neutral.subtle.rest"
				blockSize="0.25rem"
				borderRadius="full"
				inlineSize="100%"
			/>
			<Box
				backgroundColor="accent.solid.rest"
				blockSize={styles.MOTION_DOT_SIZE}
				borderRadius="full"
				className={styles.motionDot}
				inlineSize={styles.MOTION_DOT_SIZE}
				insetInlineStart="0"
				position="absolute"
				style={{
					transitionDuration: `var(${duration.variable})`,
					...(easing === undefined ? {} : { transitionTimingFunction: `var(${easing.variable})` }),
				}}
			/>
		</Box>
	);
}

/** The plot's size in CSS pixels. Its view box is 0 to 100 on each axis, with room for overshoot. */
const PLOT_SIZE = 56;

/**
 * The easing's curve from its resolved `cubic-bezier()` value: time runs left to right and
 * progress bottom to top. Dashed lines join each end to its control point. The plot is empty until
 * the page has hydrated and can read the value.
 */
function EasingPlot({ token }: { token: ThemeToken }) {
	const value = useTokenValue(token);
	const curve = value === null ? null : parseCubicBezier(value);

	return (
		<svg className={styles.easingPlot} height={PLOT_SIZE} viewBox="-8 -8 116 116" width={PLOT_SIZE}>
			<rect
				className={styles.easingGuide}
				height="100"
				vectorEffect="non-scaling-stroke"
				width="100"
			/>
			{curve === null ? null : (
				<>
					<line
						className={styles.easingHandle}
						vectorEffect="non-scaling-stroke"
						x1="0"
						x2={toX(curve[0])}
						y1="100"
						y2={toY(curve[1])}
					/>
					<line
						className={styles.easingHandle}
						vectorEffect="non-scaling-stroke"
						x1="100"
						x2={toX(curve[2])}
						y1="0"
						y2={toY(curve[3])}
					/>
					<path
						className={styles.easingCurve}
						d={`M 0 100 C ${toX(curve[0])} ${toY(curve[1])} ${toX(curve[2])} ${toY(curve[3])} 100 0`}
						vectorEffect="non-scaling-stroke"
					/>
				</>
			)}
		</svg>
	);
}

function toX(time: number) {
	return time * 100;
}

function toY(progress: number) {
	return 100 - progress * 100;
}
