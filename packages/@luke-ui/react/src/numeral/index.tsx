import { useLocale } from 'react-aria-components/I18nProvider';
import { useIsWithinHeading } from '../heading-context/index.js';
import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';

/** Number format style used by `Numeral`. */
export type NumeralFormat = 'decimal' | 'percent' | 'currency' | 'unit';
/** Compact number display mode. */
export type NumeralAbbreviation = boolean | 'long';
/** Fixed precision or `[min, max]` precision range. */
export type NumeralPrecision = number | readonly [number, number];

/**
 * Props for `Numeral`.
 *
 * @tier atom
 */
export interface NumeralProps extends Omit<
	TextProps,
	'children' | 'textAlign' | 'fontVariantNumeric'
> {
	/** Enables compact notation (`1.2K`, `1.2 thousand`). */
	abbreviate?: NumeralAbbreviation;
	/** Currency code such as `USD`. */
	currency?: string;
	/**
	 * Numeric glyph rendering mode.
	 * @default 'tabular-nums'
	 */
	fontVariantNumeric?: TextProps['fontVariantNumeric'];
	/** Number format style. Inferred from `currency`/`unit` when omitted. */
	format?: NumeralFormat;
	/** Extra options passed to `Intl.NumberFormat`. */
	formatOptions?: Intl.NumberFormatOptions;
	/** Locale used for formatting. Defaults to locale context. */
	locale?: Intl.LocalesArgument;
	/** Precision as fixed digits or `[min, max]` digits. */
	precision?: NumeralPrecision;
	/**
	 * Text alignment. Right-aligned by default for numeric columns.
	 * @default 'end'
	 */
	textAlign?: TextProps['textAlign'];
	/** Unit name when `format` is `unit`, e.g. `kilometer`. */
	unit?: NonNullable<Intl.NumberFormatOptions['unit']>;
	/** Number to format. */
	value: number;
}

/** Formats a number and renders it with the same typography props as `Text`. */
export function Numeral(props: NumeralProps) {
	const { locale: localeFromContext } = useLocale();
	const isWithinHeading = useIsWithinHeading();
	const {
		abbreviate,
		color,
		textAlign = 'end',
		currency,
		elementType = 'span',
		fontVariantNumeric = 'tabular-nums',
		format,
		formatOptions,
		locale,
		precision,
		shouldDisableTrim,
		unit,
		value,
		...textProps
	} = props;
	const resolvedLocale = locale ?? localeFromContext;

	const resolvedFormat: NumeralFormat = (() => {
		if (format != null) return format;
		if (currency) return 'currency';
		if (unit) return 'unit';

		return 'decimal';
	})();

	const numeralFormatOptions = resolveNumeralFormatOptions({
		abbreviate,
		currency,
		format: resolvedFormat,
		formatOptions,
		precision,
		unit,
	});

	const content = getCachedNumberFormat(resolvedLocale, numeralFormatOptions).format(value);
	const resolvedShouldDisableTrim = shouldDisableTrim ?? isWithinHeading;

	return (
		<Text
			{...textProps}
			elementType={elementType}
			fontVariantNumeric={fontVariantNumeric}
			shouldDisableTrim={resolvedShouldDisableTrim}
			shouldInheritFont={isWithinHeading}
			textAlign={textAlign}
			{...(color === undefined ? {} : { color })}
		>
			{content}
		</Text>
	);
}

function resolvePrecisionRange(precision: NumeralPrecision): readonly [number, number] {
	if (typeof precision === 'number') return [precision, precision];

	return precision;
}

function resolveNumeralFormatOptions({
	abbreviate,
	currency,
	format,
	formatOptions,
	precision,
	unit,
}: Pick<NumeralProps, 'abbreviate' | 'currency' | 'formatOptions' | 'precision' | 'unit'> & {
	format: NumeralFormat;
}): Intl.NumberFormatOptions {
	const options: Intl.NumberFormatOptions = { ...formatOptions, style: format };

	if (format === 'currency') {
		if (currency === undefined) {
			throw new Error('Numeral with format="currency" requires a `currency` code.');
		}
		options.currency = currency;
	}

	if (format === 'unit') {
		if (unit === undefined) {
			throw new Error('Numeral with format="unit" requires a `unit` value.');
		}
		options.unit = unit;
		options.unitDisplay = formatOptions?.unitDisplay ?? 'narrow';
	}

	if (abbreviate) {
		options.compactDisplay = abbreviate === 'long' ? 'long' : 'short';
		options.notation = 'compact';
	}

	if (precision !== undefined) {
		const [minimumFractionDigits, maximumFractionDigits] = resolvePrecisionRange(precision);
		options.minimumFractionDigits = minimumFractionDigits;
		options.maximumFractionDigits = maximumFractionDigits;
	}

	return options;
}

const numeralFormatCache = new Map<string, Intl.NumberFormat>();

function getCachedNumberFormat(locale: Intl.LocalesArgument, options: Intl.NumberFormatOptions) {
	const key = `${String(locale)}:${JSON.stringify(options)}`;
	let cached = numeralFormatCache.get(key);
	if (!cached) {
		cached = new Intl.NumberFormat(locale, options);
		numeralFormatCache.set(key, cached);
	}
	return cached;
}
