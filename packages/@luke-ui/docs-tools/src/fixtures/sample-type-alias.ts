interface AliasStyleProps {
	/** Sets the visual size. @default 'medium' */
	size?: 'small' | 'medium';
}

/**
 * Props for `Alias`.
 * @tier atom
 */
export type AliasProps = AliasStyleProps & {
	/** Accessible label. */
	label: string;
};

/** Sample component backed by a props type alias. */
export function Alias(_props: AliasProps): null {
	return null;
}
