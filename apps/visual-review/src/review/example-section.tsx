import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ReactNode } from 'react';
import { useRef } from 'react';
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
import { themeLabel } from './examples.js';
import { useNearViewport } from './layout-hooks.js';
import type { Layout, Pane, Zoom } from './review-params.js';
import { CHROME_ATTRIBUTE, sectionId } from './scroll-position.js';
import * as styles from './section.css.js';
import type { SeenState } from './seen-store.js';
import type { CaptureView, StageMetrics } from './stage.js';
import { Stage, useRegions } from './stage.js';

export const SEEN_STATE_TEXT = {
	changed: 'changed since viewed',
	seen: 'viewed',
	unseen: 'not viewed',
} as const satisfies Record<SeenState, string>;

type ExampleSectionProps = {
	/** The theme on screen. */
	active: Capture;
	/** The difference stepped to, in the capture in view. */
	activeRegion: number | undefined;
	baseUrl: string;
	example: Example;
	isCompact: boolean;
	isCurrent: boolean;
	isOpen: boolean;
	/** Whether every theme is viewed. */
	isViewed: boolean;
	layout: Layout;
	metrics: StageMetrics;
	onFlip: (direction: -1 | 1) => void;
	onOpenChange: (isOpen: boolean) => void;
	onPane: (pane: Pane) => void;
	onSelectTheme: (captureId: string) => void;
	onZoom: (zoom: Zoom) => void;
	opacity: number;
	pane: Pane;
	shouldOutline: boolean;
	stateOf: (capture: Capture) => SeenState;
	view: CaptureView;
};

/**
 * One component example. Its sticky header only names it and holds its theme tabs, whose marks
 * carry seen state. Everything that acts on the capture is in the top bar. A viewed example folds
 * to one plain row that opens again on a click.
 */
export function ExampleSection(props: ExampleSectionProps) {
	const { active, activeRegion, baseUrl, example, isCompact, isCurrent, isOpen } = props;
	const { isViewed, onOpenChange, onSelectTheme, stateOf, view } = props;
	const ref = useRef<HTMLElement>(null);
	const isNear = useNearViewport(ref);
	const regions = useRegions(baseUrl, active, isNear && isOpen);
	const id = sectionId(example.id);
	const hasTabs = example.captures.length > 1;

	const stage = (capture: Capture) => (
		<Stage
			activeRegion={capture.id === active.id ? activeRegion : undefined}
			baseUrl={baseUrl}
			capture={capture}
			isChangedSinceViewed={stateOf(capture) === 'changed'}
			isCompact={isCompact}
			layout={props.layout}
			metrics={props.metrics}
			onFlip={props.onFlip}
			onPane={props.onPane}
			onZoom={props.onZoom}
			opacity={props.opacity}
			pane={props.pane}
			regions={props.shouldOutline && capture.id === active.id ? regions : undefined}
			zoom={view.zoom}
		/>
	);

	const body = (
		<Disclosure isExpanded={isOpen} onExpandedChange={onOpenChange}>
			<Box
				backgroundColor={isOpen ? 'surface.subdued' : undefined}
				className={cx(styles.head, !isOpen && styles.headCollapsed)}
				{...{ [CHROME_ATTRIBUTE.sectionHead]: '' }}
			>
				<h2 className={styles.name}>
					<Lockup
						className={styles.nameButton}
						railAlignment="center"
						renderRoot={(domProps) => {
							return (
								<AriaButton
									{...domProps}
									aria-describedby={!isOpen && isViewed ? `${id}-viewed` : undefined}
									data-focus-target
									id={`${id}-toggle`}
									slot="trigger"
								/>
							);
						}}
					>
						<LockupRail elementType="span">
							<Icon className={styles.chevron} name="chevronDown" size="xsmall" />
						</LockupRail>
						<LockupBody className={styles.nameText} elementType="span">
							<Box
								className={styles.componentPrefix}
								display={{ initial: 'none', bp1024: 'inline' }}
								elementType="span"
							>
								{example.component} /{' '}
							</Box>
							{example.name}
							{isCurrent ? <VisuallyHidden> (in view)</VisuallyHidden> : null}
						</LockupBody>
					</Lockup>
				</h2>
				{isOpen && hasTabs ? (
					<ScrollFade aria-label={`${example.name} themes, scrollable`} className={styles.tabsFade}>
						<TabList aria-label={`${example.name} themes`} className={styles.tabList}>
							{example.captures.map((capture) => (
								<ThemeTab capture={capture} key={capture.id} state={stateOf(capture)} />
							))}
						</TabList>
					</ScrollFade>
				) : null}
				{!isOpen && isViewed ? (
					<span className={styles.collapsedMeta} id={`${id}-viewed`}>
						{hasTabs ? `${example.captures.length} themes viewed` : 'Viewed'}
						<Icon name="check" size="xsmall" />
					</span>
				) : null}
			</Box>
			<DisclosurePanel>
				{isOpen && hasTabs
					? example.captures.map((capture) => (
							<TabPanel className={styles.panel} id={capture.id} key={capture.id}>
								<div data-capture={capture.id}>{stage(capture)}</div>
							</TabPanel>
						))
					: null}
				{isOpen && !hasTabs ? <div data-capture={active.id}>{stage(active)}</div> : null}
			</DisclosurePanel>
		</Disclosure>
	);

	return (
		<section
			aria-labelledby={`${id}-toggle`}
			className={cx(styles.section, !isOpen && styles.sectionCollapsed)}
			data-collapsed={isOpen ? undefined : ''}
			data-example-id={example.id}
			id={id}
			ref={ref}
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

function ThemeTab({ capture, state }: { capture: Capture; state: SeenState }) {
	let mark: ReactNode = null;
	if (state === 'seen') mark = <Icon name="check" size="xsmall" />;
	if (state === 'changed') mark = <span aria-hidden className={contentsStyles.changedDot} />;
	return (
		<Tab className={styles.tab} data-state={state} id={capture.id}>
			{themeLabel(capture)}
			{mark}
			<VisuallyHidden>{`, ${SEEN_STATE_TEXT[state]}`}</VisuallyHidden>
		</Tab>
	);
}
