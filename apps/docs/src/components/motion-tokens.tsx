import { Box } from '@luke-ui/react/box';
import { SwitchField } from '@luke-ui/react/switch-field';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties, ReactNode } from 'react';
import { useState, useSyncExternalStore } from 'react';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import { tokenSections } from '../lib/token-grammar.js';
import { useTokenValue } from '../lib/use-token-value.js';
import { TokenGroup, TokenPanel, TokenRow } from './token-reference-parts.js';
import * as styles from './token-reference.css.js';

const MOTION_TREATMENTS = [
	{ id: 'motionFeedback', label: 'Feedback' },
	{ id: 'motionEnter', label: 'Enter' },
	{ id: 'motionExit', label: 'Exit' },
] as const;

/** Shared motion-sample loop length in milliseconds (matches the CSS sample cycle). */
const MOTION_SAMPLE_CYCLE_MS = 1_000;

const DURATION_MS_PATTERN = /^([\d.]+)ms$/;

/**
 * The three motion treatments. Each table shows that treatment's duration and easing together, with
 * its own Animate switch. Duration crossings reflect each token inside a one-second half-cycle;
 * easing samples rest at both ends, then cross with the token curve on their own one-second loop.
 * Loops pause offscreen and when Animate is off.
 */
export function MotionTokens() {
	const { scales } = tokenSections;

	return (
		<>
			{MOTION_TREATMENTS.map(({ id, label }) => {
				const tokens = scales[id].tokens;
				const duration = tokens.find((token) => token.path.endsWith('.duration'));
				const easing = tokens.find((token) => token.path.endsWith('.easing'));

				return (
					<MotionSampleTable key={id} label={label}>
						{(playGeneration) => (
							<>
								{duration === undefined ? null : (
									<TokenRow
										key={duration.path}
										sample={<DurationMotionSample key={playGeneration} token={duration} />}
										sampleInlineSize={styles.MOTION_TRACK_SIZE}
										token={duration}
									/>
								)}
								{easing === undefined ? null : (
									<TokenRow
										key={easing.path}
										sample={
											<MotionSample
												key={playGeneration}
												dotClassName={styles.motionDotEasing}
												style={{ animationTimingFunction: `var(${easing.variable})` }}
											/>
										}
										sampleInlineSize={styles.MOTION_TRACK_SIZE}
										token={easing}
									/>
								)}
							</>
						)}
					</MotionSampleTable>
				);
			})}
		</>
	);
}

/** One motion token table: in-view pausing, Animate switch, and remount sync for its samples. */
function MotionSampleTable({
	children,
	label,
}: {
	children: (playGeneration: number) => ReactNode;
	label: string;
}) {
	const prefersReducedMotion = usePrefersReducedMotion();
	const [animateOverride, setAnimateOverride] = useState<boolean | null>(null);
	const [playGeneration, setPlayGeneration] = useState(0);
	const animate = animateOverride ?? !prefersReducedMotion;

	return (
		<TokenPanel sampleInlineSize={styles.MOTION_TRACK_SIZE}>
			<div
				className={styles.motionSamples}
				data-animate={animate ? 'true' : 'false'}
				ref={observeMotionSamplesInView}
			>
				<TokenGroup
					control={
						<SwitchField
							isSelected={animate}
							label={
								<Text color="secondary" slot={null} typography="caption">
									Animate
								</Text>
							}
							onChange={(isSelected) => {
								setAnimateOverride(isSelected);
								if (isSelected) {
									setPlayGeneration((generation) => generation + 1);
								}
							}}
							size="px16"
						/>
					}
					label={label}
				>
					{children(playGeneration)}
				</TokenGroup>
			</div>
		</TokenPanel>
	);
}

/** Stable ref callback so IntersectionObserver is not recreated every render. */
function observeMotionSamplesInView(node: HTMLDivElement | null) {
	if (!node) {
		return;
	}

	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry) {
				node.dataset.inView = entry.isIntersecting ? 'true' : 'false';
			}
		},
		{ threshold: 0 },
	);
	observer.observe(node);
	return () => {
		observer.disconnect();
	};
}

/** Duration dot whose crossing speed reflects the token within the shared sample cycle. */
function DurationMotionSample({ token }: { token: ThemeToken }) {
	const value = useTokenValue(token);
	const milliseconds = parseDurationMilliseconds(value);
	const style: CSSProperties =
		milliseconds === null
			? { animation: 'none' }
			: { animationTimingFunction: durationSampleTiming(milliseconds) };

	return <MotionSample dotClassName={styles.motionDotDuration} style={style} />;
}

/** Maps token duration to a linear() curve that completes travel early in the shared cycle. */
function durationSampleTiming(milliseconds: number): string {
	const percent = (milliseconds / MOTION_SAMPLE_CYCLE_MS) * 100;
	// Stop positions must use %; unitless values invalidate the easing and browsers fall back to ease.
	return `linear(0 0%, 1 ${percent}%, 1 100%)`;
}

function parseDurationMilliseconds(value: string | null): number | null {
	if (value === null || value === '') {
		return null;
	}
	const match = DURATION_MS_PATTERN.exec(value);
	if (!match) {
		return null;
	}
	return Number.parseFloat(match[1] ?? '');
}

/** A dot that loops a track. Callers set duration or easing on the dot via `style`. */
function MotionSample({ dotClassName, style }: { dotClassName: string; style: CSSProperties }) {
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
				className={dotClassName}
				inlineSize={styles.MOTION_DOT_SIZE}
				insetInlineStart="0"
				position="absolute"
				style={style}
			/>
		</Box>
	);
}

function usePrefersReducedMotion(): boolean {
	return useSyncExternalStore(
		subscribeToPrefersReducedMotion,
		getPrefersReducedMotionSnapshot,
		getServerPrefersReducedMotionSnapshot,
	);
}

function subscribeToPrefersReducedMotion(onStoreChange: () => void) {
	const media = window.matchMedia('(prefers-reduced-motion: reduce)');
	media.addEventListener('change', onStoreChange);
	return () => {
		media.removeEventListener('change', onStoreChange);
	};
}

function getPrefersReducedMotionSnapshot() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerPrefersReducedMotionSnapshot() {
	return true;
}
