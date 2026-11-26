import { Box } from '@luke-ui/react/box';
import { Button, buttonRecipe } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { useEffectEvent, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import {
	Button as AriaButton,
	Disclosure,
	DisclosurePanel,
	Tab,
	TabList,
	TabPanel,
	Tabs,
} from 'react-aria-components';
import type { Capture } from '../report/schema.js';
import * as contentsStyles from './contents.css.js';
import type { Example } from './examples.js';
import { hasThemes, themeLabel } from './examples.js';
import { useNearViewport } from './layout-hooks.js';
import type { Zoom } from './review-params.js';
import type { ReviewState } from './review-state.js';
import { touchTarget } from './review.css.js';
import type { CapturePosition } from './scroll-position.js';
import {
	capturePosition,
	restoreCapturePosition,
	scrollDifferenceIntoView,
	scrollToSection,
} from './scroll-position.js';
import * as styles from './section.css.js';
import type { SeenState } from './seen-store.js';
import type { CaptureView, StageMetrics } from './stage.js';
import { Stage, useRegions } from './stage.js';
import { DiffStepper, ZoomControl } from './top-bar-parts.js';

export const SEEN_STATE_TEXT = {
	changed: 'changed since viewed',
	seen: 'viewed',
	unseen: 'not viewed',
} as const satisfies Record<SeenState, string>;

/** What the review reads from a rendered section. */
export type ExampleSectionHandle = {
	/** Where the section and its capture are now, for Undo to come back to. */
	position: () => CapturePosition;
};

type ExampleSectionProps = {
	/** The theme on screen. */
	active: Capture;
	baseUrl: string;
	example: Example;
	isCompact: boolean;
	isCurrent: boolean;
	isOpen: boolean;
	metrics: StageMetrics;
	onCompare: () => void;
	onOpenChange: (isOpen: boolean) => void;
	/** The section has moved, or taken focus, for the request numbered `seq`. */
	onRevealed: (seq: number) => void;
	onSelectTheme: (captureId: string) => void;
	/** Steps to the next or previous of the theme on screen's `count` differences. */
	onStepDifference: (offset: number, count: number) => void;
	onSplit: (split: number) => void;
	onViewedChange: (isViewed: boolean) => void;
	onZoom: (zoom: Zoom) => void;
	ref: Ref<ExampleSectionHandle>;
	/** A request to bring this section, or a difference in it, into view. */
	reveal: ReviewState['reveal'];
	stateOf: (capture: Capture) => SeenState;
	view: CaptureView;
};

/** One disclosure for the example, with the selected theme’s inspection controls and capture. */
export function ExampleSection({ ref, ...props }: ExampleSectionProps) {
	const { active, baseUrl, example, isCompact, isCurrent, isOpen } = props;
	const { onOpenChange, onSelectTheme, onStepDifference, reveal, stateOf, view } = props;
	const sectionRef = useRef<HTMLElement>(null);
	const headRef = useRef<HTMLDivElement>(null);
	const toggleRef = useRef<HTMLElement>(null);
	const scrollerRef = useRef<HTMLDivElement>(null);
	const activeRegionRef = useRef<HTMLSpanElement>(null);
	const toggleId = useId();
	const isNear = useNearViewport(sectionRef);
	const regions = useRegions(baseUrl, active, isNear && isOpen);
	const hasTabs = example.captures.length > 1;
	const onRevealed = useEffectEvent(props.onRevealed);

	useImperativeHandle(ref, () => ({
		position: () => capturePosition(sectionRef.current, scrollerRef.current),
	}));

	// Checked after every render: a difference's outline can appear renders after the request, once
	// the example opens and its regions load.
	useLayoutEffect(() => {
		const section = sectionRef.current;
		if (!reveal || !section) return;
		const { seq, target } = reveal;
		if (target.kind === 'difference') {
			const outline = activeRegionRef.current;
			if (!outline) return;
			scrollDifferenceIntoView(outline, {
				head: headRef.current,
				section,
				stage: scrollerRef.current,
			});
		} else {
			if (target.restore) restoreCapturePosition(section, scrollerRef.current, target.restore);
			else if (target.shouldScroll) scrollToSection(section);
			if (target.shouldFocus) toggleRef.current?.focus({ preventScroll: true });
		}
		onRevealed(seq);
	});

	const stage = (
		<Stage
			activeRegion={view.activeRegion}
			activeRegionRef={activeRegionRef}
			baseUrl={baseUrl}
			capture={active}
			isChangedSinceViewed={stateOf(active) === 'changed'}
			key={active.id}
			layout={view.layout}
			metrics={props.metrics}
			onSplit={props.onSplit}
			regions={view.highlight ? regions : undefined}
			scrollerRef={scrollerRef}
			split={view.split}
			zoom={view.zoom}
		/>
	);

	const body = (
		<Disclosure isExpanded={isOpen} onExpandedChange={onOpenChange}>
			<Box
				backgroundColor="surface.subdued"
				className={cx(styles.head, !isOpen && styles.headCollapsed)}
				ref={headRef}
			>
				<h2 className={styles.name}>
					<Lockup
						className={buttonRecipe({
							className: styles.nameButton,
							prominence: 'low',
							size: 'small',
						})}
						railAlignment="center"
						ref={toggleRef}
						renderRoot={(domProps) => {
							return <AriaButton {...domProps} id={toggleId} slot="trigger" />;
						}}
					>
						<LockupRail elementType="span">
							<Icon className={styles.chevron} name="chevronDown" size="xsmall" />
						</LockupRail>
						<LockupBody elementType="span">
							<Text
								color={isOpen ? undefined : 'secondary'}
								elementType="span"
								fontWeight="heading"
								lineClamp
								typography="label"
							>
								{example.component} / {example.name}
								{!hasTabs && hasThemes(example) ? ` · ${themeLabel(active)}` : null}
							</Text>
							{isCurrent ? <VisuallyHidden> (in view)</VisuallyHidden> : null}
						</LockupBody>
					</Lockup>
				</h2>
				{isOpen && hasTabs ? (
					<ScrollFade aria-label={`${example.name} themes, scrollable`} className={styles.tabsFade}>
						<TabList aria-label={`${example.name} themes`} className={styles.tabList}>
							{example.captures.map((capture) => (
								<ThemeTab
									capture={capture}
									isSelected={capture.id === active.id}
									key={capture.id}
									state={stateOf(capture)}
								/>
							))}
						</TabList>
					</ScrollFade>
				) : null}
				{/* Viewed or not, open or folded, the same button marks the theme on screen. */}
				<Box className={styles.headActions}>
					<Button
						aria-label={`${stateOf(active) === 'seen' ? 'Mark not viewed' : 'Mark viewed'} ${example.name}${hasThemes(example) ? ` ${themeLabel(active)}` : ''}`}
						className={touchTarget}
						isDisabled={!active.fingerprint}
						onPress={() => props.onViewedChange(stateOf(active) !== 'seen')}
						prominence="low"
						size={isCompact ? 'medium' : 'small'}
					>
						{stateOf(active) === 'seen' ? 'Mark not viewed' : 'Mark viewed'}
					</Button>
				</Box>
				{isOpen ? (
					<Box
						alignItems="center"
						className={styles.inspection}
						display="flex"
						flexWrap="wrap"
						gap="space.8"
						role="group"
						aria-label={`Inspect ${example.name}`}
					>
						{active.status === 'changed' ? (
							<Button
								aria-pressed={view.layout === 'compare'}
								className={touchTarget}
								onPress={props.onCompare}
								prominence={view.layout === 'compare' ? 'standard' : 'low'}
								size={isCompact ? 'medium' : 'small'}
							>
								Compare
							</Button>
						) : null}
						<ZoomControl isCompact={isCompact} onZoom={props.onZoom} zoom={view.zoom} />
						{regions?.length === 1 ? (
							<Button
								className={touchTarget}
								onPress={() => onStepDifference(1, 1)}
								prominence="low"
								size={isCompact ? 'medium' : 'small'}
							>
								Jump to change
							</Button>
						) : null}
						{regions && regions.length > 1 ? (
							<DiffStepper
								active={view.activeRegion}
								isCompact={isCompact}
								onStep={(offset) => onStepDifference(offset, regions.length)}
								regions={regions}
							/>
						) : null}
					</Box>
				) : null}
			</Box>
			<DisclosurePanel className={styles.disclosurePanel}>
				{isOpen && hasTabs ? (
					<TabPanel className={styles.panel} id={active.id} key={active.id}>
						{stage}
					</TabPanel>
				) : null}
				{isOpen && !hasTabs ? stage : null}
			</DisclosurePanel>
		</Disclosure>
	);

	return (
		<section
			aria-labelledby={toggleId}
			className={cx(styles.section, !isOpen && styles.sectionCollapsed)}
			ref={sectionRef}
		>
			{hasTabs ? (
				<Tabs onSelectionChange={(key) => onSelectTheme(String(key))} selectedKey={active.id}>
					{body}
				</Tabs>
			) : (
				body
			)}
		</section>
	);
}

function ThemeTab({
	capture,
	isSelected,
	state,
}: {
	capture: Capture;
	isSelected: boolean;
	state: SeenState;
}) {
	let mark: ReactNode = null;
	if (state === 'seen') mark = <Icon name="check" size="xsmall" />;
	if (state === 'changed') mark = <span aria-hidden className={contentsStyles.changedDot} />;
	return (
		<Tab
			className={buttonRecipe({
				prominence: 'low',
				size: 'small',
				className: styles.tab,
			})}
			// The recipe draws its pressed finish from data-pressed, which React Aria only sets while a
			// press is held. A selected tab keeps it.
			render={(domProps) => {
				const pressed = isSelected ? { 'data-pressed': 'true' } : {};
				return <div {...(domProps as ComponentProps<'div'>)} {...pressed} />;
			}}
			data-state={state}
			id={capture.id}
		>
			<Text elementType="span" typography="label">
				{themeLabel(capture)}
			</Text>
			{mark}
			<VisuallyHidden>{`, ${SEEN_STATE_TEXT[state]}`}</VisuallyHidden>
		</Tab>
	);
}
