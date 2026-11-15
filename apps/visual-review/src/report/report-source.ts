import { dataUrlTemplate, isLocalSourceAvailable } from '../config.js';

const PULL_REQUEST_PATTERN = /^[1-9]\d{0,8}$/;
const LOCAL_REPORT_URL = '/__local-report';
const TRAILING_SLASH_PATTERN = /\/$/;

export type ReportSource = { kind: 'local' } | { kind: 'pull-request'; number: number };

/** Reads `?pr=12` or `?source=local`. Returns `undefined` when the URL names no report. */
export function parseReportSource(search: string): ReportSource | undefined {
	const params = new URLSearchParams(search);
	const pullRequest = params.get('pr');
	if (pullRequest !== null && PULL_REQUEST_PATTERN.test(pullRequest)) {
		return { kind: 'pull-request', number: Number(pullRequest) };
	}
	if (params.get('source') === 'local') return { kind: 'local' };
	return undefined;
}

/** Where a source's `summary.json` and images live, or `undefined` when this build cannot reach it. */
export function reportBaseUrl(
	source: ReportSource,
	template: string | undefined = dataUrlTemplate,
): string | undefined {
	if (source.kind === 'local') return isLocalSourceAvailable ? LOCAL_REPORT_URL : undefined;
	return template?.replace('{pr}', String(source.number)).replace(TRAILING_SLASH_PATTERN, '');
}

export function reportSourceKey(source: ReportSource): string {
	return source.kind === 'local' ? 'local' : `pr-${source.number}`;
}
