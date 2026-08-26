export function focusRing(color: string) {
	return {
		outlineColor: color,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}
