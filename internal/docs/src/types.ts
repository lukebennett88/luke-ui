////////////////////////////////////////////////////////////////////////////////

type DocsType = {
	/** Metadata about the page. */
	meta: Meta;
	/** Description of the package. */
	description?: JSX.Element | JSX.Element[];
	/** Array of examples showing how to use the package. */
	examples?: Example[];
};

type Meta = {
	/** Name of the package. */
	name?: string;
	/** Category of the package. */
	category: Category;
};

/** Category of the package. */
type Category = 'Color' | 'Content' | 'Layout' | 'Typography';

type Example = {
	name: string;
	/** Description of the example. */
	description?: JSX.Element | JSX.Element[];
	/** Code for the example. */
	code?: JSX.Element | JSX.Element[];
	/** Whether or not the code is shown along with the rendered example. */
	enableCodeSnippet?: boolean;
	/**
	 * Whether or not the "Playroom" link should be shown under the code snippet.
	 */
	enablePlayroom?: boolean;
};

////////////////////////////////////////////////////////////////////////////////

export type { Category, DocsType, Example, Meta };
