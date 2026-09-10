/**
 * Requires exactly one of `aria-label` or `aria-labelledby`. Use for a control whose only visible
 * content is decorative, such as an icon-only button or link, so omitting both naming props is a
 * type error rather than a silent accessibility gap.
 */
export type RequiredAccessibleName =
	| { 'aria-label': string; 'aria-labelledby'?: never }
	| { 'aria-label'?: never; 'aria-labelledby': string };
