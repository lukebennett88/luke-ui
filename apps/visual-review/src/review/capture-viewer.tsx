import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { Suspense, use, useId } from 'react';
import type { Capture, ImageKind } from '../report/schema.js';
import { imageSize, imageUrl } from '../report/schema.js';
import { loadDiffRegions } from './diff-regions.js';
import type { ReviewParams, ViewMode, Zoom } from './review-params.js';
import { STATUS_LABELS, VIEW_MODES, ZOOM_LEVELS } from './review-params.js';
import * as styles from './review.css.js';

const VIEW_LABELS = {
	diff: 'Diff',
	overlay: 'Overlay',
	side: 'Side by side',
} as const satisfies Record<ViewMode, string>;

const IMAGE_LABELS = {
	actual: 'Actual',
	diff: 'Diff',
	expected: 'Expected',
} as const satisfies Record<ImageKind, string>;

/** Width over height from which a capture counts as wide. */
const WIDE_ASPECT_RATIO = 2;

const ZOOM_ITEMS = ZOOM_LEVELS.map((zoom) => ({
	id: zoom,
	label: zoom === 'fit' ? 'Fit' : `${Number(zoom) * 100}%`,
}));

type CaptureViewerProps = {
	baseUrl: string;
	capture: Capture;
	onOpacityChange: (opacity: number) => void;
	onParamsChange: (updates: Record<string, string | undefined>) => void;
	onStep: (offset: number) => void;
	/** How much of the actual image shows over the expected one in the overlay, from 0 to 100. */
	opacity: number;
	params: ReviewParams;
	position: { index: number; total: number };
};

export function CaptureViewer(props: CaptureViewerProps) {
	const { baseUrl, capture, onOpacityChange, onParamsChange, onStep, opacity, params, position } =
		props;
	const opacityId = useId();
	const isComparable = capture.status === 'changed';

	return (
		<section aria-label="Comparison" className={styles.viewer}>
			<div className={styles.toolbar}>
				<Stack gap="space.8" minInlineSize="0">
					<Heading level={2} typography="heading4">
						{capture.id}
					</Heading>
					<Text color="secondary" typography="caption">
						{describeCapture(capture)}
					</Text>
				</Stack>
				<Cluster alignItems="flex-end" gap="space.16">
					{isComparable ? (
						<RadioGroup
							aria-label="View"
							onChange={(view) => onParamsChange({ view: view === 'side' ? undefined : view })}
							orientation="horizontal"
							size="small"
							value={params.view}
						>
							{VIEW_MODES.map((view) => (
								<RadioField key={view} label={VIEW_LABELS[view]} value={view} />
							))}
						</RadioGroup>
					) : null}
					{isComparable && params.view === 'overlay' ? (
						<div className={styles.opacityField}>
							<label htmlFor={opacityId}>
								<Text typography="label">Actual</Text>
							</label>
							<input
								className={styles.opacityInput}
								id={opacityId}
								max={100}
								min={0}
								onChange={(event) => onOpacityChange(event.target.valueAsNumber)}
								type="range"
								value={opacity}
							/>
						</div>
					) : null}
					{isComparable ? (
						<CheckboxField
							isSelected={params.highlight}
							label="Outline differences"
							onChange={(isSelected) =>
								onParamsChange({ highlight: isSelected ? undefined : 'off' })
							}
							size="small"
						/>
					) : null}
					<SelectField
						aria-label="Zoom"
						className={styles.zoomField}
						items={ZOOM_ITEMS}
						onChange={(zoom) => onParamsChange({ zoom: zoom === 'fit' ? undefined : String(zoom) })}
						size="small"
						value={params.zoom}
					>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectField>
					<Cluster gap="space.4">
						<IconButton
							aria-label="Previous capture"
							icon="chevronUp"
							onPress={() => onStep(-1)}
							prominence="low"
							size="small"
						/>
						<Text color="secondary" fontVariantNumeric="tabular-nums" typography="caption">
							{position.index + 1} of {position.total}
						</Text>
						<IconButton
							aria-label="Next capture"
							icon="chevronDown"
							onPress={() => onStep(1)}
							prominence="low"
							size="small"
						/>
					</Cluster>
				</Cluster>
			</div>
			{/* Focusable so the keyboard can scroll a comparison larger than the stage in every browser. */}
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
			<div aria-label="Screenshots" className={styles.stage} role="region" tabIndex={0}>
				<Comparison
					baseUrl={baseUrl}
					capture={capture}
					key={capture.id}
					opacity={opacity}
					shouldHighlight={params.highlight}
					view={params.view}
					zoom={params.zoom}
				/>
			</div>
		</section>
	);
}

type ComparisonProps = {
	baseUrl: string;
	capture: Capture;
	opacity: number;
	shouldHighlight: boolean;
	view: ViewMode;
	zoom: Zoom;
};

function Comparison(props: ComparisonProps) {
	const { baseUrl, capture, opacity, shouldHighlight, view, zoom } = props;
	const image = { baseUrl, capture, shouldHighlight, zoom };

	if (capture.status === 'added') return <LabelledImage {...image} kind="actual" />;
	if (capture.status === 'removed') return <LabelledImage {...image} kind="expected" />;
	if (view === 'diff') return <LabelledImage {...image} kind="diff" />;
	if (view === 'overlay') {
		return (
			<div className={styles.overlay}>
				<CaptureImage {...image} kind="expected" shouldHighlight={false} />
				{/* The top layer carries the outlines, so they stay visible at every opacity. */}
				<CaptureImage {...image} kind="actual" opacity={opacity / 100} />
			</div>
		);
	}
	return (
		<div
			className={cx(
				styles.sideBySide,
				zoom !== 'fit' && styles.sideBySideFixed,
				isWide(capture) && styles.sideBySideStacked,
			)}
		>
			<LabelledImage {...image} kind="expected" />
			<LabelledImage {...image} kind="actual" />
		</div>
	);
}

type CaptureImageProps = {
	baseUrl: string;
	capture: Capture;
	kind: ImageKind;
	/** Fades the image, not the outlines drawn over it. */
	opacity?: number;
	shouldHighlight: boolean;
	zoom: Zoom;
};

function LabelledImage(props: CaptureImageProps) {
	return (
		<figure className={styles.figure}>
			<Text color="secondary" elementType="figcaption" fontWeight="label" typography="label">
				{IMAGE_LABELS[props.kind]}
			</Text>
			<CaptureImage {...props} />
		</figure>
	);
}

function CaptureImage(props: CaptureImageProps) {
	const { baseUrl, capture, kind, opacity, shouldHighlight, zoom } = props;
	const scale = zoom === 'fit' ? undefined : Number(zoom);
	// A known size reserves the image's space before it loads, so stepping does not shift the page.
	const size = imageSize(capture, kind);
	return (
		<div className={styles.imageFrame} style={{ zoom: scale }}>
			<img
				alt={`${IMAGE_LABELS[kind]} screenshot of ${capture.id}`}
				className={cx(
					styles.image,
					scale === undefined && styles.imageFit,
					scale !== undefined && scale > 1 && styles.imagePixelated,
				)}
				draggable={false}
				height={size?.height}
				src={imageUrl(baseUrl, capture.id, kind)}
				style={{ opacity }}
				width={size?.width}
			/>
			{shouldHighlight && capture.status === 'changed' ? (
				<Suspense>
					<RegionOutlines diffUrl={imageUrl(baseUrl, capture.id, 'diff')} />
				</Suspense>
			) : null}
		</div>
	);
}

/** Outlines each differing region of the image it is drawn over. */
function RegionOutlines({ diffUrl }: { diffUrl: string }) {
	const diff = use(loadDiffRegions(diffUrl));
	if (!diff) return null;
	const { height, regions, width } = diff;
	// A difference covering the whole image, such as a size change, needs no outline.
	if (regions.some((region) => region.width * region.height > width * height * 0.8)) return null;

	return regions.map((region) => (
		<span
			aria-hidden
			className={styles.region}
			key={`${region.x}-${region.y}`}
			style={{
				blockSize: `${(region.height / height) * 100}%`,
				inlineSize: `${(region.width / width) * 100}%`,
				insetBlockStart: `${(region.y / height) * 100}%`,
				insetInlineStart: `${(region.x / width) * 100}%`,
			}}
		/>
	));
}

/**
 * A wide, short capture loses most of its detail in half the stage, so its two images stack. Each
 * keeps the full width and the difference sits directly above and below.
 */
function isWide(capture: Capture) {
	if (capture.width === undefined || capture.height === undefined) return false;
	return capture.width >= capture.height * WIDE_ASPECT_RATIO;
}

function describeCapture(capture: Capture) {
	const parts: Array<string> = [STATUS_LABELS[capture.status]];
	if (capture.width !== undefined && capture.height !== undefined) {
		parts.push(`${capture.width} × ${capture.height} px`);
		if (capture.mismatchedPixels !== undefined && capture.status === 'changed') {
			const total = capture.width * capture.height;
			const share = total === 0 ? 0 : (capture.mismatchedPixels / total) * 100;
			parts.push(
				`${capture.mismatchedPixels.toLocaleString('en')} px differ (${formatShare(share)})`,
			);
		}
	}
	const { actualViewport, expectedViewport } = capture;
	if (actualViewport && expectedViewport && actualViewport !== expectedViewport) {
		parts.push(`viewport ${expectedViewport} → ${actualViewport}`);
	}
	return parts.join(' · ');
}

function formatShare(share: number) {
	if (share === 0) return '0%';
	return share < 0.01 ? 'under 0.01%' : `${share.toFixed(2)}%`;
}
