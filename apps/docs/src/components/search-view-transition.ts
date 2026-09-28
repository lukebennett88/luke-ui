/** Shared element name for the wide header search field morph. Must be unique app-wide. */
const DOCS_SEARCH_FIELD_VT_NAME = 'luke-docs-search-field';

/** View Transition Class applied during the shared-element morph. */
export const DOCS_SEARCH_FIELD_VT_SHARE_CLASS = 'docs-search-field-share';

export const searchFieldViewTransition = {
	default: 'none',
	enter: 'none',
	exit: 'none',
	name: DOCS_SEARCH_FIELD_VT_NAME,
	share: DOCS_SEARCH_FIELD_VT_SHARE_CLASS,
} as const;
