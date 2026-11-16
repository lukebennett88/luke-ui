import { Cluster } from '@luke-ui/react/cluster';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Suspense, use } from 'react';
import { isLocalSourceAvailable, repository } from '../config.js';
import { loadReport } from '../report/load-report.js';
import * as styles from './dashboard.css.js';
import type { PullRequest, PullRequestsResult } from './open-pull-requests.js';
import { loadOpenPullRequests } from './open-pull-requests.js';
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
		<div className={styles.page}>
			<title>Visual review</title>
			<Container maxInlineSize="container.896" paddingBlock="space.32" paddingInline="space.16">
				<Stack gap="space.24">
					<Stack gap="space.12">
						<Heading level={1}>Open pull requests</Heading>
						<Text color="secondary" elementType="p">
							{`Visual differences between each pull request and main in ${repository}.`}
						</Text>
					</Stack>
					{isLocalSourceAvailable ? (
						<Text elementType="p">
							<Link href="?source=local">Review the local comparison</Link>
						</Text>
					) : null}
					<PullRequestList result={result} />
				</Stack>
			</Container>
		</div>
	);
}

function PullRequestList({ result }: { result: PullRequestsResult }) {
	if (result.status !== 'ready') {
		return (
			<Text color="secondary" elementType="p" role="status">
				{result.status === 'rate-limited'
					? 'GitHub has rate limited this address. Try again in a few minutes, or open a pull request’s review from its comment.'
					: 'The list of open pull requests could not be loaded from GitHub.'}
			</Text>
		);
	}
	if (result.pullRequests.length === 0) {
		return (
			<Text color="secondary" elementType="p">
				No pull requests are open.
			</Text>
		);
	}
	return (
		<ul className={styles.list}>
			{result.pullRequests.map((pullRequest) => (
				<li className={styles.row} key={pullRequest.number}>
					<Stack gap="space.8" minInlineSize="0">
						<Text fontWeight="label">
							<Link href={`?pr=${pullRequest.number}`}>
								{`#${pullRequest.number} ${pullRequest.title}`}
							</Link>
						</Text>
						<Text color="secondary" typography="caption">
							{describePullRequest(pullRequest)}
						</Text>
					</Stack>
					<Suspense fallback={<LoadingSpinner aria-label="Loading report" size="small" />}>
						<PullRequestReport pullRequest={pullRequest} />
					</Suspense>
				</li>
			))}
		</ul>
	);
}

function PullRequestReport({ pullRequest }: { pullRequest: PullRequest }) {
	const result = use(loadReport({ kind: 'pull-request', number: pullRequest.number }));
	const state = reportState(result, pullRequest.head.sha);

	if (state.kind !== 'differences') {
		return (
			<Text color="secondary" typography="label">
				{STATE_LABELS[state.kind]}
			</Text>
		);
	}
	return (
		<Cluster gap="space.16">
			<Text color="warning" typography="label">
				{describeDifferences(state)}
			</Text>
			<Link appearance="button" href={`?pr=${pullRequest.number}`} size="small">
				Review
			</Link>
		</Cluster>
	);
}

function describePullRequest(pullRequest: PullRequest) {
	const parts = [pullRequest.head.ref];
	if (pullRequest.user) parts.unshift(pullRequest.user.login);
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
