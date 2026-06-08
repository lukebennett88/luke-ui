import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { tokenKeys, tokens } from '@luke-ui/react/tokens';
import { mergeProps } from '@luke-ui/react/utils';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { createSprinkles } from '../styles/index.js';

const meta = preview.meta({
	component: Text,
	tags: ['typography'],
	title: 'Typography/Text',
});

const panelStyle = {
	borderColor: vars.border.default,
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

type MiddleTruncatedIdentifierProps = Omit<TextProps, 'children'> & {
	identifier: string;
	suffix: string;
};

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
		textOverflow: 'clip',
	});
	const fixed = createSprinkles({ flexBasis: 'auto', flexGrow: '0', flexShrink: '0' });

	return (
		<Text
			{...mergeProps(textProps, row)}
			aria-label={identifier}
			elementType="div"
			fontFamily="mono"
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
	fontSize: 'standard',
	lineHeight: 'loose',
} as const satisfies Pick<TextProps, 'children' | 'fontSize' | 'lineHeight'>;

const colors = [...tokenKeys(tokens.foregroundColor), 'inherit'] satisfies Array<
	TextProps['color']
>;

const fontFamilies = tokenKeys(tokens.fontFamily) satisfies Array<TextProps['fontFamily']>;

const fontSizes = tokenKeys(tokens.fontSize) satisfies Array<TextProps['fontSize']>;

const headingFontSizes = fontSizes.filter((fontSize) =>
	['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'large', 'xlarge', 'xxlarge'].includes(fontSize),
);

const fontWeights = [...tokenKeys(tokens.fontWeight), 'inherit'] satisfies Array<
	TextProps['fontWeight']
>;

const lineHeights = tokenKeys(tokens.lineHeight) satisfies Array<TextProps['lineHeight']>;

export type LineClampOption = NonNullable<TextProps['lineClamp']>;
const lineClampOptions: ReadonlyArray<LineClampOption> = [false, true, 1, 2, 3, 4, 5];

/**
 * `Text` is the base typography primitive for paragraph and inline copy.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/quick brown/)).toBeInTheDocument();
	},
});

/**
 * Font size controls text scale for body copy and compact text treatment.
 */
export const FontSize = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{fontSizes.map((fontSize) => (
				<Text fontSize={fontSize} key={fontSize} lineHeight="tight" style={panelStyle} {...props}>
					{fontSize}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Larger size tokens are best for heading-like emphasis.
 */
export const LargerFontSize = meta.story({
	args: {
		...baseArgs,
		lineHeight: 'tight',
	} satisfies Pick<TextProps, 'children' | 'fontSize' | 'lineHeight'>,
	render: (props) => (
		<div style={stackContainerStyle}>
			{headingFontSizes.map((fontSize) => (
				<Text {...props} fontSize={fontSize} key={fontSize}>
					{fontSize}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Font weight supports regular, medium, bold, and inherited styles.
 */
export const FontWeight = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{fontWeights.map((fontWeight) => (
				<Text fontWeight={fontWeight} key={fontWeight} {...props}>
					{fontWeight}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Font family tokens allow switching between sans and mono text styles.
 */
export const FontFamily = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{fontFamilies.map((fontFamily) => (
				<Text fontFamily={fontFamily} key={fontFamily} {...props}>
					{fontFamily}: {storyText}
				</Text>
			))}
		</div>
	),
});

/**
 * Line height controls rhythm and readability for short and long text.
 */
export const LineHeight = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{lineHeights.map((lineHeight) => (
				<Text key={lineHeight} lineHeight={lineHeight} style={panelStyle} {...props}>
					{lineHeight}: {loremIpsum}
				</Text>
			))}
		</div>
	),
});

/**
 * Color maps to the design-system foreground tokens plus `inherit`.
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
	} satisfies Pick<TextProps, 'children' | 'fontSize' | 'lineHeight'>,
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
			gap: 'medium',
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
			gap: 'medium',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
		});
		return (
			<div {...container}>
				<Text {...props} fontWeight="medium">
					End truncation
				</Text>
				<Text {...props} fontFamily="mono" lineClamp title={importantIdentifier}>
					{importantIdentifier}
				</Text>

				<Text {...props} fontWeight="medium">
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
			gap: 'medium',
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
export const Variant = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			<Text {...props} variant="diagonal-fractions">
				1/2 3/4 5/6
			</Text>
			<Text {...props} variant="ordinal">
				1st 2nd 3rd 4th
			</Text>
			<Text {...props} variant="slashed-zero">
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
		<Text {...props} color="critical">
			<Text isVisuallyHidden>Danger: </Text>
			This action is not reversible.
		</Text>
	),
});
