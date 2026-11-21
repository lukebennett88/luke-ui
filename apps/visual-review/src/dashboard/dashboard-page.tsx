import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { Suspense, use, useId } from 'react';
import type { Review } from '../api/review-api.js';
import { AppHeader } from '../app-header.js';
import { isLocalSourceAvailable, pullRequestUrl, repository } from '../config.js';
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
			<Box backgroundColor="surface.base" className={styles.panel}>
				<Box
					className={styles.main}
					display="grid"
					elementType="main"
					gap={{ initial: 'space.24', bp768: 'space.32' }}
					paddingBlock={{ initial: 'space.40', bp768: 'space.64' }}
					paddingInline={{ initial: 'space.12', bp768: 'space.24' }}
				>
					<Stack gap="space.24" paddingInline="space.4">
						<Heading level={1} typography="heading2">
							Open pull requests
						</Heading>
						<Text color="secondary" elementType="p" typography="lead">
							{`Visual differences between each pull request and main in ${repository}.`}
						</Text>
					</Stack>
					<PullRequestList result={result} />
					{isLocalSourceAvailable ? (
						<Stack aria-labelledby="local-title" elementType="section" gap="space.8">
							<Heading className={styles.groupTitle} id="local-title" level={2} typography="label">
								On this machine
							</Heading>
							<Stack className={styles.list} elementType="ul" gap="space.4">
								<Row
									destination="review"
									href="?source=local"
									meta=".artifacts/visual-regression"
									title="Local comparison"
								/>
							</Stack>
						</Stack>
					) : null}
				</Box>
			</Box>
		</>
	);
}

type RowProps = {
	children?: ReactNode;
	destination: 'github' | 'review';
	href: string;
	meta: string;
	title: ReactNode;
};

function Row({ children, destination, href, meta, title }: RowProps) {
	const id = useId();
	const isGitHub = destination === 'github';
	return (
		<li>
			<Box
				backgroundColor="surface.subdued"
				className={styles.row}
				renderRoot={(domProps) => (
					<Link
						{...domProps}
						aria-describedby={children == null ? undefined : `${id}-status`}
						aria-labelledby={`${id}-title ${id}-destination`}
						href={href}
						prominence="low"
					/>
				)}
			>
				<Stack className={styles.rowText} gap="space.4">
					<Text className={styles.truncate} color="primary" fontWeight="label" id={`${id}-title`}>
						{title}
					</Text>
					<Text className={styles.truncate} color="secondary" typography="caption">
						{meta}
					</Text>
				</Stack>
				<Box
					alignItems="center"
					columnGap="space.16"
					display="flex"
					flexWrap="wrap"
					justifyContent={{ initial: 'space-between', bp768: 'flex-end' }}
					rowGap="space.8"
				>
					{children != null ? (
						<Box
							alignItems="center"
							display="flex"
							flexWrap="wrap"
							gap="space.8"
							id={`${id}-status`}
						>
							{children}
						</Box>
					) : null}
					<Box
						alignItems="center"
						display="flex"
						gap="space.8"
						id={`${id}-destination`}
						marginInlineStart="auto"
					>
						<Text color="primary" typography="label">
							{isGitHub ? 'Open on GitHub' : 'Review'}
						</Text>
						<Icon name={isGitHub ? 'externalLink' : 'arrowRight'} size="xsmall" />
					</Box>
				</Box>
			</Box>
		</li>
	);
}

function PullRequestList({ result }: { result: PullRequestsResult }) {
	if (result.status !== 'ready') {
		return (
			<Box
				backgroundColor="surface.subdued"
				className={styles.notice}
				elementType="div"
				padding="space.16"
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
			<Box
				backgroundColor="surface.subdued"
				className={styles.notice}
				elementType="div"
				padding="space.16"
			>
				<Text color="secondary" elementType="p">
					No pull requests are open.
				</Text>
			</Box>
		);
	}
	return (
		<Stack aria-label="Open pull requests" className={styles.list} elementType="ul" gap="space.4">
			{orderByReview(result.pullRequests).map((pullRequest) => (
				<Suspense
					key={pullRequest.number}
					fallback={
						<PullRequestRow pullRequest={pullRequest}>
							<LoadingSpinner aria-label="Loading report" size="small" />
						</PullRequestRow>
					}
				>
					<PullRequestReport pullRequest={pullRequest} />
				</Suspense>
			))}
		</Stack>
	);
}

function PullRequestReport({ pullRequest }: { pullRequest: PullRequest }) {
	const result = use(loadReport({ kind: 'pull-request', number: pullRequest.number }));
	const state = reportState(result, pullRequest.headSha);

	if (state.kind === 'differences') {
		return (
			<PullRequestRow pullRequest={pullRequest} reviewHref={`?pr=${pullRequest.number}`}>
				<Text color="secondary">{describeDifferences(state)}</Text>
			</PullRequestRow>
		);
	}

	const label = STATE_LABELS[state.kind];
	const chip = pullRequest.review === undefined ? undefined : reviewChip(pullRequest.review);
	return (
		<PullRequestRow pullRequest={pullRequest}>
			{chip?.label === label ? null : <Text color="secondary">{label}</Text>}
		</PullRequestRow>
	);
}

function PullRequestRow({
	children,
	pullRequest,
	reviewHref,
}: {
	children: ReactNode;
	pullRequest: PullRequest;
	reviewHref?: string;
}) {
	return (
		<Row
			destination={reviewHref === undefined ? 'github' : 'review'}
			href={reviewHref ?? pullRequestUrl(pullRequest.number)}
			meta={describePullRequest(pullRequest)}
			title={
				<>
					<span className={styles.number}>{`#${pullRequest.number}`}</span> {pullRequest.title}
				</>
			}
		>
			{pullRequest.review === undefined ? null : <ReviewStatus review={pullRequest.review} />}
			{children}
		</Row>
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
