import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	Button as AriaButton,
	Dialog,
	DialogTrigger,
	Heading as AriaHeading,
	Modal,
	ModalOverlay,
	Popover,
} from 'react-aria-components';
import { hrefWithParams, navigate, useLocationSearch } from '../navigation/location.js';
import type { ReportSource } from '../report/report-source.js';
import type { Capture, Report } from '../report/schema.js';
import { Contents } from './contents.js';
import { ExampleSection, SEEN_STATE_TEXT } from './example-section.js';
import type { Example } from './examples.js';
import { exampleLabel, groupExamples, hasThemes, themeLabel } from './examples.js';
import {
	COMPACT_QUERY,
	DRAWER_QUERY,
	useContentWidth,
	useMediaQuery,
	useViewportHeight,
} from './layout-hooks.js';
import * as overlayStyles from './overlays.css.js';
import { ReportTitle, sourceLabel } from './report-title.js';
import { ReviewTrigger } from './review-panel.js';
import type { Layout, Pane, ReviewParams, StatusFilter, Zoom } from './review-params.js';
import { filterCaptures, parseReviewParams, reviewParamValues, stepZoom } from './review-params.js';
import * as styles from './review.css.js';
import {
	CHROME_ATTRIBUTE,
	isHeaderStuck,
	readingLine,
	scrollToExample,
	sectionElement,
	stickyBottom,
	stickyTop,
	stuckHeaderHeight,
} from './scroll-position.js';
import type { SeenEntries } from './seen-store.js';
import { useSeen } from './seen-store.js';
import { setShortcutsEnabled, useShortcutsEnabled } from './shortcuts-preference.js';
import type { CaptureView, StageMetrics } from './stage.js';
import { PANE_LABELS, paneFor, useRegions } from './stage.js';
import { CaptureMenu, ContentsIcon, DiffStepper, GuideWords, Progress } from './top-bar-parts.js';
import { usePullRequestReview } from './use-pull-request-review.js';
import { useReviewShortcuts } from './use-review-shortcuts.js';
import { showingLabel, ViewOptions } from './view-options.js';

const DEFAULT_VIEW: CaptureView = { activeRegion: undefined, zoom: 'fit' };
/** About two seconds of frames to wait for a difference's outline to render. */
const MAX_DIFFERENCE_FRAMES = 120;
/** How long the offer to undo a mark stays. It is a convenience, not a step. */
const UNDO_DURATION = 6000;
/** The top bar's height, which the fit-screen zoom leaves room for. */
const TOP_BAR_HEIGHT = 48;

type Undo = {
	captureIds: Array<string>;
	exampleId: string | undefined;
	label: string;
	/** What each marked capture had stored before, so Undo puts back a `changed` state too. */
	previous: SeenEntries;
};

type ReviewProps = { baseUrl: string; report: Report; source: ReportSource };

/**
 * One scroll of examples, a section per example with its themes as tabs. The top bar names the
 * example in view and holds what acts on it: Viewed, difference stepping, the View options, and
 * the Review decisions. Viewed examples fold to labelled rows. Phones get the same document with
 * full-bleed captures and a bottom bar.
 */
export function Review({ baseUrl, report, source }: ReviewProps) {
	const params = parseReviewParams(useLocationSearch());
	const { restoreSeen, setSeen, stateOf, storedFor } = useSeen();
	const areShortcutsEnabled = useShortcutsEnabled();
	const pullRequestReview = usePullRequestReview(
		source.kind === 'pull-request' ? source.number : undefined,
	);
	const allExamples = useMemo(() => groupExamples(report.captures), [report.captures]);
	const [initial] = useState(() => {
		const example = allExamples.find((candidate) =>
			candidate.captures.some((capture) => capture.id === params.capture),
		);
		return example && params.capture ? { captureId: params.capture, example } : undefined;
	});
	const [current, setCurrent] = useState(initial?.example.id);
	const [activeTheme, setActiveTheme] = useState<Record<string, string>>(() =>
		initial ? { [initial.example.id]: initial.captureId } : {},
	);
	const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
		initial ? { [initial.example.id]: true } : {},
	);
	const [views, setViews] = useState<Record<string, CaptureView>>(() =>
		initial ? { [initial.captureId]: { activeRegion: undefined, zoom: params.zoom } } : {},
	);
	const [opacity, setOpacity] = useState(50);
	const [isContentsOpen, setIsContentsOpen] = useState(false);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [announcement, setAnnouncement] = useState('');
	const [undo, setUndo] = useState<Undo>();
	const isCompact = useMediaQuery(COMPACT_QUERY);
	const isDrawer = useMediaQuery(DRAWER_QUERY);
	const viewportHeight = useViewportHeight();
	const mainRef = useRef<HTMLElement>(null);
	const mainWidth = useContentWidth(mainRef);
	const filterRef = useRef<HTMLInputElement>(null);
	const afterRender = useRef<(() => void) | undefined>(undefined);
	/** The difference waiting to scroll into view, until its outline renders. */
	const differenceScroll = useRef<symbol | undefined>(undefined);
	const deepLink = useRef(initial?.example.id);
	const { hideViewed, highlight: shouldOutline, layout, pane, query, status } = params;

	function isExampleViewed(example: Example) {
		return example.captures.every((capture) => stateOf(capture) === 'seen');
	}

	// Filtering keeps examples with a matching theme, and their tabs show only those themes. Hiding
	// viewed examples keeps the one in view, so marking it does not pull it away mid-review.
	const matching = new Set(filterCaptures(report.captures, { query, status }).map((c) => c.id));
	const examples = allExamples.flatMap((example) => {
		const captures = example.captures.filter((capture) => matching.has(capture.id));
		if (captures.length === 0) return [];
		const shown = { ...example, captures };
		if (hideViewed && isExampleViewed(shown) && shown.id !== current) return [];
		return [shown];
	});

	const viewedCount = report.captures.filter((capture) => stateOf(capture) === 'seen').length;
	const changedCount = report.captures.filter((capture) => stateOf(capture) === 'changed').length;
	const total = report.captures.length;

	function activeCaptureOf(example: Example): Capture | undefined {
		const chosen = example.captures.find((capture) => capture.id === activeTheme[example.id]);
		return (
			chosen ??
			example.captures.find((capture) => stateOf(capture) !== 'seen') ??
			example.captures[0]
		);
	}
	function isOpen(example: Example) {
		return expanded[example.id] ?? !isExampleViewed(example);
	}
	const viewOf = (captureId: string) => views[captureId] ?? DEFAULT_VIEW;
	function updateView(captureId: string, patch: Partial<CaptureView>) {
		setViews((previous) => ({
			...previous,
			[captureId]: { ...(previous[captureId] ?? DEFAULT_VIEW), ...patch },
		}));
	}
	function expand(exampleId: string) {
		setExpanded((previous) => ({ ...previous, [exampleId]: true }));
	}

	const openExamples = examples.filter(isOpen);
	const currentExample =
		openExamples.find((example) => example.id === current) ??
		examples.find((example) => example.id === current) ??
		openExamples[0] ??
		examples[0];
	const currentCapture = currentExample ? activeCaptureOf(currentExample) : undefined;
	const currentView = currentCapture ? viewOf(currentCapture.id) : DEFAULT_VIEW;
	const currentRegions = useRegions(baseUrl, currentCapture, true);

	// The capture in view and its zoom belong in the link, so a copied URL opens the same view.
	useEffect(() => {
		replaceParams({
			capture: currentCapture?.id,
			zoom: currentView.zoom === 'fit' ? undefined : currentView.zoom,
		});
	}, [currentCapture?.id, currentView.zoom]);

	// A deep link scrolls to its section once the sections have a width to lay out in.
	useLayoutEffect(() => {
		const exampleId = deepLink.current;
		if (!exampleId || mainWidth === 0) return;
		scrollToExample(exampleId);
		deepLink.current = undefined;
	}, [mainWidth]);

	const readCurrent = useEffectEvent(() => currentExample?.id);
	// A sheet or drawer locks the page's scroll, which can move it. The example in view stays put.
	const isPageCovered = useEffectEvent(
		() => (isDrawer && isContentsOpen) || (isCompact && (isViewOpen || isReviewOpen)),
	);
	/*
	 * The example in view is the last open one whose top has passed the reading line, or, above the
	 * first, the first open one in reach. Viewed rows never become current: they have no capture to
	 * act on. A little hysteresis keeps the boundary from flickering.
	 */
	useEffect(() => {
		function spy() {
			if (deepLink.current || isPageCovered()) return;
			const line = readingLine();
			const sections = [...document.querySelectorAll<HTMLElement>('[data-example-id]')];
			const tops = sections.map((section) => section.getBoundingClientRect().top);
			function isOpenAt(index: number) {
				const section = index >= 0 ? sections.at(index) : undefined;
				return section ? !section.hasAttribute('data-collapsed') : false;
			}
			let candidate = -1;
			for (const [index, top] of tops.entries()) {
				if (top <= line && isOpenAt(index)) candidate = index;
			}
			if (candidate === -1) {
				candidate = tops.findIndex(
					(top, index) => isOpenAt(index) && top < window.innerHeight * 0.75,
				);
			}
			if (candidate === -1) return;
			const currentId = readCurrent();
			const currentIndex = sections.findIndex((section) => section.dataset.exampleId === currentId);
			const currentTop = tops[currentIndex];
			if (
				currentIndex > candidate &&
				isOpenAt(currentIndex) &&
				currentTop !== undefined &&
				currentTop < line + 48 &&
				currentTop > line - 4
			) {
				return;
			}
			const next = sections[candidate]?.dataset.exampleId;
			if (next && next !== currentId) setCurrent(next);
		}
		// Sections move when they open, close, filter or zoom, as well as on scroll.
		const frame = requestAnimationFrame(spy);
		window.addEventListener('scroll', spy, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', spy);
		};
	}, [examples.length, expanded, mainWidth, query, status, views]);

	useLayoutEffect(() => {
		const run = afterRender.current;
		afterRender.current = undefined;
		run?.();
	});

	// A difference still waiting to render belongs to the capture it was asked for.
	useEffect(() => {
		differenceScroll.current = undefined;
	}, [currentCapture?.id]);

	useEffect(() => {
		if (!undo) return;
		const timer = window.setTimeout(() => setUndo(undefined), UNDO_DURATION);
		return () => window.clearTimeout(timer);
	}, [undo]);

	function setParams(next: Partial<Omit<ReviewParams, 'capture'>>) {
		replaceParams(reviewParamValues({ ...params, ...next }));
	}

	function goToExample(exampleId: string, { focus = false, scroll = true } = {}) {
		setCurrent(exampleId);
		afterRender.current = () => {
			if (scroll) scrollToExample(exampleId);
			if (focus) {
				sectionElement(exampleId)
					?.querySelector<HTMLElement>('[data-focus-target]')
					?.focus({ preventScroll: true });
			}
		};
	}

	function selectTheme(example: Example, captureId: string) {
		setActiveTheme((previous) => ({ ...previous, [example.id]: captureId }));
		setCurrent(example.id);
	}

	/** Once every theme of an example is viewed it folds away, and the next open one takes over. */
	function moveOnFrom(example: Example) {
		const index = examples.findIndex((candidate) => candidate.id === example.id);
		const next = examples.slice(index + 1).find((candidate) => isOpen(candidate));
		if (next) goToExample(next.id, { focus: !isCompact, scroll: isHeaderStuck(example.id) });
	}

	function collapse(example: Example) {
		setExpanded((previous) => {
			const next = { ...previous };
			delete next[example.id];
			return next;
		});
	}

	function setViewed(example: Example, capture: Capture, isViewed: boolean) {
		const wasSeen = stateOf(capture) === 'seen';
		const stored = storedFor([capture]);
		setSeen([capture], isViewed);
		const viewed = viewedCount + (isViewed && !wasSeen ? 1 : 0) - (!isViewed && wasSeen ? 1 : 0);
		setAnnouncement(
			`${exampleLabel(example, capture)} ${isViewed ? 'marked viewed' : 'marked not viewed'}. ${viewed} of ${total} viewed.`,
		);
		if (!isViewed) {
			expand(example.id);
			return;
		}
		// Move to the next theme still to view, without marking it.
		const index = example.captures.findIndex((candidate) => candidate.id === capture.id);
		const ordered = [...example.captures.slice(index + 1), ...example.captures.slice(0, index)];
		const nextTheme = ordered.find((candidate) => stateOf(candidate) !== 'seen');
		if (nextTheme) {
			setActiveTheme((previous) => ({ ...previous, [example.id]: nextTheme.id }));
			return;
		}
		setUndo({
			captureIds: [capture.id],
			exampleId: example.id,
			label: `${example.name} viewed`,
			previous: stored,
		});
		collapse(example);
		moveOnFrom(example);
	}

	function markExampleViewed(example: Example) {
		const marked = example.captures.filter((capture) => stateOf(capture) !== 'seen');
		const previous = storedFor(marked);
		setSeen(example.captures, true);
		collapse(example);
		setAnnouncement(`All ${example.captures.length} themes of ${example.id} marked viewed.`);
		setUndo({
			captureIds: marked.map((capture) => capture.id),
			exampleId: example.id,
			label: `${example.name}: ${example.captures.length} themes viewed`,
			previous,
		});
		moveOnFrom(example);
	}

	function markReportViewed() {
		const marked = report.captures.filter((capture) => stateOf(capture) !== 'seen');
		const previous = storedFor(marked);
		setSeen(marked, true);
		setExpanded({});
		setAnnouncement(`All ${total} captures marked viewed.`);
		setUndo({
			captureIds: marked.map((capture) => capture.id),
			exampleId: undefined,
			label: `All ${total} viewed`,
			previous,
		});
	}

	function undoLast() {
		if (!undo) return;
		restoreSeen(undo.previous);
		setUndo(undefined);
		setAnnouncement('Undone.');
		const { exampleId } = undo;
		const [firstId] = undo.captureIds;
		if (exampleId) {
			if (firstId) setActiveTheme((previous) => ({ ...previous, [exampleId]: firstId }));
			expand(exampleId);
			goToExample(exampleId);
		}
	}

	function setOpen(example: Example, isNowOpen: boolean) {
		setExpanded((previous) => ({ ...previous, [example.id]: isNowOpen }));
		if (isNowOpen) setCurrent(example.id);
	}

	/** `j` and `k` walk the open examples. Viewed rows are done, so they are stepped over. */
	function stepExample(offset: number) {
		const list = openExamples.length > 0 ? openExamples : examples;
		const index = list.findIndex((example) => example.id === currentExample?.id);
		const target = list[Math.min(Math.max(index + offset, 0), list.length - 1)];
		if (target) goToExample(target.id);
	}

	function stepTheme(example: Example, offset: number) {
		const list = example.captures;
		if (list.length < 2) return;
		const index = list.findIndex((capture) => capture.id === activeCaptureOf(example)?.id);
		const target = list[(index + offset + list.length) % list.length];
		if (!target) return;
		selectTheme(example, target.id);
		setAnnouncement(`${example.name}: ${themeLabel(target)}, ${SEEN_STATE_TEXT[stateOf(target)]}.`);
		if (!isOpen(example)) expand(example.id);
	}

	function nextUnviewed() {
		const flat = examples.flatMap((example) =>
			example.captures.map((capture) => ({ capture, example })),
		);
		const index = flat.findIndex((entry) => entry.capture.id === currentCapture?.id);
		const ordered = [...flat.slice(index + 1), ...flat.slice(0, index + 1)];
		const target = ordered.find((entry) => stateOf(entry.capture) !== 'seen');
		if (!target) {
			setAnnouncement(
				hideViewed || query || status !== 'all'
					? 'Nothing unviewed matches the filter.'
					: 'Every capture is viewed.',
			);
			return;
		}
		setActiveTheme((previous) => ({ ...previous, [target.example.id]: target.capture.id }));
		expand(target.example.id);
		goToExample(target.example.id, {
			scroll: target.example.id !== currentExample?.id || !isHeaderStuck(target.example.id),
		});
	}

	function toggleViewed() {
		if (!currentExample || !currentCapture) return;
		if (!isOpen(currentExample)) expand(currentExample.id);
		setViewed(currentExample, currentCapture, stateOf(currentCapture) !== 'seen');
	}

	function copyLink(capture: Capture) {
		const url = new URL(window.location.href);
		url.searchParams.set('capture', capture.id);
		void navigator.clipboard?.writeText(url.toString()).then(
			() => setAnnouncement('Link to this capture copied.'),
			() => setAnnouncement('The link could not be copied.'),
		);
	}

	function showPane(next: Pane) {
		setParams({ layout: 'single', pane: next });
		setAnnouncement(`Showing ${PANE_LABELS[next]}.`);
	}

	function toggleLayout(next: Layout) {
		setParams({ layout: layout === next ? 'single' : next });
	}

	function setZoom(zoom: Zoom) {
		if (!currentCapture || !currentExample) return;
		updateView(currentCapture.id, { zoom });
		if (!isOpen(currentExample)) expand(currentExample.id);
		// Keep the header in sight, so a zoom change does not lose the reviewer's place.
		const top = sectionElement(currentExample.id)?.getBoundingClientRect().top ?? Infinity;
		const exampleId = currentExample.id;
		if (top < readingLine()) afterRender.current = () => scrollToExample(exampleId);
	}

	function stepZoomBy(direction: -1 | 1) {
		setZoom(stepZoom(currentView.zoom, direction));
	}

	/** Centres the next difference on screen. A zoomed capture also scrolls sideways to it. */
	function stepDifference(offset: number) {
		if (!currentCapture || !currentExample || !currentRegions?.length) return;
		const count = currentRegions.length;
		const active = currentView.activeRegion;
		// With no difference selected, stepping forward starts at the first and back at the last.
		const from = active ?? (offset > 0 ? -1 : count);
		const index = (from + offset + count) % count;
		updateView(currentCapture.id, {
			activeRegion: index,
			zoom: currentView.zoom === 'screen' ? 'fit' : currentView.zoom,
		});
		if (isCompact) setAnnouncement(`Difference ${index + 1} of ${count}`);
		if (!shouldOutline) setParams({ highlight: true });
		if (!isOpen(currentExample)) expand(currentExample.id);
		const captureId = currentCapture.id;
		const exampleId = currentExample.id;
		const kind = layout === 'single' ? paneFor(currentCapture, pane) : 'actual';
		const request = Symbol('difference');
		differenceScroll.current = request;
		// A folded example loads its regions only once it opens, so the target can render a few
		// frames after this one. Keep trying until it does, or a newer request or capture replaces it.
		const attempt = (frames: number) => {
			if (differenceScroll.current !== request) return;
			const target = document.querySelector<HTMLElement>(
				`[data-capture="${CSS.escape(captureId)}"] [data-kind="${kind}"] [data-region="${index}"]`,
			);
			if (!target) {
				if (frames < MAX_DIFFERENCE_FRAMES) requestAnimationFrame(() => attempt(frames + 1));
				else differenceScroll.current = undefined;
				return;
			}
			differenceScroll.current = undefined;
			const box = target.getBoundingClientRect();
			const top = stickyTop() + stuckHeaderHeight(exampleId);
			const bottom = stickyBottom() - 24;
			// Centre the region, but never scroll the section's own top below the reading line, or the
			// example in view, and so what the top bar acts on, would change under the reviewer.
			const sectionTop = sectionElement(exampleId)?.getBoundingClientRect().top ?? 0;
			const minDelta = sectionTop - readingLine() + 8;
			window.scrollBy({ top: Math.max(box.top + box.height / 2 - (top + bottom) / 2, minDelta) });
			const stage = target.closest<HTMLElement>('[data-stage]');
			if (stage && stage.scrollWidth > stage.clientWidth) {
				const stageBox = stage.getBoundingClientRect();
				stage.scrollLeft += box.left + box.width / 2 - (stageBox.left + stageBox.width / 2);
			}
		};
		afterRender.current = () => attempt(0);
	}

	function openFilter() {
		setIsContentsOpen(true);
		// After the Contents drawer has opened and placed its own focus.
		requestAnimationFrame(() => filterRef.current?.focus());
	}

	useReviewShortcuts(
		{
			'+': () => stepZoomBy(1),
			'-': () => stepZoomBy(-1),
			'/': openFilter,
			'0': () => setZoom('fit'),
			'1': () => showPane('expected'),
			'2': () => showPane('actual'),
			'3': () => showPane('diff'),
			'=': () => stepZoomBy(1),
			ArrowLeft: () => showPane('expected'),
			ArrowRight: () => showPane('actual'),
			D: () => stepDifference(-1),
			'[': () => currentExample && stepTheme(currentExample, -1),
			']': () => currentExample && stepTheme(currentExample, 1),
			d: () => stepDifference(1),
			f: () => setZoom(currentView.zoom === 'screen' ? 'fit' : 'screen'),
			h: () => setParams({ highlight: !shouldOutline }),
			j: () => stepExample(1),
			k: () => stepExample(-1),
			o: () => toggleLayout('overlay'),
			s: () => toggleLayout('side'),
			t: () => setIsContentsOpen((isNowOpen) => !isNowOpen),
			u: nextUnviewed,
			v: toggleViewed,
		},
		areShortcutsEnabled && !isReviewOpen && !isViewOpen && !(isDrawer && isContentsOpen),
	);

	const metrics: StageMetrics = {
		// Phones run captures edge to edge, so a wide capture keeps every pixel of width it can.
		availableWidth: Math.max(mainWidth - (isCompact ? 0 : 48), 120),
		gap: isCompact ? 12 : 24,
		screenHeight: Math.max(
			viewportHeight - TOP_BAR_HEIGHT - (isCompact ? 60 + 16 : 44 + 36 + 24 + 16),
			160,
		),
	};

	const target =
		currentCapture && currentExample ? exampleLabel(currentExample, currentCapture) : '';
	const title = <ReportTitle report={report} source={source} />;
	const progress = { total, viewed: viewedCount };

	const viewOptions = (
		<ViewOptions
			areShortcutsEnabled={areShortcutsEnabled}
			capture={currentCapture}
			exampleActions={
				isCompact && currentExample && currentCapture ? (
					<div className={overlayStyles.sheetActions}>
						{currentExample.captures.length > 1 ? (
							<Button
								className={styles.touchTarget}
								isDisabled={isExampleViewed(currentExample)}
								onPress={() => {
									setIsViewOpen(false);
									markExampleViewed(currentExample);
								}}
							>
								{`Mark all ${currentExample.captures.length} themes viewed`}
							</Button>
						) : null}
						<Button
							className={styles.touchTarget}
							onPress={() => {
								copyLink(currentCapture);
								setIsViewOpen(false);
							}}
							prominence="low"
						>
							Copy link to this capture
						</Button>
					</div>
				) : undefined
			}
			isCompact={isCompact}
			layout={layout}
			onLayout={(next) => setParams({ layout: next })}
			onOpacity={setOpacity}
			onOutlines={(isOn) => setParams({ highlight: isOn })}
			onPane={showPane}
			onShortcuts={setShortcutsEnabled}
			onZoom={setZoom}
			opacity={opacity}
			pane={pane}
			shouldOutline={shouldOutline}
			target={target}
			zoom={currentView.zoom}
		/>
	);

	const review = pullRequestReview ? (
		<ReviewTrigger
			isCompact={isCompact}
			isOpen={isReviewOpen}
			onOpenChange={setIsReviewOpen}
			progress={progress}
			report={report}
			review={pullRequestReview}
		/>
	) : null;

	const differences =
		currentRegions && currentRegions.length > 0 ? (
			<DiffStepper
				active={currentView.activeRegion}
				isCompact={isCompact}
				onStep={(offset) => {
					if (isCompact) setIsViewOpen(false);
					stepDifference(offset);
				}}
				regions={currentRegions}
			/>
		) : null;

	const viewedCheckbox =
		currentCapture && currentExample ? (
			<CheckboxField
				className={cx(styles.viewedCheckbox, isCompact && styles.bottomViewed)}
				isSelected={stateOf(currentCapture) === 'seen'}
				label={
					<>
						<span>Viewed</span>
						<VisuallyHidden>
							{` ${currentExample.name}${hasThemes(currentExample) ? ` ${themeLabel(currentCapture)}` : ''}`}
						</VisuallyHidden>
					</>
				}
				onChange={(isViewed) => setViewed(currentExample, currentCapture, isViewed)}
				size={isCompact ? 'medium' : 'small'}
			/>
		) : null;

	const contents = (
		<Contents
			areShortcutsEnabled={areShortcutsEnabled}
			changedCount={changedCount}
			currentId={currentExample?.id}
			examples={examples}
			filterRef={filterRef}
			hideViewed={hideViewed}
			isCompact={isCompact}
			isOverlay={isDrawer}
			onClose={() => setIsContentsOpen(false)}
			onHideViewed={(isHidden) => setParams({ hideViewed: isHidden })}
			onMarkAllViewed={() => {
				if (isDrawer) setIsContentsOpen(false);
				markReportViewed();
			}}
			onNextUnviewed={() => {
				if (isDrawer) setIsContentsOpen(false);
				nextUnviewed();
			}}
			onQuery={(next) => setParams({ query: next })}
			onSelect={(exampleId) => {
				if (isDrawer) setIsContentsOpen(false);
				expand(exampleId);
				goToExample(exampleId, { focus: !isCompact });
			}}
			onStatus={(next: StatusFilter) => setParams({ status: next })}
			query={query}
			reportTitle={title}
			stateOf={stateOf}
			status={status}
			total={total}
			viewed={viewedCount}
		/>
	);

	return (
		<div className={styles.app}>
			<title>{`${currentCapture?.id ?? 'Review'} · ${sourceLabel(source)} · Visual review`}</title>
			<Box
				backgroundColor="surface.subdued"
				className={styles.reviewTopBar}
				elementType="header"
				{...{ [CHROME_ATTRIBUTE.topBar]: '' }}
			>
				{isCompact ? (
					<>
						<h1 className={styles.reportTitle}>{title}</h1>
						<AriaButton
							aria-expanded={isContentsOpen}
							aria-label={`Contents. In view: ${target || 'nothing'}`}
							className={styles.guideButton}
							onPress={() => setIsContentsOpen(true)}
						>
							<ContentsIcon size="small" />
							<GuideWords capture={currentCapture} example={currentExample} isCompact />
						</AriaButton>
						<span className={styles.topEnd}>
							<Progress isCompact total={total} viewed={viewedCount} />
						</span>
					</>
				) : (
					<>
						<div className={styles.topStart}>
							<Button
								aria-controls={isContentsOpen && !isDrawer ? 'review-contents' : undefined}
								aria-expanded={isContentsOpen}
								onPress={() => setIsContentsOpen((isNowOpen) => !isNowOpen)}
								prominence="low"
								size="small"
								startContent={<ContentsIcon />}
							>
								Contents
							</Button>
							<h1 className={styles.reportTitle}>{title}</h1>
						</div>
						<div aria-label="Capture in view" className={styles.guide} role="group">
							<GuideWords capture={currentCapture} example={currentExample} isCompact={false} />
							{viewedCheckbox}
							{differences}
							<DialogTrigger isOpen={isViewOpen} onOpenChange={setIsViewOpen}>
								<Button
									endContent={<Icon name="chevronDown" size="xsmall" />}
									prominence="low"
									size="small"
								>
									<span className={styles.viewButtonLabel}>
										<span className={styles.secondary}>View</span> {showingLabel(layout, pane)}
									</span>
								</Button>
								<Popover
									className={cx(overlayStyles.popover, overlayStyles.viewPopover)}
									offset={8}
									placement="bottom"
								>
									<Dialog aria-label="View options" className={overlayStyles.dialog}>
										<Box backgroundColor="surface.raised" className={overlayStyles.dialogBody}>
											{viewOptions}
										</Box>
									</Dialog>
								</Popover>
							</DialogTrigger>
							{currentExample && currentCapture ? (
								<CaptureMenu
									count={currentExample.captures.length}
									isAllViewed={isExampleViewed(currentExample)}
									name={currentExample.name}
									onCollapse={() => setOpen(currentExample, false)}
									onCopyLink={() => copyLink(currentCapture)}
									onMarkAllViewed={() => markExampleViewed(currentExample)}
								/>
							) : null}
						</div>
						<div className={styles.topEnd}>
							<Progress isCompact={false} total={total} viewed={viewedCount} />
							{review}
						</div>
					</>
				)}
			</Box>

			<div className={cx(styles.layout, isContentsOpen && !isDrawer && styles.layoutWithContents)}>
				{isContentsOpen && !isDrawer ? contents : null}
				<main aria-label="Comparisons" className={styles.main} ref={mainRef}>
					{examples.length === 0 ? (
						<div className={styles.empty}>
							<p>No captures match the filter.</p>
							<Button
								onPress={() => setParams({ hideViewed: false, query: '', status: 'all' })}
								size="small"
							>
								Clear filter
							</Button>
						</div>
					) : null}
					{mainWidth > 0
						? examples.map((example) => {
								const capture = activeCaptureOf(example);
								if (!capture) return null;
								const isCurrent = example.id === currentExample?.id;
								return (
									<ExampleSection
										active={capture}
										activeRegion={isCurrent ? currentView.activeRegion : undefined}
										baseUrl={baseUrl}
										example={example}
										isCompact={isCompact}
										isCurrent={isCurrent}
										isOpen={isOpen(example)}
										isViewed={isExampleViewed(example)}
										key={example.id}
										layout={layout}
										metrics={metrics}
										onFlip={(direction) => showPane(direction < 0 ? 'expected' : 'actual')}
										onOpenChange={(isNowOpen) => setOpen(example, isNowOpen)}
										onPane={showPane}
										onSelectTheme={(captureId) => selectTheme(example, captureId)}
										onZoom={(zoom) => {
											updateView(capture.id, { zoom });
											setCurrent(example.id);
										}}
										opacity={opacity}
										pane={pane}
										shouldOutline={shouldOutline}
										stateOf={stateOf}
										view={viewOf(capture.id)}
									/>
								);
							})
						: null}
				</main>
			</div>

			{isCompact ? (
				<Box
					aria-label="Capture in view"
					backgroundColor="surface.subdued"
					className={styles.bottomBar}
					elementType="nav"
					{...{ [CHROME_ATTRIBUTE.bottomBar]: '' }}
				>
					{viewedCheckbox ?? <span />}
					<DialogTrigger isOpen={isViewOpen} onOpenChange={setIsViewOpen}>
						<Button
							aria-label={`View options, showing ${showingLabel(layout, pane)}`}
							className={styles.touchTarget}
							endContent={<Icon name="chevronUp" size="xsmall" />}
							prominence="low"
						>
							View
						</Button>
						<ModalOverlay className={overlayStyles.modalOverlay} isDismissable>
							<Modal className={overlayStyles.sheet}>
								<Dialog aria-labelledby="review-view-title" className={overlayStyles.dialog}>
									<Box backgroundColor="surface.raised" className={overlayStyles.dialogBody}>
										<div className={overlayStyles.sheetHead}>
											<AriaHeading
												className={overlayStyles.dialogTitle}
												id="review-view-title"
												slot="title"
											>
												View
											</AriaHeading>
											<IconButton
												aria-label="Close"
												className={styles.touchTarget}
												icon="close"
												onPress={() => setIsViewOpen(false)}
												prominence="low"
											/>
										</div>
										{differences}
										{viewOptions}
									</Box>
								</Dialog>
							</Modal>
						</ModalOverlay>
					</DialogTrigger>
					{review}
				</Box>
			) : null}

			{isDrawer ? (
				<ModalOverlay
					className={cx(overlayStyles.modalOverlay, !isCompact && overlayStyles.drawerOverlay)}
					isDismissable
					isOpen={isContentsOpen}
					onOpenChange={setIsContentsOpen}
				>
					<Modal
						className={
							isCompact ? cx(overlayStyles.sheet, overlayStyles.sheetFull) : overlayStyles.drawer
						}
					>
						<Dialog aria-label="Contents" className={overlayStyles.dialog}>
							{contents}
						</Dialog>
					</Modal>
				</ModalOverlay>
			) : null}

			{undo ? (
				<Box backgroundColor="surface.raised" className={styles.toast}>
					<span className={styles.truncate}>{undo.label}</span>
					<Button onPress={undoLast} prominence="low" size="small">
						Undo
					</Button>
				</Box>
			) : null}

			<VisuallyHidden aria-live="polite" elementType="p" role="status">
				{announcement}
			</VisuallyHidden>
		</div>
	);
}

/** Replaces the query string without a history entry, so Back leaves the review. */
function replaceParams(updates: Record<string, string | undefined>) {
	navigate(hrefWithParams(window.location.search, updates), { replace: true });
}
