import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { Dialog, DialogTrigger, Modal, ModalOverlay, Popover } from 'react-aria-components';
import { AppHeader } from '../app-header.js';
import { hrefWithParams, navigate, useLocationSearch } from '../navigation/location.js';
import type { ReportSource } from '../report/report-source.js';
import type { Capture, Report } from '../report/schema.js';
import { Contents } from './contents.js';
import { ExampleSection, SEEN_STATE_TEXT } from './example-section.js';
import type { Example } from './examples.js';
import { describeShare, exampleLabel, groupExamples, hasThemes, themeLabel } from './examples.js';
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
import type { ReviewDialog } from './review-state.js';
import { DEFAULT_VIEW, initialReviewState, reviewReducer } from './review-state.js';
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
import { useSeen } from './seen-store.js';
import { setShortcutsEnabled, useShortcutsEnabled } from './shortcuts-preference.js';
import type { CaptureView, StageMetrics } from './stage.js';
import { PANE_LABELS, paneFor, useRegions } from './stage.js';
import { CaptureMenu, DiffStepper, Progress, SidebarIcon } from './top-bar-parts.js';
import { usePullRequestReview } from './use-pull-request-review.js';
import { useReviewShortcuts } from './use-review-shortcuts.js';
import { PaneSwitch, showingLabel, ViewOptions } from './view-options.js';

/** About two seconds of frames to wait for a difference's outline to render. */
const MAX_DIFFERENCE_FRAMES = 120;
/** How long the offer to undo a mark stays, paused while it is hovered or focused. */
const UNDO_DURATION = 10_000;
/** The top bar's height on desktop and on phones, which the fit-screen zoom leaves room for. */
const TOP_BAR_HEIGHT = { compact: 48, regular: 56 };
/** The phone bottom bar: the image switch and stepper above Viewed, View and Review. */
const BOTTOM_BAR_HEIGHT = 112;

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
	const [state, dispatch] = useReducer(
		reviewReducer,
		{ captureId: params.capture, examples: allExamples, zoom: params.zoom },
		initialReviewState,
	);
	const { activeTheme, announcement, current, dialog, expanded, isContentsOpen, undo, views } =
		state;
	const isCompact = useMediaQuery(COMPACT_QUERY);
	const isDrawer = useMediaQuery(DRAWER_QUERY);
	const viewportHeight = useViewportHeight();
	const mainRef = useRef<HTMLElement>(null);
	const mainWidth = useContentWidth(mainRef);
	const filterRef = useRef<HTMLInputElement>(null);
	const contentsToggleRef = useRef<HTMLButtonElement>(null);
	const afterRender = useRef<(() => void) | undefined>(undefined);
	/** The difference waiting to scroll into view, until its outline renders. */
	const differenceScroll = useRef<symbol | undefined>(undefined);
	/** A deep link opens with its example current, which it scrolls to once laid out. */
	const deepLink = useRef(current);
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
	function announce(message: string) {
		dispatch({ message, type: 'announced' });
	}
	function setDialogOpen(name: ReviewDialog, isNowOpen: boolean) {
		dispatch({ dialog: name, isOpen: isNowOpen, type: 'dialogOpenChanged' });
	}
	function setUndoHeld(isHeld: boolean) {
		dispatch({ isHeld, type: 'undoHeldChanged' });
	}
	/** Opens an example folded by hand or by viewing, leaving one already open as it is. */
	function openIfFolded(example: Example) {
		if (!isOpen(example)) dispatch({ exampleId: example.id, type: 'opened' });
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
		() => (isDrawer && isContentsOpen) || (isCompact && dialog !== undefined),
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
			if (next && next !== currentId) dispatch({ exampleId: next, type: 'wentTo' });
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
		if (!undo || undo.offer.isPersistent || undo.isHeld) return;
		const timer = window.setTimeout(() => dispatch({ type: 'undoDismissed' }), UNDO_DURATION);
		return () => window.clearTimeout(timer);
	}, [undo]);

	function setParams(next: Partial<Omit<ReviewParams, 'capture'>>) {
		replaceParams(reviewParamValues({ ...params, ...next }));
	}

	/** Scrolls to an example, and can focus it, once the render that shows it has committed. */
	function revealAfterRender(exampleId: string, { focus = false, scroll = true } = {}) {
		afterRender.current = () => {
			if (scroll) scrollToExample(exampleId);
			if (focus) {
				sectionElement(exampleId)
					?.querySelector<HTMLElement>('[data-focus-target]')
					?.focus({ preventScroll: true });
			}
		};
	}

	/** Once every theme of an example is viewed it folds away, and the next open one takes over. */
	function moveOnFrom(example: Example) {
		const index = examples.findIndex((candidate) => candidate.id === example.id);
		const next = examples.slice(index + 1).find((candidate) => isOpen(candidate));
		if (!next) return;
		dispatch({ exampleId: next.id, type: 'wentTo' });
		revealAfterRender(next.id, { focus: !isCompact, scroll: isHeaderStuck(example.id) });
	}

	function setViewed(example: Example, capture: Capture, isViewed: boolean) {
		const wasSeen = stateOf(capture) === 'seen';
		const previous = storedFor([capture]);
		setSeen([capture], isViewed);
		const viewed = viewedCount + (isViewed && !wasSeen ? 1 : 0) - (!isViewed && wasSeen ? 1 : 0);
		announce(
			`${exampleLabel(example, capture)} ${isViewed ? 'marked viewed' : 'marked not viewed'}. ${viewed} of ${total} viewed.`,
		);
		if (!isViewed) {
			dispatch({ exampleId: example.id, type: 'unviewed' });
			return;
		}
		// Move to the next theme still to view, without marking it.
		const index = example.captures.findIndex((candidate) => candidate.id === capture.id);
		const ordered = [...example.captures.slice(index + 1), ...example.captures.slice(0, index)];
		const nextTheme = ordered.find((candidate) => stateOf(candidate) !== 'seen');
		const offer = {
			captureIds: [capture.id],
			exampleId: example.id,
			isPersistent: false,
			previous,
		};
		if (nextTheme) {
			dispatch({
				exampleId: example.id,
				nextCaptureId: nextTheme.id,
				offer: { ...offer, isFolded: false, label: `${exampleLabel(example, capture)} viewed` },
				type: 'themeViewed',
			});
			return;
		}
		dispatch({
			exampleId: example.id,
			offer: { ...offer, isFolded: true, label: `${example.name} viewed` },
			type: 'exampleViewed',
		});
		moveOnFrom(example);
	}

	function markExampleViewed(example: Example) {
		const marked = example.captures.filter((capture) => stateOf(capture) !== 'seen');
		const previous = storedFor(marked);
		setSeen(example.captures, true);
		announce(`All ${example.captures.length} themes of ${example.id} marked viewed.`);
		dispatch({
			exampleId: example.id,
			offer:
				marked.length > 0
					? {
							captureIds: marked.map((capture) => capture.id),
							exampleId: example.id,
							isFolded: true,
							isPersistent: false,
							label: `${example.name}: ${example.captures.length} themes viewed`,
							previous,
						}
					: undefined,
			type: 'exampleViewed',
		});
		moveOnFrom(example);
	}

	function markReportViewed() {
		const marked = report.captures.filter((capture) => stateOf(capture) !== 'seen');
		const previous = storedFor(marked);
		setSeen(marked, true);
		announce(`All ${total} captures marked viewed.`);
		dispatch({
			offer:
				marked.length > 0
					? {
							captureIds: marked.map((capture) => capture.id),
							exampleId: undefined,
							isFolded: false,
							isPersistent: true,
							label: `All ${total} viewed`,
							previous,
						}
					: undefined,
			type: 'reportViewed',
		});
	}

	function undoLast() {
		if (!undo) return;
		const { exampleId, isFolded, label, previous } = undo.offer;
		restoreSeen(previous);
		announce(`Undone: ${label}.`);
		dispatch({ type: 'undone' });
		if (exampleId) revealAfterRender(exampleId, { scroll: isFolded });
	}

	function setOpen(example: Example, isNowOpen: boolean) {
		dispatch({ exampleId: example.id, type: isNowOpen ? 'opened' : 'folded' });
	}

	/** `j` and `k` walk the open examples. Viewed rows are done, so they are stepped over. */
	function stepExample(offset: number) {
		const list = openExamples.length > 0 ? openExamples : examples;
		const index = list.findIndex((example) => example.id === currentExample?.id);
		const target = list[Math.min(Math.max(index + offset, 0), list.length - 1)];
		if (!target) return;
		dispatch({ exampleId: target.id, type: 'wentTo' });
		revealAfterRender(target.id);
	}

	function stepTheme(example: Example, offset: number) {
		const list = example.captures;
		if (list.length < 2) return;
		const index = list.findIndex((capture) => capture.id === activeCaptureOf(example)?.id);
		const target = list[(index + offset + list.length) % list.length];
		if (!target) return;
		openIfFolded(example);
		dispatch({ captureId: target.id, exampleId: example.id, type: 'themeSelected' });
		announce(`${example.name}: ${themeLabel(target)}, ${SEEN_STATE_TEXT[stateOf(target)]}.`);
	}

	function nextUnviewed() {
		const flat = examples.flatMap((example) =>
			example.captures.map((capture) => ({ capture, example })),
		);
		const index = flat.findIndex((entry) => entry.capture.id === currentCapture?.id);
		const ordered = [...flat.slice(index + 1), ...flat.slice(0, index + 1)];
		const target = ordered.find((entry) => stateOf(entry.capture) !== 'seen');
		if (!target) {
			announce(
				hideViewed || query || status !== 'all'
					? 'Nothing unviewed matches the filter.'
					: 'Every capture is viewed.',
			);
			return;
		}
		const exampleId = target.example.id;
		dispatch({ captureId: target.capture.id, exampleId, type: 'opened' });
		revealAfterRender(exampleId, {
			scroll: exampleId !== currentExample?.id || !isHeaderStuck(exampleId),
		});
	}

	function toggleViewed() {
		if (!currentExample || !currentCapture) return;
		openIfFolded(currentExample);
		setViewed(currentExample, currentCapture, stateOf(currentCapture) !== 'seen');
	}

	function copyLink(capture: Capture) {
		const url = new URL(window.location.href);
		url.searchParams.set('capture', capture.id);
		void navigator.clipboard?.writeText(url.toString()).then(
			() => announce('Link to this capture copied.'),
			() => announce('The link could not be copied.'),
		);
	}

	function showPane(next: Pane) {
		setParams({ layout: 'single', pane: next });
		announce(`Showing ${PANE_LABELS[next]}.`);
	}

	function toggleLayout(next: Layout) {
		setParams({ layout: layout === next ? 'single' : next });
	}

	function changeView(example: Example, capture: Capture, patch: Partial<CaptureView>) {
		dispatch({ captureId: capture.id, exampleId: example.id, patch, type: 'viewChanged' });
	}

	function setZoom(zoom: Zoom) {
		if (!currentCapture || !currentExample) return;
		openIfFolded(currentExample);
		changeView(currentExample, currentCapture, { zoom });
		// Keep the header in sight, so a zoom change does not lose the reviewer's place.
		const top = sectionElement(currentExample.id)?.getBoundingClientRect().top ?? Infinity;
		const exampleId = currentExample.id;
		if (top < readingLine()) afterRender.current = () => scrollToExample(exampleId);
	}

	function stepZoomBy(direction: -1 | 1) {
		setZoom(stepZoom(currentView.zoom, direction));
	}

	/**
	 * The zoom to step to a difference at. On a phone a capture fitted to the width is usually too
	 * small to judge, so stepping shows it at actual size, panned to the difference.
	 */
	function differenceZoom(zoom: Zoom): Zoom {
		const isScaledDown = (currentCapture?.width ?? 0) > metrics.availableWidth;
		if (isCompact && isScaledDown && (zoom === 'fit' || zoom === 'screen')) return '1';
		return zoom === 'screen' ? 'fit' : zoom;
	}

	/** Centres the next difference on screen. A zoomed capture also scrolls sideways to it. */
	function stepDifference(offset: number) {
		if (!currentCapture || !currentExample || !currentRegions?.length) return;
		const count = currentRegions.length;
		const active = currentView.activeRegion;
		// With no difference selected, stepping forward starts at the first and back at the last.
		const from = active ?? (offset > 0 ? -1 : count);
		const index = (from + offset + count) % count;
		openIfFolded(currentExample);
		changeView(currentExample, currentCapture, {
			activeRegion: index,
			zoom: differenceZoom(currentView.zoom),
		});
		if (isCompact) announce(`Difference ${index + 1} of ${count}`);
		if (!shouldOutline) setParams({ highlight: true });
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

	function setContentsOpen(isNowOpen: boolean) {
		dispatch({ isOpen: isNowOpen, type: 'contentsOpenChanged' });
	}

	/** Contents as a drawer covers the review, so acting from it closes it. A sidebar stays. */
	function closeContentsDrawer() {
		if (isDrawer) setContentsOpen(false);
	}

	function toggleContents() {
		if (isContentsOpen && document.activeElement?.closest('#review-contents')) {
			contentsToggleRef.current?.focus();
		}
		setContentsOpen(!isContentsOpen);
	}

	function openFilter() {
		setContentsOpen(true);
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
			t: toggleContents,
			u: nextUnviewed,
			v: toggleViewed,
			z: undoLast,
		},
		areShortcutsEnabled && dialog === undefined && !(isDrawer && isContentsOpen),
	);

	const metrics: StageMetrics = {
		// Phones run captures edge to edge, so a wide capture keeps every pixel of width it can.
		availableWidth: Math.max(mainWidth - (isCompact ? 0 : 48), 120),
		gap: isCompact ? 12 : 24,
		screenHeight: Math.max(
			viewportHeight -
				(isCompact ? TOP_BAR_HEIGHT.compact : TOP_BAR_HEIGHT.regular) -
				(isCompact ? BOTTOM_BAR_HEIGHT + 16 : 44 + 36 + 24 + 16),
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
					<Box display="grid" gap="space.8">
						{currentExample.captures.length > 1 ? (
							<Button
								className={styles.touchTarget}
								isDisabled={isExampleViewed(currentExample)}
								onPress={() => {
									setDialogOpen('view', false);
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
								setDialogOpen('view', false);
							}}
							prominence="low"
						>
							Copy link to this capture
						</Button>
					</Box>
				) : undefined
			}
			isCompact={isCompact}
			layout={layout}
			onLayout={(next) => setParams({ layout: next })}
			onOpacity={(opacity) => dispatch({ opacity, type: 'opacityChanged' })}
			onOutlines={(isOn) => setParams({ highlight: isOn })}
			onPane={showPane}
			onShortcuts={setShortcutsEnabled}
			onZoom={setZoom}
			opacity={state.opacity}
			pane={pane}
			shouldOutline={shouldOutline}
			target={target}
			zoom={currentView.zoom}
		/>
	);

	const review = pullRequestReview ? (
		<ReviewTrigger
			isCompact={isCompact}
			isOpen={dialog === 'review'}
			onOpenChange={(isNowOpen) => setDialogOpen('review', isNowOpen)}
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
				onStep={stepDifference}
				regions={currentRegions}
			/>
		) : null;

	/** The phone's image switch, or the one image an added or removed capture has. */
	const compareControl = (() => {
		if (!currentCapture) return <span />;
		if (currentCapture.status !== 'changed') {
			return (
				<span className={styles.bottomNote}>
					{`${describeShare(currentCapture)}: ${PANE_LABELS[paneFor(currentCapture, pane)]} only`}
				</span>
			);
		}
		return (
			<PaneSwitch
				areKeysHidden
				className={styles.bottomPanes}
				layout={layout}
				onPane={showPane}
				pane={pane}
			/>
		);
	})();

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
			onClose={() => setContentsOpen(false)}
			onHideViewed={(isHidden) => setParams({ hideViewed: isHidden })}
			onMarkAllViewed={() => {
				closeContentsDrawer();
				markReportViewed();
			}}
			onNextUnviewed={() => {
				closeContentsDrawer();
				nextUnviewed();
			}}
			onQuery={(next) => setParams({ query: next })}
			onSelect={(exampleId) => {
				closeContentsDrawer();
				dispatch({ exampleId, type: 'opened' });
				revealAfterRender(exampleId, { focus: !isCompact });
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

	const contentsToggle = (
		<IconButton
			aria-controls={!isDrawer || isContentsOpen ? 'review-contents' : undefined}
			aria-expanded={isContentsOpen}
			aria-label={isContentsOpen ? 'Hide contents sidebar' : 'Show contents sidebar'}
			className={styles.touchTarget}
			icon={<SidebarIcon />}
			onPress={toggleContents}
			prominence="low"
			ref={contentsToggleRef}
			size="medium"
		/>
	);

	return (
		<div className={styles.app}>
			<title>{`${currentCapture?.id ?? 'Review'} · ${sourceLabel(source)} · Visual review`}</title>
			<AppHeader
				actions={
					isCompact ? (
						<Progress isCompact total={total} viewed={viewedCount} />
					) : (
						<Box alignItems="center" display="flex" gap="space.16">
							<Box
								alignItems="center"
								aria-label="Capture in view"
								display="flex"
								gap="space.8"
								role="group"
							>
								{differences}
								<DialogTrigger
									isOpen={dialog === 'view'}
									onOpenChange={(isNowOpen) => setDialogOpen('view', isNowOpen)}
								>
									<Button
										endContent={<Icon name="chevronDown" size="xsmall" />}
										prominence="low"
										size="medium"
									>
										<Box alignItems="center" display="inline-flex" elementType="span" gap="space.4">
											<Text color="secondary" typography="label">
												View
											</Text>{' '}
											<Text typography="label">{showingLabel(layout, pane)}</Text>
										</Box>
									</Button>
									<Popover
										className={cx(overlayStyles.popover, overlayStyles.viewPopover)}
										offset={8}
										placement="bottom"
									>
										<Dialog aria-label="View options" className={overlayStyles.dialog}>
											<Box
												alignContent="start"
												backgroundColor="surface.raised"
												display="grid"
												gap="space.16"
												padding="space.16"
											>
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
								{viewedCheckbox}
							</Box>
							<Progress isCompact={false} total={total} viewed={viewedCount} />
							{review}
						</Box>
					)
				}
				reportTitle={
					isDrawer ? (
						<VisuallyHidden elementType="h1">{sourceLabel(source)}</VisuallyHidden>
					) : (
						<Heading
							className={styles.reportTitle}
							color="secondary"
							fontWeight="body"

							level={1}
							shouldDisableTrim
							typography="label"
						>
							{title}
						</Heading>
					)
				}
			>
				{contentsToggle}
			</AppHeader>

			<div className={styles.layout} data-contents-open={isContentsOpen ? '' : undefined}>
				{!isDrawer ? (
					<aside className={styles.sidebar} inert={!isContentsOpen}>
						{contents}
					</aside>
				) : null}
				<Box
					aria-label="Comparisons"
					backgroundColor="surface.base"
					className={styles.main}
					elementType="main"
					ref={mainRef}
				>
					{examples.length === 0 ? (
						<Box
							className={styles.empty}
							display="grid"
							gap="space.12"
							justifyItems="center"
							paddingBlock="space.64"
							paddingInline="space.24"
						>
							<p>No captures match the filter.</p>
							<Button
								onPress={() => setParams({ hideViewed: false, query: '', status: 'all' })}
								size="small"
							>
								Clear filter
							</Button>
						</Box>
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
										onSelectTheme={(captureId) =>
											dispatch({ captureId, exampleId: example.id, type: 'themeSelected' })
										}
										onZoom={(zoom) => changeView(example, capture, { zoom })}
										opacity={state.opacity}
										pane={pane}
										shouldOutline={shouldOutline}
										stateOf={stateOf}
										view={viewOf(capture.id)}
									/>
								);
							})
						: null}
				</Box>
			</div>

			{isCompact ? (
				<Box
					aria-label="Capture in view"
					backgroundColor="surface.subdued"
					className={styles.bottomBar}
					elementType="nav"
					gap="space.8"
					paddingInline="space.16"
					{...{ [CHROME_ATTRIBUTE.bottomBar]: '' }}
				>
					{/* What the reviewer compares with, beside the image it acts on. */}
					<Box
						alignItems="center"
						className={styles.bottomCompare}
						display="flex"
						gap="space.8"
						justifyContent="space-between"
					>
						{compareControl}
						{differences}
					</Box>
					<Box alignItems="center" display="flex" gap="space.8" justifyContent="space-between">
						{viewedCheckbox ?? <span />}
						<DialogTrigger
							isOpen={dialog === 'view'}
							onOpenChange={(isNowOpen) => setDialogOpen('view', isNowOpen)}
						>
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
										<Box
											alignContent="start"
											backgroundColor="surface.raised"
											display="grid"
											gap="space.24"
											padding="space.16"
										>
											<Box
												alignItems="center"
												display="flex"
												gap="space.12"
												justifyContent="space-between"
											>
												<Heading id="review-view-title" level={2} typography="lead">
													View
												</Heading>
												<IconButton
													aria-label="Close"
													className={styles.touchTarget}
													icon="close"
													onPress={() => setDialogOpen('view', false)}
													prominence="low"
												/>
											</Box>
											{viewOptions}
										</Box>
									</Dialog>
								</Modal>
							</ModalOverlay>
						</DialogTrigger>
						{review}
					</Box>
				</Box>
			) : null}

			{isDrawer ? (
				<ModalOverlay
					className={overlayStyles.drawerOverlay}
					isDismissable
					isOpen={isContentsOpen}
					onOpenChange={setContentsOpen}
				>
					<Modal className={overlayStyles.drawer}>
						<Dialog aria-label="Contents" className={overlayStyles.dialog}>
							{contents}
						</Dialog>
					</Modal>
				</ModalOverlay>
			) : null}

			{undo ? (
				<div
					className={styles.toast}
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) setUndoHeld(false);
					}}
					onFocus={() => setUndoHeld(true)}
					onPointerEnter={() => setUndoHeld(true)}
					onPointerLeave={() => setUndoHeld(false)}
				>
					<Lockup gap="space.12" railAlignment="center">
						<LockupBody className={styles.truncate}>{undo.offer.label}</LockupBody>
						<LockupRail>
							<Box alignItems="center" display="flex" gap="space.4">
								<Button onPress={undoLast} prominence="low" size="small">
									Undo
								</Button>
								{undo.offer.isPersistent ? (
									<IconButton
										aria-label="Dismiss"
										icon="close"
										onPress={() => dispatch({ type: 'undoDismissed' })}
										prominence="low"
										size="small"
									/>
								) : null}
							</Box>
						</LockupRail>
					</Lockup>
				</div>
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
