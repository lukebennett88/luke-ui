import type { JSX } from 'react';

/**
 * Props for a sample atom.
 *
 * @tier atom
 */
export interface SampleProps {
	/** Visible label. */
	label: string;
}

/** Sample atom description. */
export function Sample(props: SampleProps): JSX.Element {
	return <div>{props.label}</div>;
}
