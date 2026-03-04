import { useLocale } from 'react-aria-components';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';
import { useIsWithinHeading } from './heading-context.js';

export type NumeralFormat = 'decimal' | 'percent' | 'currency' | 'unit';
export type NumeralAbbreviation = boolean | 'long';
export type NumeralPrecision = number | readonly [number, number];

export interface NumeralProps extends Omit<TextProps, 'children' | 'textAlign' | 'variant'> {
	abbreviate?: NumeralAbbreviation;
	textAlign?: TextProps['textAlign'];
	currency?: string;
	format?: NumeralFormat;
	formatOptions?: Intl.NumberFormatOptions;
	locale?: Intl.LocalesArgument;
	precision?: NumeralPrecision;
	unit?: NonNullable<Intl.NumberFormatOptions['unit']>;
	value: number;
	variant?: Extract<
		TextProps['variant'],
		'diagonal-fractions' | 'ordinal' | 'slashed-zero' | 'tabular-nums'
	>;
}

function isValidPrecisionValue(value: number) {
	return Number.isInteger(value) && value >= 0;
}

function validateProps(props: NumeralProps) {
	const { currency, format, formatOptions, precision, unit } = props;

	const hasCurrency = currency ?? formatOptions?.currency;
	const hasUnit = unit ?? formatOptions?.unit;

	if (hasCurrency && hasUnit) {
		throw new Error('Numeral cannot format both `currency` and `unit` at once.');
	}

	if (format === 'currency' && hasCurrency === undefined) {
		throw new Error('Numeral with format="currency" requires a `currency` code.');
	}

	if (format === 'unit' && hasUnit === undefined) {
		throw new Error('Numeral with format="unit" requires a `unit` value.');
	}

	if (precision === undefined) {
		return;
	}

	if (typeof precision === 'number') {
		if (!isValidPrecisionValue(precision)) {
			throw new Error('Numeral `precision` must be a non-negative integer or tuple.');
		}
		return;
	}

	if (
		!isValidPrecisionValue(precision[0]) ||
		!isValidPrecisionValue(precision[1]) ||
		precision[0] > precision[1]
	) {
		throw new Error('Numeral `precision` tuple must be [min, max] non-negative integers.');
	}
}

export function Numeral(props: NumeralProps) {
	validateProps(props);
	const { locale: localeFromContext } = useLocale();
	const isWithinHeading = useIsWithinHeading();
	const {
		abbreviate,
		color,
		textAlign = 'end',
		currency,
		elementType = 'span',
		format,
		formatOptions,
		locale,
		precision,
		shouldDisableTrim,
		style,
		unit,
		value,
		variant = 'tabular-nums',
		...textProps
	} = props;
	const resolvedLocale = locale ?? localeFromContext;

	const resolvedFormat = format ?? (currency ? 'currency' : unit ? 'unit' : 'decimal');

	const numeralFormatOptions: Intl.NumberFormatOptions = {
		...formatOptions,
		style: resolvedFormat,
	};
	if (resolvedFormat === 'currency') {
		const resolvedCurrency = currency ?? formatOptions?.currency;
		if (resolvedCurrency === undefined) {
			throw new Error('Numeral with format="currency" requires a `currency` code.');
		}
		numeralFormatOptions.currency = resolvedCurrency;
	}

	if (resolvedFormat === 'unit') {
		const resolvedUnit = unit ?? formatOptions?.unit;
		if (resolvedUnit === undefined) {
			throw new Error('Numeral with format="unit" requires a `unit` value.');
		}
		numeralFormatOptions.unit = resolvedUnit;
		numeralFormatOptions.unitDisplay = formatOptions?.unitDisplay ?? 'narrow';
	}

	if (abbreviate) {
		numeralFormatOptions.compactDisplay = abbreviate === 'long' ? 'long' : 'short';
		numeralFormatOptions.notation = 'compact';
	}

	if (precision !== undefined) {
		if (typeof precision === 'number') {
			numeralFormatOptions.minimumFractionDigits = precision;
			numeralFormatOptions.maximumFractionDigits = precision;
		} else {
			numeralFormatOptions.minimumFractionDigits = precision[0];
			numeralFormatOptions.maximumFractionDigits = precision[1];
		}
	}

	const content = new Intl.NumberFormat(resolvedLocale, numeralFormatOptions).format(value);
	const resolvedShouldDisableTrim = shouldDisableTrim ?? isWithinHeading;
	const resolvedColor = color ?? (isWithinHeading ? 'inherit' : undefined);
	const resolvedStyle =
		isWithinHeading && typeof style === 'object' && style !== null
			? { font: 'inherit', ...style }
			: isWithinHeading
				? { font: 'inherit' }
				: style;
	const colorProps: Pick<TextProps, 'color'> | {} =
		resolvedColor === undefined ? {} : { color: resolvedColor };
	const styleProps: Pick<TextProps, 'style'> | {} =
		resolvedStyle === undefined ? {} : { style: resolvedStyle };

	return (
		<Text
			{...textProps}
			elementType={elementType}
			shouldDisableTrim={resolvedShouldDisableTrim}
			textAlign={textAlign}
			variant={variant}
			{...colorProps}
			{...styleProps}
		>
			{content}
		</Text>
	);
}
