import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Grid } from '@luke-ui/react/grid';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { Suspense, use, useId } from 'react';
import { AppHeader } from '../app-header.js';
import { isLocalSourceAvailable, pullRequestUrl, repository } from '../config.js';
import { loadReport } from '../report/load-report.js';
import { ReviewStatusLabel } from '../review/review-status-label.js';
import { REVIEW_STATUSES } from '../review/review-status.js';
import * as styles from './dashboard.css.js';
import type { PullRequest, PullRequestsResult } from './open-pull-requests.js';
import { loadOpenPullRequests } from './open-pull-requests.js';
import { orderByReview } from './pull-status.js';
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
					gap={{ initial: 'space.32', bp768: 'space.40' }}
					paddingBlock={{ initial: 'space.40', bp768: 'space.64' }}
					paddingInline={{ initial: 'space.12', bp768: 'space.24' }}
				>
					<Stack gap="space.16" paddingInline="space.4">
						<Heading level={1} typography="heading2">
							Open pull requests
						</Heading>
						<Text color="secondary" elementType="p" typography="lead">
							Visual differences between each pull request and main in {repository}.
						</Text>
					</Stack>
					<PullRequestList result={result} />
					{isLocalSourceAvailable ? <LocalSource /> : null}
				</Box>
			</Box>
		</>
	);
}

type RowProps = {
	children?: ReactNode;
	/** Where the title leads. */
	href: string;
	meta: ReactNode;
	title: string;
};

function ListSection({ children, heading }: { children: ReactNode; heading: string }): ReactNode {
	const id = useId();
	return (
		<Stack aria-labelledby={id} elementType="section" gap="space.8">
			<Box paddingInline="space.4">
				<Heading id={id} level={2} typography="label">
					{heading}
				</Heading>
			</Box>
			{children}
		</Stack>
	);
}

function List({ children }: { children: ReactNode }): ReactNode {
	return (
		<Stack className={styles.list} elementType="ul" gap="space.8">
			{children}
		</Stack>
	);
}

/** A row's status text. */
function Label({ children }: { children: ReactNode }): ReactNode {
	return (
		<Text color="secondary" typography="label">
			{children}
		</Text>
	);
}

function Notice({ children, role }: { children: ReactNode; role?: 'status' }): ReactNode {
	return (
		<Box
			backgroundColor="surface.subdued"
			borderRadius="surface"
			padding={{ initial: 'space.16', bp768: 'space.24' }}
			role={role}
		>
			<Text color="secondary" elementType="p">
				{children}
			</Text>
		</Box>
	);
}

function LocalSource(): ReactNode {
	return (
		<ListSection heading="On this machine">
			<List>
				<Row href="?source=local" meta=".artifacts/visual-regression" title="Local comparison" />
			</List>
		</ListSection>
	);
}

function Row({ children, href, meta, title }: RowProps) {
	return (
		<Box
			backgroundColor="surface.subdued"
			borderRadius="surface"
			elementType="li"
			paddingBlock="space.16"
			paddingInline={{ initial: 'space.16', bp768: 'space.24' }}
		>
			<Grid
				alignItems="center"
				columnGap="space.24"
				columns={{ initial: 'minmax(0, 1fr)', bp768: 'minmax(0, 1fr) auto' }}
				rowGap="space.12"
			>
				<Stack gap="space.4" minInlineSize="0">
					{/* The link wraps the clamped text, so the clamp does not clip the link's focus ring. */}
					<Box
						alignSelf="flex-start"
						display="block"
						maxInlineSize="100%"
						minInlineSize="0"
						renderRoot={(domProps) => <Link {...domProps} href={href} prominence="low" />}
					>
						<Text color="primary" fontWeight="label" lineClamp typography="body">
							{title}
						</Text>
					</Box>
					<Text color="secondary" typography="caption">
						{meta}
					</Text>
				</Stack>
				{children != null ? (
					<Cluster gap="space.8" justifyContent={{ initial: 'flex-start', bp768: 'flex-end' }}>
						{children}
					</Cluster>
				) : null}
			</Grid>
		</Box>
	);
}

function PullRequestList({ result }: { result: PullRequestsResult }) {
	return (
		<ListSection heading="Pull requests">
			<PullRequestListContent result={result} />
		</ListSection>
	);
}

function PullRequestListContent({ result }: { result: PullRequestsResult }) {
	if (result.status !== 'ready') {
		return (
			<Notice role="status">
				{result.status === 'rate-limited'
					? 'GitHub has rate limited this address. Try again in a few minutes, or open a pull request’s review from its comment.'
					: 'The list of open pull requests could not be loaded from GitHub.'}
			</Notice>
		);
	}

	if (result.pullRequests.length === 0) {
		return <Notice>No pull requests are open.</Notice>;
	}

	return (
		<List>
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
		</List>
	);
}

function PullRequestReport({ pullRequest }: { pullRequest: PullRequest }) {
	const result = use(loadReport({ kind: 'pull-request', number: pullRequest.number }));
	const state = reportState(result, pullRequest.headSha);

	if (state.kind === 'differences') {
		return (
			<PullRequestRow pullRequest={pullRequest} reviewHref={`?pr=${pullRequest.number}`}>
				<Label>{describeDifferences(state)}</Label>
			</PullRequestRow>
		);
	}

	const label = STATE_LABELS[state.kind];
	const reviewLabel = pullRequest.review
		? REVIEW_STATUSES[pullRequest.review.state].label
		: undefined;

	return (
		<PullRequestRow pullRequest={pullRequest}>
			{reviewLabel === label ? null : <Label>{label}</Label>}
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
			href={reviewHref ?? pullRequestUrl(pullRequest.number)}
			meta={<PullRequestMeta pullRequest={pullRequest} />}
			title={pullRequest.title}
		>
			{pullRequest.review ? (
				<ReviewStatusLabel review={pullRequest.review}>
					{REVIEW_STATUSES[pullRequest.review.state].label}
				</ReviewStatusLabel>
			) : null}
			{children}
		</Row>
	);
}

/** Number, author, branch and draft state, in the order GitHub's own list shows them. */
function PullRequestMeta({ pullRequest }: { pullRequest: PullRequest }) {
	const { author, draft, headRef, number } = pullRequest;
	return (
		<>
			<Link href={pullRequestUrl(number)} prominence="low">
				{`#${number}`}
			</Link>
			{author ? (
				<>
					{' · '}
					<Link href={`https://github.com/${author}`} prominence="low">
						{author}
					</Link>
				</>
			) : null}
			{` · ${headRef}`}
			{draft ? ' · draft' : null}
		</>
	);
}

function describeDifferences(state: Extract<ReportState, { kind: 'differences' }>) {
	const parts: Array<string> = [];
	if (state.changed > 0) parts.push(`${state.changed} changed`);
	if (state.added > 0) parts.push(`${state.added} added`);
	if (state.removed > 0) parts.push(`${state.removed} removed`);
	return parts.join(' · ');
}
