import { Button } from '@luke-ui/react/button';
import { createIcon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { DiffRegion } from './diff-regions.js';
import type { Zoom } from './review-params.js';
import { stepZoom } from './review-params.js';
import * as styles from './review.css.js';

export const SidebarIcon = createIcon({
	path: (
		<path
			d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75ZM9 4.5v15"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
		/>
	),
});

export function Progress({
	isCompact,
	total,
	viewed,
}: {
	isCompact: boolean;
	total: number;
	viewed: number;
}) {
	if (isCompact) {
		return (
			<Text
				className={styles.progress}
				color="secondary"
				fontVariantNumeric="tabular-nums"
				fontWeight="body"
				typography="label"
			>
				{`${viewed}/${total}`}
				<VisuallyHidden> viewed</VisuallyHidden>
			</Text>
		);
	}
	return (
		<Text
			className={styles.progress}
			color="secondary"
			fontVariantNumeric="tabular-nums"
			fontWeight="body"
			typography="label"
		>
			{`${viewed} of ${total} viewed`}
		</Text>
	);
}

type DiffStepperProps = {
	active: number | undefined;
	isCompact: boolean;
	onStep: (offset: number) => void;
	regions: ReadonlyArray<DiffRegion>;
};

/** Steps the page through the differences in the capture in view. */
export function DiffStepper({ active, isCompact, onStep, regions }: DiffStepperProps) {
	const count = regions.length;
	const noun = `difference${count === 1 ? '' : 's'}`;
	// On a phone the header is tight, so it shows `3` or `1/3` and names the rest for screen readers.
	const position = (() => {
		if (!isCompact) return active === undefined ? `${count} ${noun}` : `${active + 1} of ${count}`;
		if (active === undefined) {
			return (
				<>
					{count}
					<VisuallyHidden>{` ${noun}`}</VisuallyHidden>
				</>
			);
		}
		return (
			<>
				{`${active + 1}/${count}`}
				<VisuallyHidden>{` ${noun}`}</VisuallyHidden>
			</>
		);
	})();
	return (
		<div aria-label="Differences" className={styles.differences} role="group">
			<IconButton
				aria-label={isCompact ? 'Previous difference' : 'Previous difference (Shift D)'}
				className={styles.touchTarget}
				icon="chevronUp"
				onPress={() => onStep(-1)}
				prominence="low"
				size={isCompact ? 'medium' : 'small'}
			/>
			<Text
				aria-live={isCompact ? undefined : 'polite'}
				className={isCompact ? styles.differencesPositionCompact : styles.differencesPosition}
				color="secondary"
				fontVariantNumeric="tabular-nums"
				fontWeight="body"
				typography="label"
			>
				{position}
			</Text>
			<IconButton
				aria-label={isCompact ? 'Next difference' : 'Next difference (D)'}
				className={styles.touchTarget}
				icon="chevronDown"
				onPress={() => onStep(1)}
				prominence="low"
				size={isCompact ? 'medium' : 'small'}
			/>
		</div>
	);
}

const MinusIcon = createIcon({
	path: (
		<path d="M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} />
	),
});

const ZOOM_LABELS = {
	'0.5': '50%',
	'1': '100%',
	'2': '200%',
	'4': '400%',
	fit: 'Fit width',
	screen: 'Fit screen',
} as const satisfies Record<Zoom, string>;

type ZoomControlProps = {
	isCompact: boolean;
	onZoom: (zoom: Zoom) => void;
	zoom: Zoom;
};

/** Zooms out and in a step at a time. The level between the steps returns to fit width. */
export function ZoomControl({ isCompact, onZoom, zoom }: ZoomControlProps) {
	const size = isCompact ? 'medium' : 'small';
	const zoomOut = stepZoom(zoom, -1);
	const zoomIn = stepZoom(zoom, 1);
	const label = ZOOM_LABELS[zoom];
	const isFit = zoom === 'fit';
	return (
		<div aria-label="Zoom" className={styles.differences} role="group">
			<IconButton
				aria-label={isCompact ? 'Zoom out' : 'Zoom out (−)'}
				className={styles.touchTarget}
				icon={<MinusIcon />}
				isDisabled={zoomOut === zoom}
				onPress={() => onZoom(zoomOut)}
				prominence="low"
				size={size}
			/>
			<Button
				aria-label={isFit ? `Zoom: ${label}` : `Zoom: ${label}. Reset to fit width`}
				className={cx(styles.touchTarget, styles.zoomLevel)}
				isDisabled={isFit}
				onPress={() => onZoom('fit')}
				prominence="low"
				size={size}
			>
				{label}
			</Button>
			<IconButton
				aria-label={isCompact ? 'Zoom in' : 'Zoom in (+)'}
				className={styles.touchTarget}
				icon="add"
				isDisabled={zoomIn === zoom}
				onPress={() => onZoom(zoomIn)}
				prominence="low"
				size={size}
			/>
		</div>
	);
}
