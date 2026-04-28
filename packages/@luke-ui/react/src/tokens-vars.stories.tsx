import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type {
	ColorTokenValue,
	CubicBezierTokenValue,
	DimensionTokenValue,
	DurationTokenValue,
} from '@luke-ui/react/tokens';
import {
	colorToCssString,
	cubicBezierToString,
	dimensionToRemString,
	durationToString,
	tokenKeys,
	tokens,
} from '@luke-ui/react/tokens';
import ColorJs from 'colorjs.io';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../.storybook/preview.js';

type StoryTokenGroup = {
	$type: string;
	[key: string]: { $value: unknown } | string;
};

type TokenRow = {
	cssValue: string;
	groupName: string;
	path: string;
	type: string;
	value: string;
};

type ExampleRow = {
	cssValue: string;
	displayValue: string;
	path: string;
	tokenName: string;
};

type VarRow = {
	cssVar: string;
	path: string;
};

type ExampleMode =
	| 'background'
	| 'border'
	| 'borderWidth'
	| 'breakpoint'
	| 'controlSize'
	| 'duration'
	| 'easing'
	| 'fontFamily'
	| 'fontSize'
	| 'fontWeight'
	| 'foreground'
	| 'iconSize'
	| 'lineHeight'
	| 'mediaQuery'
	| 'radius'
	| 'shadow'
	| 'space';

const tokenGroups = [
	['backgroundColor', tokens.backgroundColor],
	['borderColor', tokens.borderColor],
	['borderRadius', tokens.borderRadius],
	['borderWidth', tokens.borderWidth],
	['boxShadow', tokens.boxShadow],
	['breakpoints', tokens.breakpoints],
	['controlSize', tokens.controlSize],
	['fontFamily', tokens.fontFamily],
	['fontSize', tokens.fontSize],
	['fontWeight', tokens.fontWeight],
	['foregroundColor', tokens.foregroundColor],
	['iconSize', tokens.iconSize],
	['lineHeight', tokens.lineHeight],
	['mediaQueries.min', tokens.mediaQueries.min],
	['motionDuration', tokens.motionDuration],
	['motionEasing', tokens.motionEasing],
	['space', tokens.space],
	['themeColor', tokens.themeColor],
] as const;

const tokenRows = tokenGroups
	.flatMap(([groupName, group]) => getTokenRows(groupName, group))
	.sort((a, b) => a.path.localeCompare(b.path));

const varRows = getVarRows(vars).sort((a, b) => a.path.localeCompare(b.path));

const backgroundColorRows = getColorRows('backgroundColor', tokens.backgroundColor);
const foregroundColorRows = getColorRows('foregroundColor', tokens.foregroundColor);
const borderColorRows = getColorRows('borderColor', tokens.borderColor);
const themeColorRows = getColorRows('themeColor', tokens.themeColor);

const spaceRows = getDimensionRows('space', tokens.space);
const shadowRows = getStringRows('boxShadow', tokens.boxShadow);
const borderRadiusRows = getDimensionRows('borderRadius', tokens.borderRadius);
const borderWidthRows = getDimensionRows('borderWidth', tokens.borderWidth);
const fontSizeRows = getDimensionRows('fontSize', tokens.fontSize);
const lineHeightRows = getNumberRows('lineHeight', tokens.lineHeight);
const fontWeightRows = getNumberRows('fontWeight', tokens.fontWeight);
const fontFamilyRows = getStringRows('fontFamily', tokens.fontFamily);
const controlSizeRows = getDimensionRows('controlSize', tokens.controlSize);
const iconSizeRows = getDimensionRows('iconSize', tokens.iconSize);
const motionDurationRows = getDurationRows('motionDuration', tokens.motionDuration);
const motionEasingRows = getCubicBezierRows('motionEasing', tokens.motionEasing);
const breakpointRows = getDimensionRows('breakpoints', tokens.breakpoints);
const mediaQueryRows = getStringRows('mediaQueries.min', tokens.mediaQueries.min);

const meta = preview.meta({
	component: TokensVarsReference,
	tags: ['theme'],
	title: 'Theme/Tokens & Vars',
});

function css<TStyle extends CSSProperties>(style: TStyle): TStyle {
	return style;
}

function columnStyle(inlineSize: string): CSSProperties {
	return css({ inlineSize });
}

const stackStyle = css({
	display: 'flex',
	flexDirection: 'column',
	gap: '1.5rem',
	maxInlineSize: '100%',
});

const sectionStyle = css({
	display: 'flex',
	flexDirection: 'column',
	gap: '0.75rem',
});

const tableWrapStyle = css({
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.medium,
	inlineSize: '100%',
	maxInlineSize: '100%',
	overflow: 'auto',
});

const tokenReferenceTableStyle = css({
	borderCollapse: 'collapse',
	fontFamily: vars.font.family.mono,
	fontSize: vars.font.size.standard,
	inlineSize: '100%',
	minInlineSize: '82rem',
	tableLayout: 'fixed',
});

const varsReferenceTableStyle = css({
	borderCollapse: 'collapse',
	fontFamily: vars.font.family.mono,
	fontSize: vars.font.size.standard,
	inlineSize: '100%',
	minInlineSize: '64rem',
	tableLayout: 'fixed',
});

const headerCellStyle = css({
	backgroundColor: vars.backgroundColor.subtle,
	borderBlockEndColor: vars.border.default,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	fontWeight: vars.font.weight.bold,
	paddingBlock: vars.space.xsmall,
	paddingInline: vars.space.small,
	textAlign: 'start',
	whiteSpace: 'nowrap',
});

const cellStyle = css({
	borderBlockEndColor: vars.border.default,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	overflowWrap: 'anywhere',
	paddingBlock: vars.space.xsmall,
	paddingInline: vars.space.small,
	verticalAlign: 'top',
});

const headingStyle = css({
	fontFamily: vars.font.family.body,
	fontSize: vars.font.size.medium,
	fontWeight: vars.font.weight.bold,
	lineHeight: vars.font.lineHeight.tight,
	margin: 0,
});

const descriptionStyle = css({
	color: vars.foregroundColor.secondary,
	fontFamily: vars.font.family.body,
	margin: 0,
});

const previewSwatchStyle = css({
	blockSize: '1.5rem',
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.small,
	display: 'inline-block',
	inlineSize: '4rem',
});

const previewBoxStyle = css({
	backgroundColor: vars.backgroundColor.default,
	blockSize: '1.5rem',
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	display: 'inline-block',
	inlineSize: '4rem',
});

const previewTextStyle = css({
	fontFamily: vars.font.family.body,
	fontSize: vars.font.size.standard,
	fontWeight: vars.font.weight.bold,
});

const mutedPreviewStyle = css({
	color: vars.foregroundColor.secondary,
});

const docsPageStyle = css({
	backgroundColor: vars.backgroundColor.default,
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.large,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.large,
	paddingBlock: vars.space.large,
	paddingInline: vars.space.large,
});

const docsMainStyle = css({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.large,
	minInlineSize: 0,
});

const tokenSectionStyle = css({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.small,
});

const tokenTableWrapStyle = css({
	backgroundColor: vars.backgroundColor.default,
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.medium,
	overflow: 'auto',
});

const tokenTableStyle = css({
	borderCollapse: 'collapse',
	fontFamily: vars.font.family.body,
	fontSize: vars.font.size.standard,
	inlineSize: '100%',
	minInlineSize: '50rem',
	tableLayout: 'fixed',
});

const tokenTableHeaderCellStyle = css({
	backgroundColor: vars.backgroundColor.subtle,
	borderBlockEndColor: vars.border.default,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	fontWeight: vars.font.weight.bold,
	paddingBlock: vars.space.small,
	paddingInline: vars.space.small,
	textAlign: 'start',
});

const tokenTableCellStyle = css({
	borderBlockEndColor: vars.border.default,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	overflowWrap: 'anywhere',
	paddingBlock: vars.space.small,
	paddingInline: vars.space.small,
	verticalAlign: 'middle',
});

const examplesColExampleStyle = columnStyle('20rem');
const examplesColTokenKeyStyle = columnStyle('16rem');
const examplesColTokenValueStyle = columnStyle('14rem');

const tokenRefColPathStyle = columnStyle('24rem');
const tokenRefColTypeStyle = columnStyle('8rem');
const tokenRefColRawStyle = columnStyle('24rem');
const tokenRefColCssStyle = columnStyle('18rem');
const tokenRefColPreviewStyle = columnStyle('8rem');

const varsRefColPathStyle = columnStyle('24rem');
const varsRefColValueStyle = columnStyle('28rem');
const varsRefColPreviewStyle = columnStyle('10rem');

const tokenPillStyle = css({
	backgroundColor: vars.backgroundColor.subtle,
	borderRadius: vars.borderRadius.small,
	display: 'inline-flex',
	fontFamily: vars.font.family.mono,
	fontSize: vars.font.size.standard,
	fontWeight: vars.font.weight.medium,
	paddingBlock: vars.space.xxsmall,
	paddingInline: vars.space.xsmall,
});

const tokenValueStyle = css({
	fontFamily: vars.font.family.mono,
	fontSize: vars.font.size.standard,
});

const exampleBarStyle = css({
	blockSize: '2.75rem',
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.small,
	inlineSize: '14rem',
	maxInlineSize: '100%',
});

const sampleTextStyle = css({
	color: vars.foregroundColor.primary,
	fontFamily: vars.font.family.body,
	fontSize: vars.font.size.standard,
	fontWeight: vars.font.weight.regular,
});

const motionTrackStyle = css({
	...exampleBarStyle,
	alignItems: 'center',
	display: 'flex',
	paddingInline: vars.space.xsmall,
});

const motionRailStyle = css({
	backgroundColor: vars.backgroundColor.inputDisabled,
	blockSize: '1.25rem',
	borderColor: vars.border.default,
	borderStyle: 'solid',
	borderWidth: 1,
	borderRadius: vars.borderRadius.full,
	inlineSize: '100%',
	position: 'relative',
});

const motionDotBaseStyle = css({
	backgroundColor: vars.themeColor.paletteThemePrimary600,
	blockSize: '1rem',
	borderRadius: vars.borderRadius.full,
	boxShadow: `0 0 0 ${vars.space.xxsmall} ${vars.themeColor.paletteThemePrimary200}`,
	display: 'inline-block',
	insetBlockStart: '50%',
	position: 'absolute',
	transform: 'translateY(-50%)',
});

const motionPreviewDefaultDuration = '1200ms';
const motionPreviewDefaultEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
const motionDotInset = '0.25rem';
const motionDotSize = '1rem';
const motionPreviewAnimationName = 'luke-ui-motion-token-preview';

function formatRawValue(value: unknown): string {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	return JSON.stringify(value);
}

function toCssValue(type: string, value: unknown): string {
	if (type === 'color') {
		return colorToCssString(value as ColorTokenValue);
	}

	if (type === 'cubicBezier') {
		return cubicBezierToString(value as CubicBezierTokenValue);
	}

	if (type === 'dimension') {
		return dimensionToRemString(value as DimensionTokenValue);
	}

	if (type === 'duration') {
		return durationToString(value as DurationTokenValue);
	}

	return String(value);
}

function colorToDisplayValue(value: ColorTokenValue): string {
	if (value.colorSpace === 'srgb' && value.alpha === undefined) {
		try {
			const color = new ColorJs(colorToCssString(value));
			return color.toString({ collapse: false, format: 'hex' }).toUpperCase();
		} catch {
			return colorToCssString(value);
		}
	}

	return colorToCssString(value);
}

function getTokenValue(group: StoryTokenGroup, tokenName: string, groupName: string): unknown {
	const token = group[tokenName];
	if (token && typeof token === 'object' && '$value' in token) {
		return token.$value;
	}

	throw new TypeError(`Expected token value for ${groupName}.${tokenName}`);
}

function getTokenRows(groupName: string, group: StoryTokenGroup): Array<TokenRow> {
	return tokenKeys(group).map((tokenName) => {
		const tokenValue = getTokenValue(group, tokenName, groupName);
		return {
			cssValue: toCssValue(group.$type, tokenValue),
			groupName,
			path: `${groupName}.${tokenName}`,
			type: group.$type,
			value: formatRawValue(tokenValue),
		};
	});
}

function getRows(
	groupName: string,
	group: StoryTokenGroup,
	toValues: (value: unknown) => { cssValue: string; displayValue: string },
): Array<ExampleRow> {
	return tokenKeys(group).map((tokenName) => {
		const tokenValue = getTokenValue(group, tokenName, groupName);
		const values = toValues(tokenValue);
		return {
			cssValue: values.cssValue,
			displayValue: values.displayValue,
			path: `${groupName}.${tokenName}`,
			tokenName,
		};
	});
}

function getColorRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	if (group.$type !== 'color') {
		return [];
	}

	return getRows(groupName, group, (value) => {
		const colorValue = value as ColorTokenValue;
		return {
			cssValue: colorToCssString(colorValue),
			displayValue: colorToDisplayValue(colorValue),
		};
	});
}

function getDimensionRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	if (group.$type !== 'dimension') {
		return [];
	}

	return getRows(groupName, group, (value) => {
		const cssValue = toCssValue('dimension', value);
		return { cssValue, displayValue: cssValue };
	});
}

function getDurationRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	if (group.$type !== 'duration') {
		return [];
	}

	return getRows(groupName, group, (value) => {
		const cssValue = toCssValue('duration', value);
		return { cssValue, displayValue: cssValue };
	});
}

function getCubicBezierRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	if (group.$type !== 'cubicBezier') {
		return [];
	}

	return getRows(groupName, group, (value) => {
		const cssValue = toCssValue('cubicBezier', value);
		return { cssValue, displayValue: cssValue };
	});
}

function getNumberRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	if (group.$type !== 'number' && group.$type !== 'fontWeight') {
		return [];
	}

	return getRows(groupName, group, (value) => {
		const stringValue = String(value);
		return { cssValue: stringValue, displayValue: stringValue };
	});
}

function getStringRows(groupName: string, group: StoryTokenGroup): Array<ExampleRow> {
	return getRows(groupName, group, (value) => {
		const stringValue = String(value);
		return { cssValue: stringValue, displayValue: stringValue };
	});
}

function getVarRows(node: unknown, path: Array<string> = []): Array<VarRow> {
	if (typeof node === 'string') {
		return node.startsWith('var(--') ? [{ cssVar: node, path: path.join('.') }] : [];
	}

	if (!node || typeof node !== 'object') {
		return [];
	}

	return Object.entries(node).flatMap(([key, value]) => getVarRows(value, [...path, key]));
}

function renderTokenPreview(row: TokenRow) {
	if (row.type === 'color') {
		return <span style={{ ...previewSwatchStyle, backgroundColor: row.cssValue }} />;
	}

	if (row.groupName === 'borderRadius') {
		return (
			<span
				style={{
					...previewBoxStyle,
					borderRadius: row.cssValue,
				}}
			/>
		);
	}

	if (row.groupName === 'boxShadow') {
		return <span style={{ ...previewBoxStyle, boxShadow: row.cssValue }} />;
	}

	if (row.groupName === 'borderWidth') {
		return (
			<span
				style={{
					...previewBoxStyle,
					borderWidth: row.cssValue,
				}}
			/>
		);
	}

	return <span style={mutedPreviewStyle}>-</span>;
}

function renderVarPreview(row: VarRow) {
	if (row.path.includes('foregroundColor')) {
		return <span style={{ ...previewTextStyle, color: row.cssVar }}>Aa</span>;
	}

	if (row.path.includes('backgroundColor') || row.path.includes('themeColor')) {
		return <span style={{ ...previewSwatchStyle, backgroundColor: row.cssVar }} />;
	}

	if (row.path.includes('borderColor') || row.path.startsWith('border.')) {
		return (
			<span
				style={{
					...previewBoxStyle,
					borderColor: row.cssVar,
				}}
			/>
		);
	}

	if (row.path.includes('boxShadow')) {
		return <span style={{ ...previewBoxStyle, boxShadow: row.cssVar }} />;
	}

	if (row.path.includes('borderRadius')) {
		return (
			<span
				style={{
					...previewBoxStyle,
					borderRadius: row.cssVar,
				}}
			/>
		);
	}

	return <span style={mutedPreviewStyle}>-</span>;
}

function SharedPreviewBox({ size }: { size: string }) {
	return (
		<span
			style={{
				backgroundColor: vars.themeColor.paletteThemePrimary300,
				blockSize: size,
				display: 'inline-block',
				inlineSize: size,
			}}
		/>
	);
}

function SizePreview({ size }: { size: string }) {
	return (
		<div
			style={{
				...exampleBarStyle,
				display: 'grid',
				placeItems: 'center',
			}}
		>
			<SharedPreviewBox size={size} />
		</div>
	);
}

function MotionPreview({ duration, easing }: { duration: string; easing: string }) {
	return (
		<div style={motionTrackStyle}>
			<style>{`@keyframes ${motionPreviewAnimationName} { from { inset-inline-start: ${motionDotInset}; } to { inset-inline-start: calc(100% - ${motionDotSize} - ${motionDotInset}); } }`}</style>
			<div style={motionRailStyle}>
				<span
					style={{
						...motionDotBaseStyle,
						animationDirection: 'alternate',
						animationDuration: duration,
						animationIterationCount: 'infinite',
						animationName: motionPreviewAnimationName,
						animationTimingFunction: easing,
						insetInlineStart: motionDotInset,
					}}
				/>
			</div>
		</div>
	);
}

function RenderExamplePreview({ mode, row }: { mode: ExampleMode; row: ExampleRow }) {
	switch (mode) {
		case 'foreground':
			return (
				<div
					style={{
						...exampleBarStyle,
						display: 'grid',
						placeItems: 'center',
					}}
				>
					<span style={{ ...previewTextStyle, color: row.cssValue }}>Aa</span>
				</div>
			);
		case 'border':
			return <div style={{ ...exampleBarStyle, borderColor: row.cssValue }} />;
		case 'background':
			return <div style={{ ...exampleBarStyle, backgroundColor: row.cssValue }} />;
		case 'space': {
			const boxSize = vars.space.large;
			return (
				<div
					style={{
						...exampleBarStyle,
						display: 'flex',
						alignItems: 'center',
						paddingInline: vars.space.xsmall,
					}}
				>
					<div
						style={{
							display: 'flex',
							gap: row.cssValue,
						}}
					>
						<SharedPreviewBox size={boxSize} />
						<SharedPreviewBox size={boxSize} />
						<SharedPreviewBox size={boxSize} />
					</div>
				</div>
			);
		}
		case 'shadow':
			return <div style={{ ...exampleBarStyle, boxShadow: row.cssValue }} />;
		case 'radius':
			return <div style={{ ...exampleBarStyle, borderRadius: row.cssValue }} />;
		case 'borderWidth':
			return <div style={{ ...exampleBarStyle, borderWidth: row.cssValue }} />;
		case 'fontSize':
			return <span style={{ ...sampleTextStyle, fontSize: row.cssValue }}>Sample text</span>;
		case 'lineHeight':
			return (
				<span
					style={{
						...sampleTextStyle,
						display: 'inline-block',
						lineHeight: row.cssValue,
					}}
				>
					Line one
					<br />
					Line two
				</span>
			);
		case 'fontWeight':
			return <span style={{ ...sampleTextStyle, fontWeight: row.cssValue }}>Weight</span>;
		case 'fontFamily':
			return (
				<span style={{ ...sampleTextStyle, fontFamily: row.cssValue }}>Sphinx of black quartz</span>
			);
		case 'controlSize':
		case 'iconSize':
			return <SizePreview size={row.cssValue} />;
		case 'breakpoint':
			return <span style={tokenValueStyle}>{`min-width >= ${row.displayValue}`}</span>;
		case 'duration':
			return <MotionPreview duration={row.cssValue} easing={motionPreviewDefaultEasing} />;
		case 'easing':
			return <MotionPreview duration={motionPreviewDefaultDuration} easing={row.cssValue} />;
		case 'mediaQuery':
			return <span style={tokenValueStyle}>{row.displayValue}</span>;
		default:
			return <span style={mutedPreviewStyle}>-</span>;
	}
}

function TokenExamplesTable({ mode, rows }: { mode: ExampleMode; rows: Array<ExampleRow> }) {
	return (
		<section style={tokenSectionStyle}>
			<div style={tokenTableWrapStyle}>
				<table style={tokenTableStyle}>
					<colgroup>
						<col style={examplesColExampleStyle} />
						<col style={examplesColTokenKeyStyle} />
						<col style={examplesColTokenValueStyle} />
					</colgroup>
					<thead>
						<tr>
							<th style={tokenTableHeaderCellStyle}>Example</th>
							<th style={tokenTableHeaderCellStyle}>Token key</th>
							<th style={tokenTableHeaderCellStyle}>Token value</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.path}>
								<td style={tokenTableCellStyle}>
									<RenderExamplePreview mode={mode} row={row} />
								</td>
								<td style={tokenTableCellStyle}>
									<span style={tokenPillStyle}>{row.tokenName}</span>
								</td>
								<td style={tokenTableCellStyle}>
									<span style={tokenValueStyle}>{row.displayValue}</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function TokensVarsReference() {
	return (
		<div style={stackStyle}>
			<section style={sectionStyle}>
				<h2 style={headingStyle}>Tokens</h2>
				<p style={descriptionStyle}>
					Design-token source values, computed CSS value, and a visual preview.
				</p>
				<div style={tableWrapStyle}>
					<table style={tokenReferenceTableStyle}>
						<colgroup>
							<col style={tokenRefColPathStyle} />
							<col style={tokenRefColTypeStyle} />
							<col style={tokenRefColRawStyle} />
							<col style={tokenRefColCssStyle} />
							<col style={tokenRefColPreviewStyle} />
						</colgroup>
						<thead>
							<tr>
								<th style={headerCellStyle}>Path</th>
								<th style={headerCellStyle}>Type</th>
								<th style={headerCellStyle}>$value</th>
								<th style={headerCellStyle}>CSS value</th>
								<th style={headerCellStyle}>Preview</th>
							</tr>
						</thead>
						<tbody>
							{tokenRows.map((row) => (
								<tr key={row.path}>
									<td style={cellStyle}>{row.path}</td>
									<td style={cellStyle}>{row.type}</td>
									<td style={cellStyle}>{row.value}</td>
									<td style={cellStyle}>{row.cssValue}</td>
									<td style={cellStyle}>{renderTokenPreview(row)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
			<section style={sectionStyle}>
				<h2 style={headingStyle}>CSS Variables</h2>
				<p style={descriptionStyle}>
					Flattened paths from `theme.vars`, including a quick visual preview.
				</p>
				<div style={tableWrapStyle}>
					<table style={varsReferenceTableStyle}>
						<colgroup>
							<col style={varsRefColPathStyle} />
							<col style={varsRefColValueStyle} />
							<col style={varsRefColPreviewStyle} />
						</colgroup>
						<thead>
							<tr>
								<th style={headerCellStyle}>Path</th>
								<th style={headerCellStyle}>Variable</th>
								<th style={headerCellStyle}>Preview</th>
							</tr>
						</thead>
						<tbody>
							{varRows.map((row) => (
								<tr key={row.path}>
									<td style={cellStyle}>{row.path}</td>
									<td style={cellStyle}>{row.cssVar}</td>
									<td style={cellStyle}>{renderVarPreview(row)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}

type TokenTypeStoryConfig = {
	description?: string;
	mode: ExampleMode;
	rows: Array<ExampleRow>;
	title: string;
};

function TokenTypeStory({
	description = 'A visual reference for this token type.',
	mode,
	rows,
	title,
}: TokenTypeStoryConfig) {
	return (
		<div style={docsPageStyle}>
			<section style={sectionStyle}>
				<Heading elementType="h1" fontWeight="bold" lineHeight="tight">
					{title}
				</Heading>
				<Text elementType="p" color="neutralSubtle" fontSize="medium" lineHeight="loose">
					{description}
				</Text>
			</section>
			<main style={docsMainStyle}>
				<TokenExamplesTable mode={mode} rows={rows} />
			</main>
		</div>
	);
}

type StoryCanvas = {
	getByRole: (role: string, options: { name: string }) => unknown;
};

const tokenTypeStoryConfigs = {
	backgroundColor: { mode: 'background', rows: backgroundColorRows, title: 'Background color' },
	borderColor: { mode: 'border', rows: borderColorRows, title: 'Border color' },
	borderRadius: { mode: 'radius', rows: borderRadiusRows, title: 'Border radius' },
	borderWidth: { mode: 'borderWidth', rows: borderWidthRows, title: 'Border width' },
	boxShadow: { mode: 'shadow', rows: shadowRows, title: 'Box shadow' },
	breakpoints: { mode: 'breakpoint', rows: breakpointRows, title: 'Breakpoints' },
	color: { mode: 'foreground', rows: foregroundColorRows, title: 'Color' },
	controlSize: { mode: 'controlSize', rows: controlSizeRows, title: 'Control size' },
	fontFamily: { mode: 'fontFamily', rows: fontFamilyRows, title: 'Font family' },
	fontSize: { mode: 'fontSize', rows: fontSizeRows, title: 'Font size' },
	fontWeight: { mode: 'fontWeight', rows: fontWeightRows, title: 'Font weight' },
	iconSize: { mode: 'iconSize', rows: iconSizeRows, title: 'Icon size' },
	lineHeight: { mode: 'lineHeight', rows: lineHeightRows, title: 'Line height' },
	mediaQueries: { mode: 'mediaQuery', rows: mediaQueryRows, title: 'Media queries' },
	motionDuration: { mode: 'duration', rows: motionDurationRows, title: 'Motion duration' },
	motionEasing: { mode: 'easing', rows: motionEasingRows, title: 'Motion easing' },
	space: { mode: 'space', rows: spaceRows, title: 'Space' },
	themeColor: { mode: 'background', rows: themeColorRows, title: 'Theme color' },
} satisfies Record<string, TokenTypeStoryConfig>;

async function expectHeadingInStory(canvas: StoryCanvas, heading: string) {
	await expect(canvas.getByRole('heading', { name: heading })).toBeInTheDocument();
}

function RenderTokenTypeStory(props: TokenTypeStoryConfig) {
	return <TokenTypeStory {...props} />;
}

function tokenTypeStory(config: TokenTypeStoryConfig) {
	return {
		play: async ({ canvas }: { canvas: StoryCanvas }) => {
			await expectHeadingInStory(canvas, config.title);
		},
		render: () => <RenderTokenTypeStory {...config} />,
	};
}

export const BackgroundColor = meta.story(tokenTypeStory(tokenTypeStoryConfigs.backgroundColor));

export const Color = meta.story(tokenTypeStory(tokenTypeStoryConfigs.color));

export const BorderColor = meta.story(tokenTypeStory(tokenTypeStoryConfigs.borderColor));

export const ThemeColor = meta.story(tokenTypeStory(tokenTypeStoryConfigs.themeColor));

export const Space = meta.story(tokenTypeStory(tokenTypeStoryConfigs.space));

export const BoxShadow = meta.story(tokenTypeStory(tokenTypeStoryConfigs.boxShadow));

export const BorderRadius = meta.story(tokenTypeStory(tokenTypeStoryConfigs.borderRadius));

export const BorderWidth = meta.story(tokenTypeStory(tokenTypeStoryConfigs.borderWidth));

export const FontSize = meta.story(tokenTypeStory(tokenTypeStoryConfigs.fontSize));

export const LineHeight = meta.story(tokenTypeStory(tokenTypeStoryConfigs.lineHeight));

export const FontWeight = meta.story(tokenTypeStory(tokenTypeStoryConfigs.fontWeight));

export const FontFamily = meta.story(tokenTypeStory(tokenTypeStoryConfigs.fontFamily));

export const ControlSize = meta.story(tokenTypeStory(tokenTypeStoryConfigs.controlSize));

export const IconSize = meta.story(tokenTypeStory(tokenTypeStoryConfigs.iconSize));

export const MotionDuration = meta.story(tokenTypeStory(tokenTypeStoryConfigs.motionDuration));

export const MotionEasing = meta.story(tokenTypeStory(tokenTypeStoryConfigs.motionEasing));

export const Breakpoints = meta.story(tokenTypeStory(tokenTypeStoryConfigs.breakpoints));

export const MediaQueries = meta.story(tokenTypeStory(tokenTypeStoryConfigs.mediaQueries));

/**
 * Reference page for design tokens and the generated theme `vars` contract.
 */
export const Reference = meta.story({
	play: async ({ canvas }) => {
		await expectHeadingInStory(canvas, 'Tokens');
		await expectHeadingInStory(canvas, 'CSS Variables');
	},
	render: () => <TokensVarsReference />,
});
