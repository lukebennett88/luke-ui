import type { ReportSource } from './report-source.js';
import { reportBaseUrl, reportSourceKey } from './report-source.js';
import type { Report } from './schema.js';
import { parseReport } from './schema.js';

export type ReportResult =
	| { baseUrl: string; report: Report; status: 'ready' }
	| { status: 'invalid' }
	| { status: 'missing' }
	| { status: 'unconfigured' };

const cache = new Map<string, Promise<ReportResult>>();

/**
 * Loads a source's report once per page load. The promise never rejects, so `use()` needs no error
 * boundary: every failure is a state the page renders.
 */
export function loadReport(source: ReportSource): Promise<ReportResult> {
	const key = reportSourceKey(source);
	const cached = cache.get(key);
	if (cached) return cached;
	const result = fetchReport(reportBaseUrl(source));
	cache.set(key, result);
	return result;
}

async function fetchReport(baseUrl: string | undefined): Promise<ReportResult> {
	if (baseUrl === undefined) return { status: 'unconfigured' };
	try {
		const response = await fetch(`${baseUrl}/summary.json`);
		// A pull request that has not published has no deployment, which fails as 404 or at the network.
		if (!response.ok) return { status: 'missing' };
		return { baseUrl, report: parseReport(await response.json()), status: 'ready' };
	} catch (error) {
		return error instanceof TypeError ? { status: 'missing' } : { status: 'invalid' };
	}
}
