import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { use, useCallback, useMemo, useRef, useState } from 'react';
import { commitUrl, pullRequestUrl } from '../config.js';
import { hrefWithParams, navigate, useLocationSearch } from '../navigation/location.js';
import type { ReportResult } from '../report/load-report.js';
import { loadReport } from '../report/load-report.js';
import type { ReportSource } from '../report/report-source.js';
import type { Report } from '../report/schema.js';
import { CaptureList } from './capture-list.js';
import { CaptureViewer } from './capture-viewer.js';
import {
	filterCaptures,
	parseReviewParams,
	stepCapture,
	stepZoom,
	VIEW_MODES,
} from './review-params.js';
import * as styles from './review.css.js';
import type { ReviewShortcuts } from './use-review-shortcuts.js';
import { useReviewShortcuts } from './use-review-shortcuts.js';

export function ReviewPage({ source }: { source: ReportSource }) {
	const result = use(loadReport(source));

	if (result.status !== 'ready')
		return <ReportUnavailable source={source} status={result.status} />;
	if (result.report.captures.length === 0) {
		return (
			<Message title="No visual changes">
				<ReportSummary report={result.report} source={source} />
			</Message>
		);
	}
	return <Review baseUrl={result.baseUrl} report={result.report} source={source} />;
}

type ReviewProps = { baseUrl: string; report: Report; source: ReportSource };

function Review({ baseUrl, report, source }: ReviewProps) {
	const search = useLocationSearch();
	const params = parseReviewParams(search);
	const [opacity, setOpacity] = useState(50);
	const filterRef = useRef<HTMLDivElement>(null);

	const captures = useMemo(
		() => filterCaptures(report.captures, { query: params.query, status: params.status }),
		[report.captures, params.query, params.status],
	);
	const selected = captures.find((capture) => capture.id === params.capture) ?? captures[0];
	const selectedId = selected?.id;
	const { highlight, view, zoom } = params;

	const setParams = useCallback(
		(updates: Record<string, string | undefined>) => {
			navigate(hrefWithParams(search, updates), { replace: true });
		},
		[search],
	);

	const shortcuts = useMemo<ReviewShortcuts>(() => {
		const step = (offset: number) => {
			setParams({ capture: stepCapture(captures, selectedId, offset)?.id });
		};
		const setZoom = (next: string) => setParams({ zoom: next === 'fit' ? undefined : next });
		return {
			'-': () => setZoom(stepZoom(zoom, -1)),
			'/': () => filterRef.current?.querySelector('input')?.focus(),
			'+': () => setZoom(stepZoom(zoom, 1)),
			'=': () => setZoom(stepZoom(zoom, 1)),
			'0': () => setZoom('fit'),
			'1': () => setParams({ view: undefined }),
			'2': () => setParams({ view: VIEW_MODES[1] }),
			'3': () => setParams({ view: VIEW_MODES[2] }),
			f: () => {
				if (view !== 'overlay') setParams({ view: 'overlay' });
				setOpacity((current) => (current < 50 ? 100 : 0));
			},
			h: () => setParams({ highlight: highlight ? 'off' : undefined }),
			j: () => step(1),
			k: () => step(-1),
		};
	}, [captures, highlight, selectedId, setParams, view, zoom]);
	useReviewShortcuts(shortcuts);

	return (
		<>
			<title>{`${selectedId ?? 'Review'} · ${sourceLabel(source)} · Visual review`}</title>
			<Box
				alignItems="center"
				backgroundColor="surface.base"
				borderBlockEndWidth="thin"
				borderColor="decorative"
				borderStyle="solid"
				borderWidth="none"
				display="flex"
				flexShrink="0"
				flexWrap="wrap"
				gap="space.16"
				justifyContent="space-between"
				paddingBlock="space.12"
				paddingInline="space.16"
			>
				<ReportSummary report={report} source={source} />
			</Box>
			<div className={styles.layout}>
				<CaptureList
					allCaptures={report.captures}
					captures={captures}
					filterRef={filterRef}
					onParamsChange={setParams}
					params={params}
					search={search}
					selectedId={selectedId}
				/>
				{selected ? (
					<CaptureViewer
						baseUrl={baseUrl}
						capture={selected}
						onOpacityChange={setOpacity}
						onParamsChange={setParams}
						onStep={(offset) => {
							setParams({ capture: stepCapture(captures, selectedId, offset)?.id });
						}}
						opacity={opacity}
						params={params}
						position={{ index: captures.indexOf(selected), total: captures.length }}
					/>
				) : (
					<Message title="No captures match the filter" />
				)}
			</div>
		</>
	);
}

function ReportSummary({ report, source }: { report: Report; source: ReportSource }) {
	const { added, changed, removed, unchanged } = report.counts;
	return (
		<>
			<Text fontWeight="label">
				{source.kind === 'pull-request' ? (
					<Link href={pullRequestUrl(source.number)} target="_blank">
						{sourceLabel(source)}
					</Link>
				) : (
					sourceLabel(source)
				)}
				{report.meta ? (
					<>
						{' at '}
						<Link href={commitUrl(report.meta.headSha)} target="_blank">
							{report.meta.headSha.slice(0, 7)}
						</Link>
					</>
				) : null}
			</Text>
			<Text color="secondary" typography="caption">
				{`${changed} changed · ${added} added · ${removed} removed · ${unchanged} unchanged`}
			</Text>
		</>
	);
}

type UnavailableStatus = Exclude<ReportResult['status'], 'ready'>;

function ReportUnavailable({
	source,
	status,
}: {
	source: ReportSource;
	status: UnavailableStatus;
}) {
	return (
		<Message title={`No report for ${sourceLabel(source).toLowerCase()}`}>
			<Text color="secondary" elementType="p">
				{unavailableReason(source, status)}
			</Text>
		</Message>
	);
}

function unavailableReason(source: ReportSource, status: UnavailableStatus) {
	if (status === 'invalid') return 'The report was found but could not be read.';
	if (status === 'unconfigured') {
		return source.kind === 'local'
			? 'Local comparisons are only served by the development server.'
			: 'This build has no pull request data source. Set VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE, or open ?source=local.';
	}
	return source.kind === 'local'
		? 'Run pnpm test:visual to write a comparison to .artifacts/visual-regression.'
		: 'The comparison may still be running, or the pull request may change only documentation.';
}

function Message({ children, title }: { children?: React.ReactNode; title: string }) {
	return (
		<Stack className={styles.message} gap="space.16">
			<Heading level={1} typography="heading3">
				{title}
			</Heading>
			{children}
			<Text elementType="p">
				<Link href={window.location.pathname}>All open pull requests</Link>
			</Text>
		</Stack>
	);
}

function sourceLabel(source: ReportSource) {
	return source.kind === 'local' ? 'Local comparison' : `Pull request #${source.number}`;
}
