import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { Suspense, use } from 'react';
import type { Review } from '../api/review-api.js';
import { AppHeader } from '../app-header.js';
import { isLocalSourceAvailable, repository } from '../config.js';
import { loadReport } from '../report/load-report.js';
import * as styles from './dashboard.css.js';
import type { PullRequest, PullRequestsResult } from './open-pull-requests.js';
import { loadOpenPullRequests } from './open-pull-requests.js';
import { orderByReview, reviewChip } from './pull-status.js';
import type { ReportState } from './report-state.js';
import { reportState } from './report-state.js';

const STATE_LABELS = {
	'no-differences': 'No visual changes',
	'no-report': 'No report',
	'out-of-date': 'Report is for an older commit',
	unconfigured: 'No data source',
} as const satisfies Record<Exclude<ReportState['kind'], 'differences'>, string>;

export function DashboardPage() {
	const result = use(loadOpenPullRequests());

	return (
		<>
			<title>Visual review</title>
			<AppHeader />
			<main className={styles.main}>
				<div className={styles.intro}>
					<Heading level={1} typography="heading3">
						Open pull requests
					</Heading>
					<Text color="secondary" elementType="p">
						{`Visual differences between each pull request and main in ${repository}.`}
					</Text>
				</div>
				<PullRequestList result={result} />
				{isLocalSourceAvailable ? (
					<section aria-labelledby="local-title" className={styles.group}>
						<Heading className={styles.groupTitle} id="local-title" level={2} typography="label">
							On this machine
						</Heading>
						<ul className={styles.list}>
							<Row
								meta=".artifacts/visual-regression"
								title={<Link href="?source=local">Local comparison</Link>}
							>
								<Link appearance="button" href="?source=local" size="small">
									Review
								</Link>
							</Row>
						</ul>
					</section>
				) : null}
			</main>
		</>
	);
}

type RowProps = { children: ReactNode; meta: string; title: ReactNode };

/** One report to review. The title's link covers the row; `children` sit at its end. */
function Row({ children, meta, title }: RowProps) {
	return (
		<Box backgroundColor="surface.subdued" className={styles.row} elementType="li">
			<div className={styles.rowText}>
				<Text className={styles.title} fontWeight="label">
					{title}
				</Text>
				<Text className={styles.meta} color="secondary" typography="caption">
					{meta}
				</Text>
			</div>
			<div className={styles.rowEnd}>{children}</div>
		</Box>
	);
}

function PullRequestList({ result }: { result: PullRequestsResult }) {
	if (result.status !== 'ready') {
		return (
			<Box
				backgroundColor="surface.subdued"
				className={styles.notice}
				elementType="div"
				role="status"
			>
				<Text color="secondary" elementType="p">
					{result.status === 'rate-limited'
						? 'GitHub has rate limited this address. Try again in a few minutes, or open a pull request’s review from its comment.'
						: 'The list of open pull requests could not be loaded from GitHub.'}
				</Text>
			</Box>
		);
	}
	if (result.pullRequests.length === 0) {
		return (
			<Box backgroundColor="surface.subdued" className={styles.notice} elementType="div">
				<Text color="secondary" elementType="p">
					No pull requests are open.
				</Text>
			</Box>
		);
	}
	return (
		<ul aria-label="Open pull requests" className={styles.list}>
			{orderByReview(result.pullRequests).map((pullRequest) => (
				<Row
					key={pullRequest.number}
					meta={describePullRequest(pullRequest)}
					title={
						<Link href={`?pr=${pullRequest.number}`}>
							<span className={styles.number}>{`#${pullRequest.number}`}</span>
							{pullRequest.title}
						</Link>
					}
				>
					{pullRequest.review === undefined ? null : <ReviewStatus review={pullRequest.review} />}
					<Suspense fallback={<LoadingSpinner aria-label="Loading report" size="small" />}>
						<PullRequestReport pullRequest={pullRequest} />
					</Suspense>
				</Row>
			))}
		</ul>
	);
}

function PullRequestReport({ pullRequest }: { pullRequest: PullRequest }) {
	const result = use(loadReport({ kind: 'pull-request', number: pullRequest.number }));
	const state = reportState(result, pullRequest.headSha);

	if (state.kind !== 'differences') {
		// Hide only a report label already shown by the review status.
		const chip = pullRequest.review === undefined ? undefined : reviewChip(pullRequest.review);
		if (chip?.label === STATE_LABELS[state.kind]) return null;
		return <Text color="secondary">{STATE_LABELS[state.kind]}</Text>;
	}
	return (
		<>
			<Text color="secondary">{describeDifferences(state)}</Text>
			<Link appearance="button" href={`?pr=${pullRequest.number}`} size="small">
				Review
			</Link>
		</>
	);
}

const STATUS_ICONS = { approved: 'check', 'changes-requested': 'exclamationTriangle' } as const;

/** The review's state in its role colour, as the review page's top bar shows it. */
function ReviewStatus({ review }: { review: Review | null }) {
	const chip = reviewChip(review);
	if (!chip || !review) return null;
	const icon =
		review.state === 'approved' || review.state === 'changes-requested'
			? STATUS_ICONS[review.state]
			: undefined;
	return (
		<Text className={styles.status} color={chip.color} fontWeight="label">
			{icon ? <Icon name={icon} size="xsmall" /> : null}
			{chip.label}
		</Text>
	);
}

function describePullRequest(pullRequest: PullRequest) {
	const parts = [pullRequest.headRef];
	if (pullRequest.author) parts.unshift(pullRequest.author);
	if (pullRequest.draft) parts.push('draft');
	return parts.join(' · ');
}

function describeDifferences(state: Extract<ReportState, { kind: 'differences' }>) {
	const parts: Array<string> = [];
	if (state.changed > 0) parts.push(`${state.changed} changed`);
	if (state.added > 0) parts.push(`${state.added} added`);
	if (state.removed > 0) parts.push(`${state.removed} removed`);
	return parts.join(' · ');
}
