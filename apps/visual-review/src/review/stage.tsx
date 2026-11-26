import { createIcon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import type { PointerEvent, Ref, RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Slider, SliderThumb, SliderTrack } from 'react-aria-components';
import type { Capture, ImageKind } from '../report/schema.js';
import { imageSize, imageUrl } from '../report/schema.js';
import type { DiffRegion } from './diff-regions.js';
import { loadDiffRegions } from './diff-regions.js';
import type { Layout, Zoom } from './review-params.js';
import * as styles from './section.css.js';

/** Two columns of dots, as on the docs examples' resize handle. */
const GripIcon = createIcon({
	path: (
		<>
			<path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
		</>
	),
});

const PANE_LABELS = {
	actual: 'After',
	diff: 'Diff',
	expected: 'Before',
} as const satisfies Record<ImageKind, string>;

/** The space a capture can take, measured from the page. */
export type StageMetrics = { availableWidth: number; screenHeight: number };

/** How the capture in view is shown. Zoom and the stepped-to difference belong to one capture. */
export type CaptureView = {
	activeRegion: number | undefined;
	highlight: boolean;
	layout: Layout;
	split: number;
	zoom: Zoom;
};

export type StageProps = {
	activeRegion: number | undefined;
	/** Set to the active difference's outline while it renders. */
	activeRegionRef: Ref<HTMLSpanElement>;
	baseUrl: string;
	capture: Capture;
	isChangedSinceViewed: boolean;
	layout: Layout;
	metrics: StageMetrics;
	onSplit: (split: number) => void;
	/** Outlined regions, or `undefined` while they load or when outlines are off. */
	regions: ReadonlyArray<DiffRegion> | undefined;
	/** The element that scrolls a capture wider than the stage sideways. */
	scrollerRef: RefObject<HTMLDivElement | null>;
	/** Where Compare's divider sits, as a percentage from the start: Expected before it, Actual after. */
	split: number;
	zoom: Zoom;
};

/** Actual at fit width, or Before and After with a movable divider in the same viewport. */
export function Stage(props: StageProps) {
	const { activeRegion, activeRegionRef, baseUrl, capture, isChangedSinceViewed, metrics } = props;
	const { onSplit, regions, scrollerRef, split, zoom } = props;
	const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>();
	const width = capture.width || naturalSize?.width || 400;
	const height = capture.height || naturalSize?.height || 300;
	const kind = capture.status === 'removed' ? 'expected' : 'actual';
	const { availableWidth } = metrics;
	const panStart = useRef<{ x: number; y: number } | undefined>(undefined);
	const [isPanning, setIsPanning] = useState(false);
	const [scrollLeft, setScrollLeft] = useState(0);
	const isCompare = capture.status === 'changed' && props.layout === 'compare';

	const scale = (() => {
		if (zoom === 'fit') return Math.min(1, availableWidth / width);
		if (zoom === 'screen')
			return Math.min(1, availableWidth / width, metrics.screenHeight / height);
		return Number(zoom);
	})();
	const box = { height: height * scale, scale, width: width * scale };
	const image = {
		activeRegion,
		baseUrl,
		box,
		capture,
		regions,
	};
	const label = (() => {
		if (isCompare) return 'Before and After';
		if (capture.status === 'removed') return 'Before · Removed';
		if (capture.status === 'added') return 'Actual · Added';
		return 'Actual';
	})();
	const isScrollable = box.width > availableWidth;
	const isPannable = isScrollable || box.height > metrics.screenHeight;
	const visibleWidth = Math.min(box.width, availableWidth);
	// The divider's grip starts at the middle of the part of the capture a screen can show.
	const handleOffset = Math.max(
		Math.min(box.height, metrics.screenHeight) / 2 - styles.HANDLE_HALF_PX,
		0,
	);
	// The divider stays in the visible viewport when zoomed captures are panned.
	let cut = scrollLeft + (visibleWidth * split) / 100;
	if (split === 0) cut = 0;
	else if (split === 100) cut = box.width;

	useLayoutEffect(() => {
		const scroller = scrollerRef.current;
		setScrollLeft(scroller ? scroller.scrollLeft : 0);
	}, [box.width, availableWidth, scrollerRef]);

	function handlePanStart(event: PointerEvent<HTMLDivElement>) {
		if (event.pointerType !== 'mouse' || event.button !== 0) return;
		panStart.current = { x: event.clientX, y: event.clientY };
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsPanning(true);
	}

	function handlePanMove(event: PointerEvent<HTMLDivElement>) {
		const last = panStart.current;
		if (!last) return;
		panStart.current = { x: event.clientX, y: event.clientY };
		event.currentTarget.scrollLeft -= event.clientX - last.x;
		window.scrollBy({ top: last.y - event.clientY });
	}

	function handlePanEnd(event: PointerEvent<HTMLDivElement>) {
		if (!panStart.current) return;
		panStart.current = undefined;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		setIsPanning(false);
	}

	return (
		<div className={styles.stage}>
			<div aria-hidden className={styles.compareLabels} style={{ inlineSize: visibleWidth }}>
				<span className={cx(styles.chip, styles.compareChip)}>{isCompare ? 'Before' : label}</span>
				{isCompare ? <span className={cx(styles.chip, styles.compareChip)}>After</span> : null}
			</div>
			{/* Mouse drag supplements the scroller's native keyboard and touch panning. */}
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
			<div
				aria-label={`${label} screenshot of ${capture.id}${isChangedSinceViewed ? ', changed since viewed' : ''}`}
				className={cx(
					styles.scroller,
					isPannable && (isPanning ? styles.scrollerGrabbing : styles.scrollerGrab),
				)}
				dir="ltr"
				onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
				onDragStart={isPannable ? (event) => event.preventDefault() : undefined}
				onLostPointerCapture={isPannable ? handlePanEnd : undefined}
				onPointerCancel={isPannable ? handlePanEnd : undefined}
				onPointerDown={isPannable ? handlePanStart : undefined}
				onPointerMove={isPannable ? handlePanMove : undefined}
				onPointerUp={isPannable ? handlePanEnd : undefined}
				ref={scrollerRef}
				role="region"
				// oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
				tabIndex={isScrollable ? 0 : undefined}
			>
				<div className={cx(styles.comparison, styles.compareStack)} dir="ltr">
					{isCompare ? (
						<CaptureImage
							{...image}
							className={styles.compareLayer}
							activeRegionRef={undefined}
							isEager
							key="before"
							kind="expected"
							regions={undefined}
						/>
					) : null}
					<CaptureImage
						{...image}
						className={styles.compareLayer}
						activeRegionRef={activeRegionRef}
						clipStart={isCompare ? cut : undefined}
						key={kind}
						kind={kind}
						onNaturalSize={setNaturalSize}
					/>
				</div>
			</div>
			{isCompare ? (
				<Slider
					aria-label="Before and After divider"
					className={styles.divider}
					formatOptions={{ maximumFractionDigits: 0, style: 'unit', unit: 'percent' }}
					maxValue={100}
					minValue={0}
					onChange={(value) => onSplit(Array.isArray(value) ? (value[0] ?? 50) : value)}
					style={{ height: box.height, width: visibleWidth }}
					value={split}
				>
					<SliderTrack className={styles.dividerTrack} dir="ltr">
						<SliderThumb className={styles.dividerThumb}>
							<span
								aria-hidden
								className={styles.dividerHandle}
								style={{ marginBlockStart: handleOffset }}
							>
								<GripIcon className={styles.dividerGrip} />
							</span>
						</SliderThumb>
					</SliderTrack>
				</Slider>
			) : null}
		</div>
	);
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

type CaptureImageProps = {
	activeRegion: number | undefined;
	activeRegionRef: Ref<HTMLSpanElement> | undefined;
	baseUrl: string;
	box: { height: number; scale: number; width: number };
	capture: Capture;
	className?: string;
	/** Hides the image, not the outlines drawn over it, up to this distance from the start in pixels. */
	clipStart?: number | undefined;
	isEager?: boolean;
	kind: ImageKind;
	onNaturalSize?: (size: { width: number; height: number }) => void;
	regions: ReadonlyArray<DiffRegion> | undefined;
};

function CaptureImage(props: CaptureImageProps) {
	const { activeRegion, activeRegionRef, baseUrl, box, capture, className, clipStart, kind } =
		props;
	const { isEager, onNaturalSize, regions } = props;
	// The report's size is the larger of the two images, so it is this image's own size only when
	// they match. Otherwise the image keeps its natural size at the same scale, inside the frame.
	const ownSize = imageSize(capture, kind);
	const [naturalSize, setNaturalSize] = useState<{ height: number; width: number }>();
	const drawn = ownSize ?? naturalSize;
	const size = {
		height: capture.height ?? 0,
		width: capture.width ?? 0,
	};
	// In pixels of the frame, so the cut lines up with the divider when the images differ in size.
	const clip = clipStart === undefined ? undefined : { clipPath: `inset(0 0 0 ${clipStart}px)` };
	return (
		<div
			className={cx(styles.frame, className)}
			// Reserved before the image loads, so stepping and loading never shift the page.
			style={{ blockSize: box.height, inlineSize: box.width }}
		>
			{/* Past the divider, where this image is smaller than the frame, the space reads as empty
			    rather than showing the image underneath, so growth and shrinkage stay visible. */}
			{clip ? <span aria-hidden className={styles.compareBlank} style={clip} /> : null}
			<img
				alt={`${clipStart === undefined && kind === 'actual' ? 'Actual' : PANE_LABELS[kind]} screenshot of ${capture.id}`}
				className={cx(
					styles.image,
					clip && styles.imageOverBlank,
					box.scale > 1 && styles.pixelated,
				)}
				decoding="async"
				draggable={false}
				height={drawn?.height}
				loading={isEager ? 'eager' : 'lazy'}
				onLoad={(event) => {
					if (ownSize) return;
					const { naturalHeight, naturalWidth } = event.currentTarget;
					const dimensions = { height: naturalHeight, width: naturalWidth };
					setNaturalSize(dimensions);
					onNaturalSize?.(dimensions);
				}}
				src={imageUrl(baseUrl, capture.id, kind)}
				style={{
					...clip,
					blockSize: drawn && drawn.height * box.scale,
					inlineSize: drawn && drawn.width * box.scale,
				}}
				width={drawn?.width}
			/>
			{size.width > 0 && size.height > 0
				? regions?.map((region, index) => (
						<RegionOutline
							box={box}
							index={index}
							isActive={index === activeRegion}
							isMuted={activeRegion !== undefined && index !== activeRegion}
							key={`${region.x}-${region.y}`}
							ref={index === activeRegion ? activeRegionRef : undefined}
							region={region}
							size={size}
						/>
					))
				: null}
		</div>
	);
}

type RegionOutlineProps = {
	box: { height: number; width: number };
	index: number;
	isActive: boolean;
	isMuted: boolean;
	ref: Ref<HTMLSpanElement> | undefined;
	region: DiffRegion;
	size: { height: number; width: number };
};

/** One difference's outline, with its number while it is the active one. */
function RegionOutline({ box, index, isActive, isMuted, ref, region, size }: RegionOutlineProps) {
	return (
		<span
			aria-hidden
			className={cx(styles.region, isActive && styles.regionActive, isMuted && styles.regionMuted)}
			ref={ref}
			style={{
				blockSize: `${(region.height / size.height) * 100}%`,
				inlineSize: `${(region.width / size.width) * 100}%`,
				insetBlockStart: `${(region.y / size.height) * 100}%`,
				insetInlineStart: `${(region.x / size.width) * 100}%`,
			}}
		>
			{isActive ? (
				<span className={cx(styles.regionBadge, badgePlacement(region, size, box))}>
					{index + 1}
				</span>
			) : null}
		</span>
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
