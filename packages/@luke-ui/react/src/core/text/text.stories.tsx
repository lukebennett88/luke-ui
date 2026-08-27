import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { mergeProps } from '@luke-ui/react/utils';
import { VisuallyHidden as VisuallyHiddenText } from '@luke-ui/react/visually-hidden';
import type { CSSProperties } from 'react';
import preview from '../../../.storybook/preview.js';
import { typeStyles, vars } from '../../theme/index.js';
import { createSprinkles } from '../styles/index.js';
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
		<Text {...mergeProps(textProps, row)} elementType="div" shouldDisableTrim title={identifier}>
			<VisuallyHiddenText>{identifier}</VisuallyHiddenText>
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
	typography: 'body',
} as const satisfies Pick<TextProps, 'children' | 'typography'>;

const colors = [
	'primary',
	'secondary',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const satisfies ReadonlyArray<NonNullable<TextProps['color']>>;
const weights = ['body', 'label', 'heading', 'emphasis'] as const satisfies ReadonlyArray<
	NonNullable<TextProps['fontWeight']>
>;

export type LineClampOption = NonNullable<TextProps['lineClamp']>;
const lineClampOptions: ReadonlyArray<LineClampOption> = [false, true, 1, 2, 3, 4, 5];

export const Default = meta.story({
	args: baseArgs,
});

/**
 * Each typography style applies family, size, weight, line height, letter spacing, and trim together.
 */
export const Typography = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			{typeStyles.map((typography) => (
				<Text key={typography} style={panelStyle} typography={typography} {...props}>
					{typography}: {storyText}
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
	} satisfies Pick<TextProps, 'children' | 'typography'>,
	render: (props) => <Text {...props} />,
});

/**
 * Change the rendered HTML element with `elementType` when semantics require it.
 */
export const ElementType = meta.story({
	render: (props) => (
		<div style={stackContainerStyle}>
			<Text {...props} data-testid="inline" elementType="span">
				span: {storyText}
			</Text>
			<Text {...props} data-testid="custom" elementType="x-inline-copy">
				custom: {storyText}
			</Text>
			<Text {...props} data-testid="explicit-trim" elementType="span" shouldDisableTrim={false}>
				span with explicit trim: {storyText}
			</Text>
			<Text {...props} data-testid="clamped" elementType="span" lineClamp shouldDisableTrim={false}>
				clamped span: {storyText}
			</Text>
			<Text {...props} data-testid="block" elementType="p">
				p: {storyText}
			</Text>
		</div>
	),
});

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

export const Truncate = meta.story({
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: 'sp16',
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
 * Use `createSprinkles()` to compose the layout and overflow utilities that this pattern needs.
 */
export const MiddleTruncation = meta.story({
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: 'sp16',
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

export const LineClamp = meta.story({
	render: (props) => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: 'sp16',
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
 * Visually hidden text remains available to assistive technology.
 */
export const VisuallyHidden = meta.story({
	render: (props) => (
		<Text {...props} color="danger">
			<Text isVisuallyHidden>Danger: </Text>
			This action is not reversible.
		</Text>
	),
});
