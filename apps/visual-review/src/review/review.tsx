import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import { Link } from '@luke-ui/react/link';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { AppHeader } from '../app-header.js';
import { hrefWithParams, navigate, useLocationSearch } from '../navigation/location.js';
import type { ReportSource } from '../report/report-source.js';
import type { Capture, Report } from '../report/schema.js';
import { Contents } from './contents.js';
import { differenceZoom, steppedDifference } from './difference-stepping.js';
import type { ExampleSectionHandle } from './example-section.js';
import { ExampleSection, SEEN_STATE_TEXT } from './example-section.js';
import type { Example } from './examples.js';
import { exampleLabel, findFrom, groupExamples, themeLabel } from './examples.js';
import { useContentWidth, useIsCompact, useIsDrawer, useViewportHeight } from './layout-hooks.js';
import * as overlayStyles from './overlays.css.js';
import { ReportTitle, sourceLabel } from './report-title.js';
import { ReviewTrigger } from './review-panel.js';
import type { ReviewParams, StatusFilter, Zoom } from './review-params.js';
import { filterCaptures, parseReviewParams, reviewParamValues, stepZoom } from './review-params.js';
import type { ReviewDialog, RevealTarget } from './review-state.js';
import { DEFAULT_VIEW, initialReviewState, reviewReducer } from './review-state.js';
import * as styles from './review.css.js';
import { useSeen } from './seen-store.js';
import { ShortcutsTrigger } from './shortcuts.js';
import { Sidebar, SIDEBAR_ID } from './sidebar.js';
import { stageMetrics } from './stage-metrics.js';
import type { CaptureView } from './stage.js';
import { useRegions } from './stage.js';
import { Progress, SidebarIcon } from './top-bar-parts.js';
import { UndoToast } from './undo-toast.js';
import { usePullRequestReview } from './use-pull-request-review.js';
import type { Shortcut } from './use-review-shortcuts.js';
import { useReviewShortcuts } from './use-review-shortcuts.js';
import { useScrollSpy } from './use-scroll-spy.js';

type ReviewProps = { baseUrl: string; report: Report; source: ReportSource };

/** One scrolling report with capture controls inside each example. */
export function Review({ baseUrl, report, source }: ReviewProps) {
	const params = parseReviewParams(useLocationSearch());
	const { restoreSeen, setSeen, stateOf, storedFor } = useSeen();
	const pullRequestReview = usePullRequestReview(
		source.kind === 'pull-request' ? source.number : undefined,
	);
	const allExamples = useMemo(() => groupExamples(report.captures), [report.captures]);
	const isCompact = useIsCompact();
	const isDrawer = useIsDrawer();
	const { hideViewed, query, status } = params;
	const hasContents = allExamples.length > 1 || hideViewed || query !== '' || status !== 'all';
	const [state, dispatch] = useReducer(
		reviewReducer,
		{
			captureId: params.capture,
			examples: allExamples,
			isContentsOpen: hasContents && !isDrawer,
			view: {
				highlight: params.highlight,
				layout: params.layout,
				split: params.split,
				zoom: params.zoom,
			},
		},
		initialReviewState,
	);
	const {
		activeTheme,
		announcement,
		current,
		dialog,
		expanded,
		isContentsOpen,
		reveal,
		undo,
		views,
	} = state;
	const viewportHeight = useViewportHeight();
	const mainRef = useRef<HTMLElement>(null);
	const mainWidth = useContentWidth(mainRef);
	const sectionsRef = useRef(new Map<string, ExampleSectionHandle>());
	const filterRef = useRef<HTMLInputElement>(null);
	const contentsToggleRef = useRef<HTMLButtonElement>(null);

	function isSeen(capture: Capture) {
		return stateOf(capture) === 'seen';
	}
	function hasViewedAll(example: Example) {
		return example.captures.every(isSeen);
	}
	const viewedExamples = new Set(allExamples.filter(hasViewedAll).map((example) => example.id));

	// Only matching themes are shown. Hiding viewed examples removes them after their last match.
	const matching = new Set(filterCaptures(report.captures, { query, status }).map((c) => c.id));
	const examples = allExamples.flatMap((example) => {
		const captures = example.captures.filter((capture) => matching.has(capture.id));
		if (captures.length === 0) return [];
		const shown = { ...example, captures };
		if (hideViewed && hasViewedAll(shown)) return [];
		return [shown];
	});

	const total = report.captures.length;
	let viewedCount = 0;
	let changedCount = 0;
	for (const capture of report.captures) {
		const seenState = stateOf(capture);
		if (seenState === 'seen') viewedCount += 1;
		if (seenState === 'changed') changedCount += 1;
	}

	function activeCaptureOf(example: Example): Capture | undefined {
		const chosen = example.captures.find((capture) => capture.id === activeTheme[example.id]);
		return chosen ?? example.captures.find((capture) => !isSeen(capture)) ?? example.captures[0];
	}
	function isOpen(example: Example) {
		return expanded[example.id] ?? !viewedExamples.has(example.id);
	}
	function viewOf(captureId: string) {
		return views[captureId] ?? DEFAULT_VIEW;
	}
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
	const metrics = stageMetrics({ isCompact, mainWidth, viewportHeight });

	// Keep the URL scoped to the capture currently in view.
	useEffect(() => {
		const layout = currentCapture?.status === 'changed' ? currentView.layout : 'single';
		replaceParams({
			...reviewParamValues({ hideViewed, query, status, ...currentView, layout }),
			capture: currentCapture?.id,
		});
	}, [currentCapture, currentView, hideViewed, query, status]);

	const revealExampleId = reveal?.target.exampleId;
	useScrollSpy({
		currentId: currentExample?.id,
		dispatch,
		isPaused:
			// An example asked for but filtered out never comes into view, so it holds nothing up.
			(reveal?.target.kind === 'example' &&
				examples.some((example) => example.id === revealExampleId)) ||
			(isDrawer && isContentsOpen) ||
			(isCompact && dialog !== undefined),
		mainRef,
		sections: examples.map((example) => ({
			id: example.id,
			isEligible: isOpen(example) || !viewedExamples.has(example.id),
		})),
		sectionsRef,
	});

	function setParams(next: Partial<Pick<ReviewParams, 'hideViewed' | 'query' | 'status'>>) {
		replaceParams(reviewParamValues({ ...params, ...next }));
	}

	function requestReveal(target: RevealTarget) {
		dispatch({ target, type: 'revealRequested' });
	}

	/** Scrolls to an example, and can focus it, once the render that shows it has committed. */
	function revealExample(exampleId: string, { focus = false, scroll = true } = {}) {
		if (!focus && !scroll) return;
		requestReveal({ exampleId, kind: 'example', shouldFocus: focus, shouldScroll: scroll });
	}

	/**
	 * Opens the next example in report order with a theme still to view, even one folded by hand.
	 * `isSeenNow` counts the mark just made, which `stateOf` reads only after the next render.
	 */
	function moveOnFrom(example: Example, isSeenNow: (capture: Capture) => boolean) {
		const index = examples.findIndex((candidate) => candidate.id === example.id);
		const next = findFrom(examples, index, (candidate) => !candidate.captures.every(isSeenNow));
		const nextCapture = next?.captures.find((capture) => !isSeenNow(capture));
		if (next && nextCapture) {
			dispatch({ captureId: nextCapture.id, exampleId: next.id, type: 'opened' });
			revealExample(next.id, { focus: true });
		} else if (!hideViewed) {
			revealExample(example.id, { focus: true });
		}
	}

	function setViewed(example: Example, capture: Capture, isViewed: boolean) {
		if (!capture.fingerprint) return;
		const previous = storedFor([capture]);
		const position = sectionsRef.current.get(example.id)?.position();
		if (!setSeen(capture, isViewed)) return;
		const isSeenNow = (candidate: Capture) =>
			candidate.id === capture.id ? isViewed : isSeen(candidate);
		const viewed = report.captures.filter(isSeenNow).length;
		announce(
			`${exampleLabel(example, capture)} ${isViewed ? 'marked viewed' : 'marked not viewed'}. ${viewed} of ${total} viewed.`,
		);
		if (!isViewed) {
			dispatch({ exampleId: example.id, type: 'unviewed' });
			return;
		}
		// Move to the next theme still to view, without marking it. A theme a filter hides keeps the
		// example open, but the review moves on.
		const index = example.captures.findIndex((candidate) => candidate.id === capture.id);
		const nextShown = findFrom(example.captures, index, (candidate) => !isSeenNow(candidate));
		const nextHidden = allExamples
			.find((candidate) => candidate.id === example.id)
			?.captures.find((candidate) => !isSeenNow(candidate));
		const nextTheme = nextShown ?? nextHidden;
		dispatch({
			exampleId: example.id,
			nextCaptureId: nextTheme?.id,
			offer: {
				captureId: capture.id,
				exampleId: example.id,
				label: nextTheme ? `${exampleLabel(example, capture)} viewed` : `${example.name} viewed`,
				position,
				previous,
			},
			type: 'markedViewed',
		});
		if (nextShown) revealExample(example.id);
		else moveOnFrom(example, isSeenNow);
	}

	function undoLast() {
		if (!undo) return;
		const { exampleId, label, position, previous } = undo.offer;
		if (!restoreSeen(previous)) return;
		announce(`Undone: ${label}.`);
		dispatch({ type: 'undone' });
		requestReveal({
			exampleId,
			kind: 'example',
			restore: position,
			shouldFocus: true,
			shouldScroll: true,
		});
	}

	function setOpen(example: Example, isNowOpen: boolean) {
		if (isNowOpen) openIfFolded(example);
		else dispatch({ exampleId: example.id, type: 'folded' });
	}

	/** `j` and `k` walk the open examples. Viewed rows are done, so they are stepped over. */
	function stepExample(offset: number) {
		const list = openExamples.length > 0 ? openExamples : examples;
		const index = list.findIndex((example) => example.id === currentExample?.id);
		const target = list[Math.min(Math.max(index + offset, 0), list.length - 1)];
		if (!target) return;
		dispatch({ exampleId: target.id, type: 'wentTo' });
		revealExample(target.id);
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
		const target = findFrom(flat, index, (entry) => !isSeen(entry.capture));
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
		revealExample(exampleId);
	}

	function toggleViewed() {
		if (!currentExample || !currentCapture?.fingerprint) return;
		openIfFolded(currentExample);
		setViewed(currentExample, currentCapture, !isSeen(currentCapture));
	}

	function toggleCompare(example: Example, capture: Capture) {
		if (capture.status !== 'changed') return;
		const layout = viewOf(capture.id).layout === 'compare' ? 'single' : 'compare';
		changeView(example, capture, { layout });
	}

	function toggleHighlight(example: Example, capture: Capture) {
		if (capture.status !== 'changed') return;
		changeView(example, capture, { highlight: !viewOf(capture.id).highlight });
	}

	function changeView(example: Example, capture: Capture, patch: Partial<CaptureView>) {
		dispatch({ captureId: capture.id, exampleId: example.id, patch, type: 'viewChanged' });
	}

	function setZoom(zoom: Zoom) {
		if (!currentCapture || !currentExample) return;
		openIfFolded(currentExample);
		changeView(currentExample, currentCapture, { zoom });
	}

	function stepZoomBy(direction: -1 | 1) {
		setZoom(stepZoom(currentView.zoom, direction));
	}

	/**
	 * Centres the next of a capture's `count` differences on screen. A zoomed capture also scrolls
	 * sideways to it.
	 */
	function stepDifference(example: Example, capture: Capture, count: number, offset: number) {
		if (count === 0) return;
		const view = viewOf(capture.id);
		const index = steppedDifference(view.activeRegion, count, offset);
		const zoom = differenceZoom(view.zoom, {
			availableWidth: metrics.availableWidth,
			captureWidth: capture.width,
		});
		openIfFolded(example);
		changeView(example, capture, { activeRegion: index, highlight: true, zoom });
		if (isCompact) announce(`Difference ${index + 1} of ${count}`);
		requestReveal({ exampleId: example.id, kind: 'difference' });
	}

	/** `d` and `D` step through the capture in view. */
	function stepCurrentDifference(offset: number) {
		if (!currentExample || !currentCapture) return;
		stepDifference(currentExample, currentCapture, currentRegions?.length ?? 0, offset);
	}

	function setContentsOpen(isNowOpen: boolean) {
		dispatch({ isOpen: isNowOpen, type: 'contentsOpenChanged' });
	}

	/** Contents as a drawer covers the review, so acting from it closes it. A sidebar stays. */
	function closeContentsDrawer() {
		if (isDrawer) setContentsOpen(false);
	}

	function toggleContents() {
		if (isContentsOpen && document.activeElement?.closest(`#${SIDEBAR_ID}`)) {
			contentsToggleRef.current?.focus();
		}
		setContentsOpen(!isContentsOpen);
	}

	function openFilter() {
		setContentsOpen(true);
		// After the Contents drawer has opened and placed its own focus.
		requestAnimationFrame(() => filterRef.current?.focus());
	}

	/** Runs `action` on the example and capture in view. */
	function onCurrent(action: (example: Example, capture: Capture) => void) {
		return () => {
			if (currentExample && currentCapture) action(currentExample, currentCapture);
		};
	}

	const shortcuts: ReadonlyArray<Shortcut> = [
		{
			keys: { j: () => stepExample(1), k: () => stepExample(-1) },
			label: 'Next, previous example',
		},
		{
			keys: {
				'[': onCurrent((example) => stepTheme(example, -1)),
				']': onCurrent((example) => stepTheme(example, 1)),
			},
			label: 'Previous, next theme',
		},
		{ keys: { v: toggleViewed }, label: 'Mark viewed or not viewed' },
		{ keys: { u: nextUnviewed }, label: 'Next unviewed' },
		{ keys: { z: undoLast }, label: 'Undo the last mark' },
		{
			keys: { d: () => stepCurrentDifference(1), D: () => stepCurrentDifference(-1) },
			label: 'Next, previous change',
		},
		{ keys: { c: onCurrent(toggleCompare) }, label: 'Compare Before and After' },
		{ keys: { h: onCurrent(toggleHighlight) }, label: 'Show or hide highlights' },
		{
			display: '+ −',
			keys: { '+': () => stepZoomBy(1), '-': () => stepZoomBy(-1), '=': () => stepZoomBy(1) },
			label: 'Zoom in, out',
		},
		{ keys: { '0': () => setZoom('fit') }, label: 'Fit width' },
		...(hasContents
			? [{ keys: { t: toggleContents, '/': openFilter }, label: 'Contents, filter' }]
			: []),
		// Phones have no keyboard, so they have no list of shortcuts.
		...(isCompact
			? []
			: [{ keys: { '?': () => setDialogOpen('shortcuts', true) }, label: 'Shortcuts' }]),
	];
	useReviewShortcuts(shortcuts, dialog === undefined && !(isDrawer && isContentsOpen));

	const title = <ReportTitle report={report} source={source} />;
	const progress = { total, viewed: viewedCount };

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

	const contents = (
		<Contents
			changedCount={changedCount}
			currentId={currentExample?.id}
			examples={examples}
			filterRef={filterRef}
			hasStatuses={new Set(report.captures.map((capture) => capture.status)).size > 1}
			hideViewed={hideViewed}
			isCompact={isCompact}
			isOverlay={isDrawer}
			onClose={() => setContentsOpen(false)}
			onHideViewed={(isHidden) => setParams({ hideViewed: isHidden })}
			onQuery={(next) => setParams({ query: next })}
			onSelect={(exampleId) => {
				closeContentsDrawer();
				dispatch({ exampleId, type: 'opened' });
				revealExample(exampleId, { focus: true });
			}}
			onStatus={(next: StatusFilter) => setParams({ status: next })}
			query={query}
			stateOf={stateOf}
			status={status}
		/>
	);

	const sidebar = <Sidebar isOverlay={isDrawer}>{contents}</Sidebar>;

	const contentsToggle = (
		<IconButton
			aria-controls={!isDrawer || isContentsOpen ? SIDEBAR_ID : undefined}
			aria-expanded={isContentsOpen}
			aria-label={isContentsOpen ? 'Hide contents' : 'Show contents'}
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
					<Box
						alignItems="center"
						display="flex"
						flexShrink="0"
						gap={{ initial: 'space.8', bp768: 'space.16' }}
					>
						{isCompact ? null : (
							<ShortcutsTrigger
								isOpen={dialog === 'shortcuts'}
								onOpenChange={(isNowOpen) => setDialogOpen('shortcuts', isNowOpen)}
								shortcuts={shortcuts}
							/>
						)}
						<Progress isCompact={isCompact} total={total} viewed={viewedCount} />
						{review}
					</Box>
				}
				reportTitle={
					<Heading
						className={styles.reportTitle}
						color="secondary"
						fontWeight="body"
						level={1}
						lineClamp
						shouldDisableTrim
						typography="label"
					>
						{title}
					</Heading>
				}
			>
				{hasContents ? contentsToggle : null}
			</AppHeader>

			<div
				className={styles.layout}
				data-contents-open={!isDrawer && hasContents && isContentsOpen ? '' : undefined}
				data-has-sidebar={!isDrawer && hasContents ? '' : undefined}
			>
				{!isDrawer && hasContents ? (
					<aside className={styles.sidebar} inert={!isContentsOpen}>
						{sidebar}
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
										baseUrl={baseUrl}
										example={example}
										isCompact={isCompact}
										isCurrent={isCurrent}
										isOpen={isOpen(example)}
										key={example.id}
										metrics={metrics}
										onCompare={() => toggleCompare(example, capture)}
										onOpenChange={(isNowOpen) => setOpen(example, isNowOpen)}
										onRevealed={(seq) => dispatch({ seq, type: 'revealed' })}
										ref={(handle) => {
											if (handle) sectionsRef.current.set(example.id, handle);
											return () => {
												sectionsRef.current.delete(example.id);
											};
										}}
										onSelectTheme={(captureId) =>
											dispatch({ captureId, exampleId: example.id, type: 'themeSelected' })
										}
										onStepDifference={(offset, count) =>
											stepDifference(example, capture, count, offset)
										}
										onSplit={(split) => changeView(example, capture, { split })}
										onViewedChange={(isViewed) => setViewed(example, capture, isViewed)}
										onZoom={(zoom) => changeView(example, capture, { zoom })}
										reveal={revealExampleId === example.id ? reveal : undefined}
										stateOf={stateOf}
										view={viewOf(capture.id)}
									/>
								);
							})
						: null}
					{hasContents ? null : (
						<Box elementType="footer" paddingBlockStart="space.16">
							<Link href={window.location.pathname}>All open pull requests</Link>
						</Box>
					)}
				</Box>
			</div>

			{isDrawer && hasContents ? (
				<ModalOverlay
					className={overlayStyles.drawerOverlay}
					isDismissable
					isOpen={isContentsOpen}
					onOpenChange={setContentsOpen}
				>
					<Modal className={overlayStyles.drawer}>
						<Dialog aria-label="Contents" className={overlayStyles.dialog}>
							{sidebar}
						</Dialog>
					</Modal>
				</ModalOverlay>
			) : null}

			{undo ? (
				<UndoToast
					onDismiss={() => dispatch({ type: 'undoDismissed' })}
					onHeldChange={setUndoHeld}
					onUndo={undoLast}
					undo={undo}
				/>
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
