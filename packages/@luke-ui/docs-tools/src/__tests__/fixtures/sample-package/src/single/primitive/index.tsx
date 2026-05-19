import type { JSX } from 'react';

/**
 * Props for a single primitive export.
 *
 * @tier primitive
 */
export interface SingleProps {
	/** Visible label. */
	label: string;
}

/** Single primitive export. */
export function Single(props: SingleProps): JSX.Element {
	return <div>{props.label}</div>;
}
