import { Link } from '@luke-ui/react/link';
import { commitUrl, pullRequestUrl } from '../config.js';
import type { ReportSource } from '../report/report-source.js';
import type { Report } from '../report/schema.js';

/** `Pull request #12` or `Local comparison`. */
export function sourceLabel(source: ReportSource): string {
	return source.kind === 'local' ? 'Local comparison' : `Pull request #${source.number}`;
}

/** The report's source and commit, each linked to GitHub. */
export function ReportTitle({
	report,
	source,
}: {
	report: Report | undefined;
	source: ReportSource;
}) {
	return (
		<>
			{source.kind === 'pull-request' ? (
				<Link href={pullRequestUrl(source.number)} target="_blank">
					{sourceLabel(source)}
				</Link>
			) : (
				sourceLabel(source)
			)}
			{report?.meta ? (
				<>
					{' at '}
					<Link href={commitUrl(report.meta.headSha)} target="_blank">
						{report.meta.headSha.slice(0, 7)}
					</Link>
				</>
			) : null}
		</>
	);
}
