import { Text } from '@luke-ui/react/typography';
import type { NumeralProps } from '@luke-ui/react/typography/composed';
import { Heading, Numeral } from '@luke-ui/react/typography/composed';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview.js';

const meta = preview.meta({
	component: Numeral,
	title: 'Typography/Numeral',
});

const rowStyle = {
	display: 'flex',
	gap: '1.5rem',
} as const satisfies CSSProperties;

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

const baseArgs = {
	value: 120_000,
} satisfies Pick<NumeralProps, 'value'>;

/**
 * `Numeral` formats numbers and can be composed with other typography components.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByText('120,000')).toBeInTheDocument();
	},
});

/**
 * `format="percent"` applies percent formatting rules, which scale by 100.
 */
export const Format = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={rowStyle}>
			<Numeral {...props} format="decimal" value={3_500} />
			<Numeral {...props} format="percent" value={3_500} />
		</div>
	),
});

/**
 * Providing `currency` automatically derives currency formatting.
 */
export const Currency = meta.story({
	args: baseArgs,
	render: (props) => <Numeral {...props} currency="AUD" value={98.7654} />,
});

/**
 * Providing `unit` automatically derives unit formatting.
 */
export const Units = meta.story({
	args: baseArgs,
	render: (props) => <Numeral {...props} unit="kilometer-per-hour" value={98} />,
});

/**
 * Use compact notation when interfaces have limited space.
 */
export const Abbreviations = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={rowStyle}>
			<Numeral {...props} abbreviate value={12_345} />
			<Numeral {...props} abbreviate="long" value={123_456} />
			<Numeral {...props} abbreviate currency="EUR" value={1_234_567} />
		</div>
	),
});

/**
 * Precision can be fixed or a min/max fraction digit range.
 */
export const Precision = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={rowStyle}>
			<Numeral {...props} precision={2} value={1_234} />
			<Numeral {...props} precision={[0, 2]} value={1_234} />
			<Numeral {...props} precision={[0, 2]} value={1_234.5678} />
		</div>
	),
});

/**
 * Compose `Numeral` with `Heading` and `Text` for rich financial content.
 */
export const Composition = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			<Heading level={2}>
				Acme Corporation shares hit <Numeral {...props} abbreviate value={1_456_789} /> today
			</Heading>
			<Text>
				We asked investors which private company&apos;s stock they would most like to own. More than{' '}
				<Numeral {...props} format="percent" value={0.80123} /> of respondents picked Acme Corp.
			</Text>
			<Text>
				Hooli, Acme&apos;s parent component, went public earlier in the year. The median commitment
				was <Numeral {...props} currency="AUD" precision={0} value={1_000} /> though the average was
				significantly higher.
			</Text>
		</div>
	),
});

/**
 * Locale defaults come from RAC i18n context, with optional per-component override.
 */
export const Locale = meta.story({
	args: baseArgs,
	render: () => (
		<div style={stackStyle}>
			<Heading level={2}>
				Acme Corporation shares hit <Numeral value={1_456_789} abbreviate /> today
			</Heading>
			<Text>
				We asked investors which private company’s stock they would most like to own. More than{' '}
				<Numeral value={0.80123} format="percent" /> of respondents picked Acme Corp.
			</Text>
			<Text>
				Hooli, Acme’s parent component, went public earlier in the year. The median commitment was{' '}
				<Numeral value={1_000} currency="AUD" precision={0} /> though the average was significantly
				higher.
			</Text>
		</div>
	),
});
