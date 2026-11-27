import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { use, useState } from 'react';
import { AppHeader } from '../app-header.js';
import type { ReportResult } from '../report/load-report.js';
import { loadReport } from '../report/load-report.js';
import type { ReportSource } from '../report/report-source.js';
import type { Report } from '../report/schema.js';
import { useIsCompact } from './layout-hooks.js';
import { ReportTitle, sourceLabel } from './report-title.js';
import { ReviewTrigger } from './review-panel.js';
import * as styles from './review.css.js';
import { Review } from './review.js';
import { usePullRequestReview } from './use-pull-request-review.js';

/**
 * Reviews one report. A report that cannot be loaded, or that has no differences, gets a message
 * instead, with the pull request's review status still in reach.
 */
export function ReviewPage({ source }: { source: ReportSource }) {
	const result = use(loadReport(source));

	if (result.status !== 'ready') {
		return (
			<MessagePage report={undefined} source={source} title={unavailableTitle(source)}>
				<Text color="secondary" elementType="p">
					{unavailableReason(source, result.status)}
				</Text>
			</MessagePage>
		);
	}
	if (result.report.captures.length === 0) {
		const { added, changed, removed, unchanged } = result.report.counts;
		return (
			<MessagePage report={result.report} source={source} title="No visual changes">
				<Text color="secondary" elementType="p">
					{`${changed} changed · ${added} added · ${removed} removed · ${unchanged} unchanged`}
				</Text>
			</MessagePage>
		);
	}
	return <Review baseUrl={result.baseUrl} report={result.report} source={source} />;
}

type MessagePageProps = {
	children: ReactNode;
	report: Report | undefined;
	source: ReportSource;
	title: string;
};

function MessagePage({ children, report, source, title }: MessagePageProps) {
	const isCompact = useIsCompact();
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const review = usePullRequestReview(source.kind === 'pull-request' ? source.number : undefined);
	return (
		<div className={styles.app}>
			<title>{`${sourceLabel(source)} · Squint`}</title>
			<AppHeader
				actions={
					review ? (
						<ReviewTrigger
							isCompact={isCompact}
							isOpen={isReviewOpen}
							onOpenChange={setIsReviewOpen}
							progress={undefined}
							report={report}
							review={review}
						/>
					) : null
				}
				reportTitle={
					<Text color="secondary" elementType="div" lineClamp>
						<ReportTitle report={report} source={source} />
					</Text>
				}
			/>
			<Box backgroundColor="surface.base" className={styles.messagePanel} elementType="main">
				<Box className={styles.message}>
					<Stack gap="space.16">
						<Heading level={1} typography="heading3">
							{title}
						</Heading>
						{children}
						<Text elementType="p">
							<Link href={window.location.pathname}>All open pull requests</Link>
						</Text>
					</Stack>
				</Box>
			</Box>
		</div>
	);
}

type UnavailableStatus = Exclude<ReportResult['status'], 'ready'>;

function unavailableTitle(source: ReportSource) {
	return `No report for ${sourceLabel(source).toLowerCase()}`;
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
