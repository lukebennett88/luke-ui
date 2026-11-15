/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Data origin for a pull request, with `{pr}` standing for its number. */
	readonly VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE?: string;
	/** `owner/name` of the GitHub repository the reports belong to. */
	readonly VITE_VISUAL_REVIEW_REPOSITORY?: string;
}
