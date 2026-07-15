import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { mergeProps } from '@luke-ui/react/utils';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { createSprinkles } from '../styles/index.js';
import { vars } from '../theme/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

const meta = preview.meta({
	component: Text,
	tags: ['typography'],
	title: 'Typography/Text',
});

const panelStyle = {
	borderColor: vars.color.border.decorative,
	borderStyle: 'dashed',
	borderWidth: 1,
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

const stackContainerStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

const storyText = 'The quick brown fox jumps over the lazy dog.';
const loremIpsum =
	'Lorem ipsum Lolor sit amet, Lonsectetur adipiscing elit. Duis eu ornare nisi, sed feugiat metus. Pellentesque rutrum vel metus non dignissim. Aenean egestas neque mattis mi maximus luctus. Praesent et commodo dui, nec eleifend lectus. Pellentesque blandit nisi tellus, id efficitur urna consectetur id. Sed convallis tempor dui vel aliquet.';
const importantIdentifier = 'budget-allocation-review-cycle-2026-06-05-eu-west-1-BA-109284';
const importantIdentifierSuffix = '-BA-109284';

type MiddleTruncatedIdentifierOmit = DistributiveOmit<TextProps, 'children'>;

interface MiddleTruncatedIdentifierProps extends MiddleTruncatedIdentifierOmit {
	identifier: string;
	suffix: string;
}

function MiddleTruncatedIdentifier(props: MiddleTruncatedIdentifierProps) {
	const { identifier, suffix, ...textProps } = props;
	const prefix = identifier.slice(0, -suffix.length);
	const row = createSprinkles({
		alignItems: 'baseline',
		display: 'flex',
		inlineSize: '100%',
		minInlineSize: '0',
	});
	const prefixStyle = createSprinkles({
		flexBasis: 'auto',
		flexGrow: '1',
		flexShrink: '1',
		minInlineSize: '0',
	});
	const fixed = createSprinkles({ flexBasis: 'auto', flexGrow: '0', flexShrink: '0' });

	return (
		<Text
			{...mergeProps(textProps, row)}
			aria-label={identifier}
			elementType="div"
			shouldDisableTrim
			title={identifier}
		>
			<Text aria-hidden elementType="span" lineClamp shouldInheritFont {...prefixStyle}>
				{prefix}
			</Text>
			<Text aria-hidden elementType="span" shouldDisableTrim shouldInheritFont {...fixed}>
				...
			</Text>
			<Text aria-hidden elementType="span" shouldDisableTrim shouldInheritFont {...fixed}>
				{suffix}
			</Text>
		</Text>
	);
}

const baseArgs = {
	children: storyText,
	size: '300',
} as const satisfies Pick<TextProps, 'children' | 'size'>;

const colors = [
	'primary',
	'secondary',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const satisfies ReadonlyArray<NonNullable<TextProps['color']>>;
const sizes = [
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
] as const satisfies ReadonlyArray<NonNullable<TextProps['size']>>;
const weights = ['body', 'label', 'heading', 'emphasis'] as const satisfies ReadonlyArray<
	NonNullable<TextProps['fontWeight']>
>;

export type LineClampOption = NonNullable<TextProps['lineClamp']>;
const lineClampOptions: ReadonlyArray<LineClampOption> = [false, true, 1, 2, 3, 4, 5];

/**
 * `Text` is the base typography primitive for paragraph and inline copy.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		const element = canvas.getByText(/quick brown/);
		const style = getComputedStyle(element);
		await expect(style.fontSize).toBe('16px');
		await expect(style.lineHeight).toBe('24px');
		await expect(style.fontWeight).toBe('400');
	},
});

/**
 * Each size step applies font size, line height, letter spacing, and trim as one treatment.
 */
export const Size = meta.story({
	play: async ({ canvas }) => {
		const small = getComputedStyle(canvas.getByText(/^100:/));
		const display = getComputedStyle(canvas.getByText(/^900:/));
		await expect(small.fontSize).toBe('12px');
		await expect(small.lineHeight).toBe('16px');
		await expect(display.fontSize).toBe('60px');
		await expect(display.lineHeight).toBe('60px');
	},
	render: (props) => (
		<div style={stackContainerStyle}>
			{sizes.map((size) => (
				<Text key={size} size={size} style={panelStyle} {...props}>
					{size}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Weight roles let each theme control body, labels, headings, and emphasis coherently.
 */
export const Weight = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{weights.map((fontWeight) => (
				<Text fontWeight={fontWeight} key={fontWeight} {...props}>
					{fontWeight}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Use semantic colours to communicate hierarchy, status, and emphasis consistently across themes.
 */
export const Color = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{colors.map((color) => (
				<Text color={color} key={color} {...props}>
					{color}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Empty text renders without output, which can happen in dynamic content paths.
 */
export const EmptyText = meta.story({
	args: {
		...baseArgs,
		children: '',
	} satisfies Pick<TextProps, 'children' | 'size'>,
	render: (props) => <Text {...props} />,
});

/**
 * Change the rendered HTML element with `elementType` when semantics require it.
 */
export const ElementType = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			<Text {...props} elementType="span">
				span: {storyText}
			</Text>
			<Text {...props} elementType="strong">
				strong: {storyText}
			</Text>
			<Text {...props} elementType="p">
				p: {storyText}
			</Text>
		</div>
	),
});

/**
 * Alignment supports logical values.
 */
export const Align = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			<Text {...props} textAlign="start">
				start: {storyText}
			</Text>
			<Text {...props} textAlign="center">
				center: {storyText}
			</Text>
			<Text {...props} textAlign="end">
				end: {storyText}
			</Text>
		</div>
	),
});

/**
 * Truncate limits text to one line with an ellipsis.
 */
export const Truncate = meta.story({
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: '400',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
		});
		return (
			<div {...container}>
				<Text {...props} lineClamp>
					{loremIpsum}
				</Text>
			</div>
		);
	},
});

/**
 * Middle truncation keeps an important suffix visible by truncating only the prefix.
 *
 * This story dog-foods the public `@luke-ui/react/styles` `createSprinkles()` utility to compose
 * layout, flex-item, sizing, and text-overflow utilities into a reusable truncation
 * pattern that component props do not cover.
 */
export const MiddleTruncation = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByText(importantIdentifierSuffix)).toBeInTheDocument();
	},
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: '400',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
		});
		return (
			<div {...container}>
				<Text {...props} fontWeight="label">
					End truncation
				</Text>
				<Text {...props} lineClamp title={importantIdentifier}>
					{importantIdentifier}
				</Text>

				<Text {...props} fontWeight="label">
					Middle truncation
				</Text>
				<MiddleTruncatedIdentifier
					{...props}
					identifier={importantIdentifier}
					suffix={importantIdentifierSuffix}
				/>
			</div>
		);
	},
});

/**
 * Line clamp limits text to a fixed number of lines via `lineClamp`.
 * Covers values `false`, `true`, and `1`–`5`.
 */
export const LineClamp = meta.story({
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: '400',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
		});
		return (
			<div {...container}>
				{lineClampOptions.map((value) => (
					<Text key={String(value)} {...props} lineClamp={value}>
						{String(value)}: {loremIpsum}
					</Text>
				))}
			</div>
		);
	},
});

/**
 * Numeric variants enable glyph behavior for fractions, ordinals, and tabular numbers.
 */
export const FontVariantNumeric = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			<Text {...props} fontVariantNumeric="diagonal-fractions">
				1/2 3/4 5/6
			</Text>
			<Text {...props} fontVariantNumeric="ordinal">
				1st 2nd 3rd 4th
			</Text>
			<Text {...props} fontVariantNumeric="slashed-zero">
				012 OQR
			</Text>
		</div>
	),
});

/**
 * Visually hidden text remains accessible to assistive technologies.
 */
export const VisuallyHidden = meta.story({
	render: (props) => (
		<Text {...props} color="danger">
			<Text isVisuallyHidden>Danger: </Text>
			This action is not reversible.
		</Text>
	),
});
