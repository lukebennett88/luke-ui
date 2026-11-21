import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { SwitchField } from '@luke-ui/react/switch-field';
import type { ReactNode } from 'react';
import {
	Button as AriaButton,
	Disclosure,
	DisclosurePanel,
	Label,
	Slider,
	SliderOutput,
	SliderThumb,
	SliderTrack,
	ToggleButton,
	ToggleButtonGroup,
} from 'react-aria-components';
import type { Capture } from '../report/schema.js';
import { describeShare, describeSize } from './examples.js';
import * as styles from './overlays.css.js';
import type { Layout, Pane, Zoom } from './review-params.js';
import { FIXED_ZOOMS, LAYOUTS, PANES } from './review-params.js';
import { PANE_LABELS } from './stage.js';

const LAYOUT_LABELS = {
	overlay: 'Overlay',
	side: 'Side by side',
	single: 'One image',
} as const satisfies Record<Layout, string>;

const KEYS = {
	actual: '2',
	diff: '3',
	expected: '1',
	overlay: 'o',
	side: 's',
	single: undefined,
} as const satisfies Record<Layout | Pane, string | undefined>;

const SHORTCUTS = [
	['j k', 'Next, previous example'],
	['[ ]', 'Previous, next theme'],
	['v', 'Toggle viewed'],
	['u', 'Next unviewed'],
	['d D', 'Next, previous difference'],
	['1 2 3', 'Expected, actual, diff'],
	['← →', 'Flip expected, actual'],
	['s o', 'Side by side, overlay'],
	['h', 'Outlines'],
	['f 0', 'Fit screen, fit width'],
	['+ −', 'Zoom'],
	['t /', 'Contents, filter'],
] as const;

type PaneSwitchProps = {
	areKeysHidden: boolean;
	className?: string;
	layout: Layout;
	onPane: (pane: Pane) => void;
	pane: Pane;
};

/** Expected, Actual, or Diff. Nothing is selected while a layout shows two images. */
export function PaneSwitch({ areKeysHidden, className, layout, onPane, pane }: PaneSwitchProps) {
	return (
		<ToggleButtonGroup
			aria-label="Image"
			className={`${styles.segmented} ${styles.segmentedFill}${className ? ` ${className}` : ''}`}
			disallowEmptySelection
			onSelectionChange={(keys) => {
				const [key] = keys;
				if (typeof key === 'string') onPane(key as Pane);
			}}
			selectedKeys={layout === 'single' ? [pane] : []}
		>
			{PANES.map((id) => (
				<ToggleButton className={styles.segment} id={id} key={id}>
					<span>{PANE_LABELS[id]}</span>
					<ShortcutHint isHidden={areKeysHidden} keys={KEYS[id]} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

/** What the View button names: the image on screen, or the layout. */
export function showingLabel(layout: Layout, pane: Pane): string {
	return layout === 'single' ? PANE_LABELS[pane] : LAYOUT_LABELS[layout];
}

type ViewOptionsProps = {
	areShortcutsEnabled: boolean;
	capture: Capture | undefined;
	/** Actions for the example in view, shown in the phone's View sheet. */
	exampleActions?: ReactNode;
	isCompact: boolean;
	layout: Layout;
	onLayout: (layout: Layout) => void;
	onOpacity: (opacity: number) => void;
	onOutlines: (isOn: boolean) => void;
	onPane: (pane: Pane) => void;
	onShortcuts: (isEnabled: boolean) => void;
	onZoom: (zoom: Zoom) => void;
	opacity: number;
	pane: Pane;
	shouldOutline: boolean;
	/** The capture in view, such as `primary · Paper dark`. */
	target: string;
	zoom: Zoom;
};

/**
 * Everything about how the capture in view is shown, behind one View button. The button names the
 * image on screen, so no image needs a caption to say which it is.
 */
export function ViewOptions(props: ViewOptionsProps) {
	const { areShortcutsEnabled, capture, exampleActions, isCompact, layout, opacity, pane } = props;
	const { onLayout, onOpacity, onOutlines, onPane, onShortcuts, onZoom } = props;
	const { shouldOutline, target, zoom } = props;
	const isFixed = zoom !== 'fit' && zoom !== 'screen';
	const size = isCompact ? 'medium' : 'small';
	// Phones have no keyboard, and keys that are off do nothing.
	const areKeysHidden = isCompact || !areShortcutsEnabled;

	return (
		<Box className={styles.options} display="grid" gap="space.16">
			{/* A phone has the image switch in its bottom bar, beside the image it acts on. */}
			{isCompact ? null : (
				<PaneSwitch areKeysHidden={areKeysHidden} layout={layout} onPane={onPane} pane={pane} />
			)}
			<RadioGroup
				label="Layout"
				onChange={(value) => onLayout(LAYOUTS.find((mode) => mode === value) ?? 'single')}
				size={size}
				value={layout}
			>
				{/* A phone shows one image at a time: side by side does not fit. */}
				{LAYOUTS.filter((mode) => !isCompact || mode !== 'side').map((mode) => (
					<RadioField
						key={mode}
						label={
							<span className={styles.optionLabel}>
								<span>{LAYOUT_LABELS[mode]}</span>
								<ShortcutHint isHidden={areKeysHidden} keys={KEYS[mode]} />
							</span>
						}
						value={mode}
					/>
				))}
			</RadioGroup>
			{layout === 'overlay' ? (
				<Slider
					className={styles.slider}
					maxValue={100}
					minValue={0}
					onChange={(value) => onOpacity(Array.isArray(value) ? (value[0] ?? 0) : value)}
					value={opacity}
				>
					<Label className={styles.sliderLabel}>Actual opacity</Label>
					<SliderOutput />
					<SliderTrack className={styles.sliderTrack}>
						<SliderThumb className={styles.sliderThumb} />
					</SliderTrack>
				</Slider>
			) : null}
			<SwitchField
				isSelected={shouldOutline}
				label={
					<span className={styles.optionLabel}>
						<span>Outline differences</span>
						<ShortcutHint isHidden={areKeysHidden} keys="h" />
					</span>
				}
				onChange={onOutlines}
				size={size}
			/>
			<RadioGroup
				description={target ? `Applies to ${target}` : undefined}
				label="Size"
				onChange={(value) => onZoom(value === 'screen' ? 'screen' : 'fit')}
				size={size}
				value={isFixed ? null : zoom}
			>
				<RadioField
					label={
						<span className={styles.optionLabel}>
							<span>Fit width</span>
							<ShortcutHint isHidden={areKeysHidden} keys="0" />
						</span>
					}
					value="fit"
				/>
				<RadioField
					label={
						<span className={styles.optionLabel}>
							<span>Fit screen</span>
							<ShortcutHint isHidden={areKeysHidden} keys="f" />
						</span>
					}
					value="screen"
				/>
			</RadioGroup>
			<ToggleButtonGroup
				aria-label="Zoom"
				className={styles.segmented}
				onSelectionChange={(keys) => {
					const [key] = keys;
					const level = FIXED_ZOOMS.find((value) => value === key);
					if (level) onZoom(level);
				}}
				selectedKeys={isFixed ? [zoom] : []}
			>
				{FIXED_ZOOMS.map((level) => (
					<ToggleButton className={styles.segment} id={level} key={level}>
						{`${Number(level) * 100}%`}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
			{capture ? (
				<p className={styles.details}>
					{[
						capture.status === 'changed'
							? `${describeShare(capture)} of pixels differ`
							: describeShare(capture),
						describeSize(capture),
					]
						.filter(Boolean)
						.join(' · ')}
				</p>
			) : null}
			{exampleActions}
			{/* A phone can have a keyboard too, so the switch that turns shortcuts off stays. */}
			<SwitchField
				isSelected={areShortcutsEnabled}
				label="Single-key shortcuts"
				onChange={onShortcuts}
				size={isCompact ? 'medium' : 'small'}
			/>
			{isCompact ? null : (
				<>
					{areShortcutsEnabled ? (
						<Box
							display="grid"
							gap="space.8"
							renderRoot={(domProps) => <Disclosure {...domProps} />}
						>
							<AriaButton className={styles.shortcutsTrigger} slot="trigger">
								All shortcuts
								<Icon className={styles.shortcutsChevron} name="chevronDown" size="xsmall" />
							</AriaButton>
							<DisclosurePanel>
								<dl className={styles.shortcutList}>
									{SHORTCUTS.map(([keys, label]) => (
										<div key={keys} style={{ display: 'contents' }}>
											<dt className={styles.shortcutKeys}>
												<Kbd>{keys}</Kbd>
											</dt>
											<dd className={styles.shortcutLabel}>{label}</dd>
										</div>
									))}
								</dl>
							</DisclosurePanel>
						</Box>
					) : null}
				</>
			)}
		</Box>
	);
}

function ShortcutHint({ isHidden, keys }: { isHidden: boolean; keys: string | undefined }) {
	if (isHidden || !keys) return null;
	return <Kbd aria-hidden>{keys}</Kbd>;
}
