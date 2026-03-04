import { useLocale } from 'react-aria-components';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';
import { useIsWithinHeading } from './heading-context.js';

/** Number format style used by `Numeral`. */
export type NumeralFormat = 'decimal' | 'percent' | 'currency' | 'unit';
/** Compact number display mode. */
export type NumeralAbbreviation = boolean | 'long';
/** Fixed precision or `[min, max]` precision range. */
export type NumeralPrecision = number | readonly [number, number];

/** Props for `Numeral`. */
export interface NumeralProps extends Omit<TextProps, 'children' | 'textAlign' | 'variant'> {
	/** Enables compact notation (`1.2K`, `1.2 thousand`). */
	abbreviate?: NumeralAbbreviation;
	textAlign?: TextProps['textAlign'];
	/** Currency code such as `USD`. */
	currency?: string;
	/** Number format style. Inferred from `currency`/`unit` when omitted. */
	format?: NumeralFormat;
	/** Extra options passed to `Intl.NumberFormat`. */
	formatOptions?: Intl.NumberFormatOptions;
	/** Locale used for formatting. Defaults to locale context. */
	locale?: Intl.LocalesArgument;
	/** Precision as fixed digits or `[min, max]` digits. */
	precision?: NumeralPrecision;
	/** Unit name when `format` is `unit`, e.g. `kilometer`. */
	unit?: NonNullable<Intl.NumberFormatOptions['unit']>;
	/** Number to format. */
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

/**
 * Formats a number and renders it with `Text`.
 * @throws When `currency` and `unit` are both provided or precision is invalid.
 */
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
	const colorProps: Pick<TextProps, 'color'> | {} =
		resolvedColor === undefined ? {} : { color: resolvedColor };

	return (
		<Text
			{...textProps}
			elementType={elementType}
			shouldInheritFont={isWithinHeading}
			shouldDisableTrim={resolvedShouldDisableTrim}
			textAlign={textAlign}
			variant={variant}
			{...colorProps}
		>
			{content}
		</Text>
	);
}
