const DEFAULT_REPOSITORY = 'lukebennett88/luke-ui';

/** `owner/name` of the GitHub repository the reports belong to. */
export const repository = import.meta.env.VITE_VISUAL_REVIEW_REPOSITORY || DEFAULT_REPOSITORY;

/** Data origin for a pull request, with `{pr}` standing for its number. Unset in local development. */
export const dataUrlTemplate = import.meta.env.VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE || undefined;

/** The dev server serves `.artifacts/visual-regression`; production builds have no local source. */
export const isLocalSourceAvailable = import.meta.env.DEV;

export function pullRequestUrl(number: number): string {
	return `https://github.com/${repository}/pull/${number}`;
}

export function commitUrl(sha: string): string {
	return `https://github.com/${repository}/commit/${sha}`;
}
