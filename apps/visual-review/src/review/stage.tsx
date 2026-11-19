import { cx } from '@luke-ui/react/utils';
import type { ReactNode, TouchEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import type { Capture, ImageKind } from '../report/schema.js';
import { imageSize, imageUrl } from '../report/schema.js';
import type { DiffRegion } from './diff-regions.js';
import { loadDiffRegions } from './diff-regions.js';
import { describeShare, describeSize } from './examples.js';
import * as overlayStyles from './overlays.css.js';
import type { Layout, Pane, Zoom } from './review-params.js';
import { PANES } from './review-params.js';
import * as styles from './section.css.js';

export const PANE_LABELS = {
	actual: 'Actual',
	diff: 'Diff',
	expected: 'Expected',
} as const satisfies Record<ImageKind, string>;

/** Height of a side-by-side figure caption (20px) and its gap (6px). */
const CAPTION_HEIGHT = 26;
/** A sideways swipe at least this long flips between Expected and Actual on a phone. */
const SWIPE_DISTANCE = 56;

/** The space a capture can take, measured from the page. */
export type StageMetrics = { availableWidth: number; gap: number; screenHeight: number };

/** How the capture in view is shown. Zoom and the stepped-to difference belong to one capture. */
export type CaptureView = { activeRegion: number | undefined; zoom: Zoom };

type StageProps = {
	activeRegion: number | undefined;
	baseUrl: string;
	capture: Capture;
	isChangedSinceViewed: boolean;
	isCompact: boolean;
	layout: Layout;
	metrics: StageMetrics;
	onFlip: (direction: -1 | 1) => void;
	onPane: (pane: Pane) => void;
	onZoom: (zoom: Zoom) => void;
	/** How much of the actual image shows over the expected one in the overlay, from 0 to 100. */
	opacity: number;
	pane: Pane;
	/** Outlined regions, or `undefined` while they load or when outlines are off. */
	regions: ReadonlyArray<DiffRegion> | undefined;
	zoom: Zoom;
};

/**
 * A capture on its neutral stage, one image at a time by default. On wider screens a quiet caption
 * names the image when it is not Actual, and shows the share, size, scale and an image switch on
 * hover or focus. On a phone the image runs edge to edge: a tap toggles fit and 100%, and a sideways
 * swipe flips between Expected and Actual.
 */
export function Stage(props: StageProps) {
	const { activeRegion, baseUrl, capture, isChangedSinceViewed, isCompact, metrics } = props;
	const { onFlip, onPane, onZoom, opacity, regions, zoom } = props;
	const width = capture.width ?? 400;
	const height = capture.height ?? 300;
	const isChanged = capture.status === 'changed';
	// An added or removed capture has one image, so it has nothing to compare.
	const layout: Layout = isChanged ? props.layout : 'single';
	const pane = paneFor(capture, props.pane);
	const { availableWidth, gap } = metrics;
	const scrollerRef = useRef<HTMLDivElement>(null);
	const touchStart = useRef<{ x: number; y: number } | undefined>(undefined);
	const anchor = useRef<
		{ clientX: number; clientY: number; ratioX: number; ratioY: number } | undefined
	>(undefined);

	// Phones show one image: side by side does not fit.
	const effectiveLayout: Layout = isCompact && layout === 'side' ? 'single' : layout;
	const isSide = effectiveLayout === 'side';
	// Side by side runs in columns when both images fit at full size, or for a tall capture that
	// stays readable at a third of its size.
	const columnFit = Math.min(1, (availableWidth - gap) / 2 / width);
	const isColumns =
		isSide &&
		(zoom === 'screen'
			? Math.min(columnFit, (metrics.screenHeight - CAPTION_HEIGHT) / height) >=
				Math.min(
					1,
					availableWidth / width,
					(metrics.screenHeight - 2 * CAPTION_HEIGHT - gap) / 2 / height,
				)
			: columnFit === 1 || (isTall(capture) && columnFit >= 0.3));

	const scale = (() => {
		if (zoom === 'fit') return isColumns ? columnFit : Math.min(1, availableWidth / width);
		if (zoom === 'screen') {
			const columnWidth = isColumns ? (availableWidth - gap) / 2 : availableWidth;
			const rows = isSide && !isColumns ? 2 : 1;
			const captions = isSide ? rows * CAPTION_HEIGHT : 0;
			const rowHeight = (metrics.screenHeight - captions - (rows - 1) * gap) / rows;
			return Math.min(1, columnWidth / width, rowHeight / height);
		}
		return Number(zoom);
	})();
	const box = { height: Math.floor(height * scale), scale, width: Math.floor(width * scale) };
	const image = { activeRegion, baseUrl, box, capture, regions };
	const details = [describeShare(capture), describeSize(capture), `${Math.round(scale * 100)}%`]
		.filter(Boolean)
		.join(' · ');

	const { content, label } = ((): { content: ReactNode; label: string } => {
		if (effectiveLayout === 'overlay') {
			return {
				content: (
					<div className={styles.overlayStack}>
						<CaptureImage
							{...image}
							className={styles.overlayLayer}
							kind="expected"
							regions={undefined}
						/>
						{/* The top layer carries the outlines, so they stay visible at every opacity. */}
						<CaptureImage
							{...image}
							className={styles.overlayLayer}
							kind="actual"
							opacity={opacity / 100}
						/>
					</div>
				),
				label: `Actual at ${opacity}% over expected`,
			};
		}
		if (effectiveLayout === 'side') {
			return {
				content: (
					<>
						<Figure label={PANE_LABELS.expected}>
							<CaptureImage {...image} kind="expected" />
						</Figure>
						<Figure label={PANE_LABELS.actual}>
							<CaptureImage {...image} kind="actual" />
						</Figure>
					</>
				),
				label: 'Side by side',
			};
		}
		return {
			content: <CaptureImage {...image} kind={pane} />,
			label: isChanged ? PANE_LABELS[pane] : `${PANE_LABELS[pane]}, ${capture.status}`,
		};
	})();
	// Actual is the default. Any other image always names itself, so it is never mistaken for it.
	// Side by side names each image in its own caption.
	const isNamed =
		effectiveLayout === 'overlay' ||
		(effectiveLayout === 'single' && (pane !== 'actual' || !isChanged));
	const isScrollable = box.width * (isColumns ? 2 : 1) + (isColumns ? gap : 0) > availableWidth;
	const isZoomed = zoom !== 'fit';

	// After a tap zooms in or out, keep the tapped point under the finger.
	useLayoutEffect(() => {
		const point = anchor.current;
		const scroller = scrollerRef.current;
		anchor.current = undefined;
		if (!point || !scroller) return;
		const rect = scroller.firstElementChild?.getBoundingClientRect();
		if (!rect) return;
		const scrollerRect = scroller.getBoundingClientRect();
		scroller.scrollLeft =
			rect.left -
			scrollerRect.left +
			scroller.scrollLeft +
			point.ratioX * rect.width -
			(point.clientX - scrollerRect.left);
		window.scrollBy({ top: rect.top + point.ratioY * rect.height - point.clientY });
	}, [box.width]);

	function toggleZoom(event: { clientX: number; clientY: number }) {
		const rect = scrollerRef.current?.firstElementChild?.getBoundingClientRect();
		if (rect && rect.width > 0) {
			anchor.current = {
				clientX: event.clientX,
				clientY: event.clientY,
				ratioX: clamp((event.clientX - rect.left) / rect.width),
				ratioY: clamp((event.clientY - rect.top) / rect.height),
			};
		}
		onZoom(isZoomed ? 'fit' : '1');
	}

	function handleTouchStart(event: TouchEvent) {
		const point = event.touches[0];
		touchStart.current =
			event.touches.length === 1 && point ? { x: point.clientX, y: point.clientY } : undefined;
	}

	function handleTouchEnd(event: TouchEvent) {
		const start = touchStart.current;
		const point = event.changedTouches[0];
		touchStart.current = undefined;
		if (!start || !point || !isChanged || isScrollable) return;
		const dx = point.clientX - start.x;
		const dy = point.clientY - start.y;
		if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 2) onFlip(dx > 0 ? -1 : 1);
	}

	return (
		<div className={styles.stage}>
			{isNamed ? (
				<span aria-hidden className={styles.chip}>
					{label}
				</span>
			) : null}
			<div className={styles.caption}>
				<span className={cx(styles.captionLabel, !isNamed && styles.onDemand)}>{label}</span>
				<span className={cx(styles.captionEnd, styles.onDemand)}>
					<span>{details}</span>
					{isChanged ? (
						<ToggleButtonGroup
							aria-label="Image"
							className={overlayStyles.segmented}
							disallowEmptySelection
							onSelectionChange={(keys) => {
								const [key] = keys;
								if (typeof key === 'string') onPane(key as Pane);
							}}
							selectedKeys={effectiveLayout === 'single' ? [pane] : []}
						>
							{PANES.map((id) => (
								<ToggleButton className={overlayStyles.segment} id={id} key={id}>
									{PANE_LABELS[id]}
								</ToggleButton>
							))}
						</ToggleButtonGroup>
					) : null}
				</span>
			</div>
			{/* A tap zooms on a phone. The keyboard has the zoom keys and the View options. */}
			{/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
			<div
				aria-label={`${label} screenshot of ${capture.id}${isChangedSinceViewed ? ', changed since viewed' : ''}`}
				className={cx(styles.scroller, isZoomed && styles.scrollerZoomed)}
				data-stage
				onClick={isCompact ? toggleZoom : undefined}
				onTouchEnd={isCompact ? handleTouchEnd : undefined}
				onTouchStart={isCompact ? handleTouchStart : undefined}
				ref={scrollerRef}
				role="region"
				// A capture wider than the stage scrolls, so the keyboard needs to reach it to pan.
				// oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
				tabIndex={isScrollable ? 0 : undefined}
			>
				<div className={cx(styles.comparison, isColumns && styles.comparisonColumns)}>
					{content}
				</div>
			</div>
		</div>
	);
}

/** The image a capture shows in the single layout: an added capture has only Actual. */
export function paneFor(capture: Capture, pane: Pane): Pane {
	if (capture.status === 'added') return 'actual';
	if (capture.status === 'removed') return 'expected';
	return pane;
}

/**
 * The regions where a changed capture differs, once it is near the viewport. A difference that
 * covers the whole image, such as a size change, has nothing to outline.
 */
export function useRegions(
	baseUrl: string,
	capture: Capture | undefined,
	isEnabled: boolean,
): ReadonlyArray<DiffRegion> | undefined {
	const [state, setState] = useState<{ id: string; regions: ReadonlyArray<DiffRegion> }>();
	useEffect(() => {
		if (!capture || !isEnabled || capture.status !== 'changed') return;
		let isActive = true;
		void loadDiffRegions(imageUrl(baseUrl, capture.id, 'diff')).then((diff) => {
			if (!isActive || !diff) return;
			const { height, regions, width } = diff;
			const isWhole = regions.some((region) => region.width * region.height > width * height * 0.8);
			setState({ id: capture.id, regions: isWhole ? [] : regions });
		});
		return () => {
			isActive = false;
		};
	}, [baseUrl, capture, isEnabled]);
	return state && state.id === capture?.id ? state.regions : undefined;
}

function Figure({ children, label }: { children: ReactNode; label: string }) {
	return (
		<figure className={styles.figure}>
			<figcaption className={styles.figcaption}>{label}</figcaption>
			{children}
		</figure>
	);
}

type CaptureImageProps = {
	activeRegion: number | undefined;
	baseUrl: string;
	box: { height: number; scale: number; width: number };
	capture: Capture;
	className?: string;
	kind: ImageKind;
	/** Fades the image, not the outlines drawn over it. */
	opacity?: number;
	regions: ReadonlyArray<DiffRegion> | undefined;
};

function CaptureImage(props: CaptureImageProps) {
	const { activeRegion, baseUrl, box, capture, className, kind, opacity, regions } = props;
	// The report's size is the larger of the two images, so it is this image's own size only when
	// they match. Otherwise the image keeps its natural size at the same scale, inside the frame.
	const ownSize = imageSize(capture, kind);
	const [naturalSize, setNaturalSize] = useState<{ height: number; width: number }>();
	const drawn = ownSize ?? naturalSize;
	const size = ownSize ?? {
		height: capture.height ?? 0,
		width: capture.width ?? 0,
	};
	return (
		<div
			className={cx(styles.frame, className)}
			data-kind={kind}
			// Reserved before the image loads, so stepping and loading never shift the page.
			style={{ blockSize: box.height, inlineSize: box.width }}
		>
			<img
				alt={`${PANE_LABELS[kind]} screenshot of ${capture.id}`}
				className={cx(styles.image, box.scale > 1 && styles.pixelated)}
				decoding="async"
				draggable={false}
				height={drawn ? Math.floor(drawn.height * box.scale) : undefined}
				loading="lazy"
				onLoad={(event) => {
					if (ownSize) return;
					const { naturalHeight, naturalWidth } = event.currentTarget;
					setNaturalSize({ height: naturalHeight, width: naturalWidth });
				}}
				src={imageUrl(baseUrl, capture.id, kind)}
				style={{ opacity }}
				width={drawn ? Math.floor(drawn.width * box.scale) : undefined}
			/>
			{size.width > 0 && size.height > 0
				? regions?.map((region, index) => (
						<span
							aria-hidden
							className={cx(
								styles.region,
								index === activeRegion && styles.regionActive,
								activeRegion !== undefined && index !== activeRegion && styles.regionMuted,
							)}
							data-active={index === activeRegion ? true : undefined}
							data-region={index}
							key={`${region.x}-${region.y}`}
							style={{
								blockSize: `${(region.height / size.height) * 100}%`,
								inlineSize: `${(region.width / size.width) * 100}%`,
								insetBlockStart: `${(region.y / size.height) * 100}%`,
								insetInlineStart: `${(region.x / size.width) * 100}%`,
							}}
						>
							{index === activeRegion ? (
								<span className={cx(styles.regionBadge, badgePlacement(region, size, box))}>
									{index + 1}
								</span>
							) : null}
						</span>
					))
				: null}
		</div>
	);
}

/** Room a difference's number needs beside its marker, in screen pixels. */
const BADGE_ROOM = 28;

/**
 * Where the active difference's number goes: above its marker, else beside it, else inside its
 * corner, so it never falls on a neighbouring marker or outside the capture.
 */
function badgePlacement(
	region: DiffRegion,
	size: { height: number; width: number },
	box: { height: number; width: number },
) {
	if ((region.y / size.height) * box.height >= BADGE_ROOM) return undefined;
	const after = ((size.width - region.x - region.width) / size.width) * box.width;
	return after >= BADGE_ROOM ? styles.regionBadgeAfter : styles.regionBadgeInside;
}

/** A capture at least 80% as tall as it is wide. */
function isTall(capture: Capture) {
	return (capture.height ?? 0) >= (capture.width ?? 1) * 0.8;
}

function clamp(value: number) {
	return Math.min(Math.max(value, 0), 1);
}
