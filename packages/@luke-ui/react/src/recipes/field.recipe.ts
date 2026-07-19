import { defineSlotRecipe } from '@pandacss/dev';
import type { SystemStyleObject } from '../../styled-system/types/system-types.d.mts';
import type { TextColorName, TextColorTokenFor } from '../types/token-unions.js';

type FieldMessageTone = Extract<TextColorName, 'danger' | 'secondary'>;

const fieldMessageColors = {
	description: 'text.secondary',
	error: 'intent.danger.text',
} as const satisfies Record<'description' | 'error', TextColorTokenFor<FieldMessageTone>>;

const fieldRoot = {
	display: 'flex',
	flexDirection: 'column',
	gap: '100',
	minInlineSize: 0,
} as const satisfies SystemStyleObject;

export const fieldRecipe = defineSlotRecipe({
	className: 'field',
	description: 'Layout and text parts for the Field primitive.',
	slots: ['root', 'label', 'message'],
	base: {
		root: fieldRoot,
		label: {
			color: 'text.primary',
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
			fontWeight: 'label',
			minInlineSize: 0,
			':where([data-disabled="true"]) &': { color: 'textDisabled' },
		},
		message: {
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
			minInlineSize: 0,
			':where([data-disabled="true"]) &': { color: 'textDisabled' },
		},
	},
	defaultVariants: { necessityIndicator: 'icon', tone: 'description' },
	variants: {
		necessityIndicator: {
			icon: {
				label: {
					'&:where([data-required="true"])::after': {
						color: 'intent.danger.text',
						content: '"*"',
						marginInlineStart: '100',
					},
				},
			},
			label: {
				label: {
					'&:where([data-required="true"])::after': {
						color: 'text.secondary',
						content: '"(required)"',
						fontWeight: 'body',
						marginInlineStart: '100',
					},
				},
			},
		},
		tone: {
			description: { message: { color: fieldMessageColors.description } },
			error: { message: { color: fieldMessageColors.error } },
		},
	},
});
