import type { ReportResult } from '../report/load-report.js';

/** What the dashboard can say about one pull request's report. */
export type ReportState =
	| { added: number; changed: number; kind: 'differences'; removed: number }
	| { kind: 'no-differences' }
	| { kind: 'no-report' }
	| { kind: 'out-of-date' }
	| { kind: 'unconfigured' };

/**
 * A report describes the commit it was rendered from. Once the pull request has a newer head, its
 * differences no longer describe the pull request, so the dashboard says so rather than show them.
 */
export function reportState(result: ReportResult, headSha: string): ReportState {
	if (result.status === 'unconfigured') return { kind: 'unconfigured' };
	if (result.status !== 'ready') return { kind: 'no-report' };
	const { counts, meta } = result.report;
	if (meta && meta.headSha !== headSha) return { kind: 'out-of-date' };
	const { added, changed, removed } = counts;
	if (added + changed + removed === 0) return { kind: 'no-differences' };
	return { added, changed, kind: 'differences', removed };
}
