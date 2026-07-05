import { createTheme, createThemeContract } from '@vanilla-extract/css';
import { toCssValue } from '../tokens/converters.js';
import { tokenKeys } from '../tokens/groups.js';
import { tokens } from '../tokens/index.js';
import { classSelector, lukeUiClassNames } from './class-names.js';
import { globalStyleInLayer } from './layered-style.css.js';
import { layers } from './layers.css.js';

type TokenGroup = {
	$type: string;
	[key: string]: { $value: unknown } | string;
};

type TokenGroupKey<T extends TokenGroup> = Exclude<keyof T, '$type'>;

function toContract<T extends TokenGroup>(group: T): Record<TokenGroupKey<T>, null> {
	const contract = {} as Record<TokenGroupKey<T>, null>;
	for (const key of tokenKeys(group)) {
		contract[key] = null;
	}
	return contract;
}

function toStringValues<T extends TokenGroup>(group: T): Record<TokenGroupKey<T>, string> {
	const values = {} as Record<TokenGroupKey<T>, string>;
	for (const key of tokenKeys(group)) {
		const entry = group[key];
		if (entry && typeof entry === 'object' && '$value' in entry) {
			values[key] = toCssValue(group.$type, entry.$value);
		}
	}
	return values;
}

const contract = createThemeContract({
	backgroundColor: toContract(tokens.backgroundColor),
	borderColor: toContract(tokens.borderColor),
	borderRadius: toContract(tokens.borderRadius),
	borderWidth: toContract(tokens.borderWidth),
	boxShadow: toContract(tokens.boxShadow),
	controlSize: toContract(tokens.controlSize),
	fontFamily: toContract(tokens.fontFamily),
	fontSize: toContract(tokens.fontSize),
	fontWeight: toContract(tokens.fontWeight),
	foregroundColor: toContract(tokens.foregroundColor),
	iconSize: toContract(tokens.iconSize),
	lineHeight: toContract(tokens.lineHeight),
	motionDuration: toContract(tokens.motionDuration),
	motionEasing: toContract(tokens.motionEasing),
	space: toContract(tokens.space),
	themeColor: toContract(tokens.themeColor),
});

export const themeClass = createTheme(contract, {
	'@layer': layers.theme,
	backgroundColor: toStringValues(tokens.backgroundColor),
	borderColor: toStringValues(tokens.borderColor),
	borderRadius: toStringValues(tokens.borderRadius),
	borderWidth: toStringValues(tokens.borderWidth),
	boxShadow: toStringValues(tokens.boxShadow),
	controlSize: toStringValues(tokens.controlSize),
	fontFamily: toStringValues(tokens.fontFamily),
	fontSize: toStringValues(tokens.fontSize),
	fontWeight: toStringValues(tokens.fontWeight),
	foregroundColor: toStringValues(tokens.foregroundColor),
	iconSize: toStringValues(tokens.iconSize),
	lineHeight: toStringValues(tokens.lineHeight),
	motionDuration: toStringValues(tokens.motionDuration),
	motionEasing: toStringValues(tokens.motionEasing),
	space: toStringValues(tokens.space),
	themeColor: toStringValues(tokens.themeColor),
});

export const vars = {
	...contract,
	backgroundColor: {
		...contract.backgroundColor,
		default: contract.backgroundColor.neutral,
		disabled: contract.backgroundColor.neutralDisabled,
		hover: contract.backgroundColor.neutralHover,
		input: contract.backgroundColor.input,
		inputDisabled: contract.backgroundColor.inputDisabled,
		inverted: contract.backgroundColor.neutralInverted,
		pressed: contract.backgroundColor.neutralPressed,
		subtle: contract.backgroundColor.neutralSubtle,
	},
	border: {
		critical: contract.borderColor.inputCritical,
		default: contract.borderColor.neutralSubtle,
		input: contract.borderColor.input,
		strong: contract.borderColor.neutralBold,
	},
	boxShadow: contract.boxShadow,
	color: contract.foregroundColor,
	font: {
		family: { body: contract.fontFamily.sans, mono: contract.fontFamily.mono },
		lineHeight: contract.lineHeight,
		size: contract.fontSize,
		weight: contract.fontWeight,
	},
	foregroundColor: {
		...contract.foregroundColor,
		disabled: contract.foregroundColor.neutralDisabled,
		inverse: contract.foregroundColor.neutralBoldInverted,
		primary: contract.foregroundColor.neutralBold,
		secondary: contract.foregroundColor.neutralSubtle,
		status: {
			caution: contract.foregroundColor.caution,
			critical: contract.foregroundColor.critical,
			informative: contract.foregroundColor.informative,
			positive: contract.foregroundColor.positive,
		},
	},
	iconSize: contract.iconSize,
	motion: {
		duration: contract.motionDuration,
		easing: contract.motionEasing,
	},
	themeColor: contract.themeColor,
};

const themeRootSelector = classSelector(lukeUiClassNames.themeRoot);

globalStyleInLayer('theme', themeRootSelector, {
	accentColor: vars.themeColor.paletteThemePrimary500,
	color: vars.foregroundColor.primary,
	colorScheme: 'light',
	fontFamily: vars.font.family.body,
	fontSize: vars.font.size.standard,
	lineHeight: vars.font.lineHeight.loose,
});
