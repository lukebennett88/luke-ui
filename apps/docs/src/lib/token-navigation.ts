/** The element id of a token's row. */
export function tokenRowId(path: string): string {
	return `token-${path.replaceAll('.', '-')}`;
}
