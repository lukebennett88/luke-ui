import { vars } from '@luke-ui/react/theme';
import type { CSSProperties, ReactNode } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

interface ColorSample {
	label: string;
	value: string;
}

interface IntentSample {
	label: string;
	onSolid: string;
	solid: string;
	subtle: string;
	text: string;
}

interface FontSample {
	fontSize: string;
	label: string;
	letterSpacing: string;
	lineHeight: string;
}

interface FontStep {
	fontSize: string;
	letterSpacing: string;
	lineHeight: string;
}

interface TokenSectionProps {
	children: ReactNode;
	title: string;
}

interface TokenValueProps {
	value: string;
}

interface ValueSample {
	label: string;
	value: string;
}

const surfaceSamples: Array<ColorSample> = [
	{ label: 'Canvas', value: vars.color.surface.canvas },
	{ label: 'Recessed', value: vars.color.surface.recessed },
	{ label: 'Resting', value: vars.color.surface.resting },
	{ label: 'Floating', value: vars.color.surface.floating },
	{ label: 'Overlay', value: vars.color.surface.overlay },
];

const intentSamples: Array<IntentSample> = [
	{
		label: 'Neutral',
		onSolid: vars.color.intent.neutral.onSolid,
		solid: vars.color.intent.neutral.surface.solid,
		subtle: vars.color.intent.neutral.surface.subtle,
		text: vars.color.text.primary,
	},
	{
		label: 'Accent',
		onSolid: vars.color.intent.accent.onSolid,
		solid: vars.color.intent.accent.surface.solid,
		subtle: vars.color.intent.accent.surface.subtle,
		text: vars.color.intent.accent.text,
	},
	{
		label: 'Info',
		onSolid: vars.color.intent.info.onSolid,
		solid: vars.color.intent.info.surface.solid,
		subtle: vars.color.intent.info.surface.subtle,
		text: vars.color.intent.info.text,
	},
	{
		label: 'Success',
		onSolid: vars.color.intent.success.onSolid,
		solid: vars.color.intent.success.surface.solid,
		subtle: vars.color.intent.success.surface.subtle,
		text: vars.color.intent.success.text,
	},
	{
		label: 'Warning',
		onSolid: vars.color.intent.warning.onSolid,
		solid: vars.color.intent.warning.surface.solid,
		subtle: vars.color.intent.warning.surface.subtle,
		text: vars.color.intent.warning.text,
	},
	{
		label: 'Danger',
		onSolid: vars.color.intent.danger.onSolid,
		solid: vars.color.intent.danger.surface.solid,
		subtle: vars.color.intent.danger.surface.subtle,
		text: vars.color.intent.danger.text,
	},
];

const depthSamples: Array<ValueSample> = [
	{ label: 'Recessed', value: vars.depth.recessed },
	{ label: 'Resting', value: vars.depth.resting },
	{ label: 'Raised', value: vars.depth.raised },
	{ label: 'Floating', value: vars.depth.floating },
	{ label: 'Overlay', value: vars.depth.overlay },
];

const finishSamples: Array<ValueSample> = [
	{ label: 'Recessed', value: vars.actionControlFinish.recessed },
	{ label: 'Resting', value: vars.actionControlFinish.resting },
	{ label: 'Raised', value: vars.actionControlFinish.raised },
];

const fontSamples: Array<FontSample> = [
	fontSample('100', vars.font[100]),
	fontSample('200', vars.font[200]),
	fontSample('300', vars.font[300]),
	fontSample('400', vars.font[400]),
	fontSample('500', vars.font[500]),
	fontSample('600', vars.font[600]),
	fontSample('700', vars.font[700]),
	fontSample('800', vars.font[800]),
	fontSample('900', vars.font[900]),
];

const spaceSamples: Array<ValueSample> = [
	{ label: '100', value: vars.space[100] },
	{ label: '200', value: vars.space[200] },
	{ label: '300', value: vars.space[300] },
	{ label: '400', value: vars.space[400] },
	{ label: '600', value: vars.space[600] },
	{ label: '800', value: vars.space[800] },
	{ label: '1000', value: vars.space[1000] },
	{ label: '1200', value: vars.space[1200] },
	{ label: '1600', value: vars.space[1600] },
];

const radiusSamples: Array<ValueSample> = [
	{ label: 'Detail', value: vars.radius.detail },
	{ label: 'Control', value: vars.radius.control },
	{ label: 'Surface', value: vars.radius.surface },
	{ label: 'Overlay', value: vars.radius.overlay },
	{ label: 'Full', value: vars.radius.full },
];

const sizeSamples: Array<ValueSample> = [
	{ label: 'Control small', value: vars.controlSize.small },
	{ label: 'Control medium', value: vars.controlSize.medium },
	{ label: 'Icon xsmall', value: vars.iconSize.xsmall },
	{ label: 'Icon small', value: vars.iconSize.small },
	{ label: 'Icon medium', value: vars.iconSize.medium },
	{ label: 'Icon large', value: vars.iconSize.large },
];

const motionSamples: Array<ValueSample> = [
	{ label: 'Fast / standard', value: vars.motion.duration.fast },
	{ label: 'Medium / enter', value: vars.motion.duration.medium },
	{ label: 'Slow / exit', value: vars.motion.duration.slow },
	{ label: 'Ambient / standard', value: vars.motion.duration.ambient },
];

const meta = preview.meta({
	component: ThemeTokens,
	tags: ['theme'],
	title: 'Theme/Tokens',
});

const pageStyle = {
	display: 'grid',
	gap: vars.space[1200],
} as const satisfies CSSProperties;

const sectionStyle = {
	display: 'grid',
	gap: vars.space[400],
} as const satisfies CSSProperties;

const gridStyle = {
	display: 'grid',
	gap: vars.space[400],
	gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))',
} as const satisfies CSSProperties;

const labelStyle = {
	fontFamily: vars.font.family,
	fontSize: vars.font[200].fontSize,
	fontWeight: vars.font.weight.label,
	lineHeight: vars.font[200].lineHeight,
	margin: 0,
} as const satisfies CSSProperties;

const valueStyle = {
	color: vars.color.text.secondary,
	fontFamily: 'ui-monospace, monospace',
	fontSize: vars.font[100].fontSize,
	overflowWrap: 'anywhere',
} as const satisfies CSSProperties;

const sampleCardStyle = {
	backgroundColor: vars.color.surface.resting,
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.surface,
	borderStyle: 'solid',
	borderWidth: 1,
	display: 'grid',
	gap: vars.space[300],
	minBlockSize: '5rem',
	padding: vars.space[400],
} as const satisfies CSSProperties;

/**
 * Visual reference for the active theme's public semantic variables. Change the theme and colour
 * mode in the Storybook toolbar to compare the complete styling contract.
 */
export const Reference = meta.story({
	play: async ({ canvas }) => {
		const accentSubtle = canvas.getByTestId('intent-accent-subtle');
		const accentSolid = canvas.getByTestId('intent-accent-solid');
		await expect(getComputedStyle(accentSubtle).backgroundColor).not.toBe(
			getComputedStyle(accentSolid).backgroundColor,
		);

		const depthOverlay = canvas.getByTestId('depth-overlay');
		await expect(getComputedStyle(depthOverlay).boxShadow).not.toBe('none');

		const font100 = canvas.getByTestId('font-100');
		const font900 = canvas.getByTestId('font-900');
		await expect(Number.parseFloat(getComputedStyle(font900).fontSize)).toBeGreaterThan(
			Number.parseFloat(getComputedStyle(font100).fontSize),
		);

		const space100 = canvas.getByTestId('space-100');
		const space1600 = canvas.getByTestId('space-1600');
		await expect(space1600.getBoundingClientRect().width).toBeGreaterThan(
			space100.getBoundingClientRect().width,
		);

		const mediumControl = canvas.getByTestId('size-control-medium');
		await expect(getComputedStyle(mediumControl).blockSize).toBe('40px');

		const mediumMotion = canvas.getByTestId('motion-medium-enter');
		await expect(getComputedStyle(mediumMotion).transitionDuration).toBe('0.2s');
	},
	render: () => <ThemeTokens />,
});

function ThemeTokens() {
	return (
		<main style={pageStyle}>
			<header>
				<h1 style={{ marginBlock: 0 }}>Theme tokens</h1>
				<p style={{ color: vars.color.text.secondary }}>
					Semantic CSS variables resolved from the active theme and colour mode.
				</p>
			</header>

			<TokenSection title="Surfaces">
				<div style={gridStyle}>
					{surfaceSamples.map((sample) => (
						<div key={sample.label} style={{ ...sampleCardStyle, backgroundColor: sample.value }}>
							<span style={labelStyle}>{sample.label}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Intent colours">
				<div style={gridStyle}>
					{intentSamples.map((sample) => {
						const id = sample.label.toLowerCase();
						return (
							<div key={sample.label} style={{ ...sampleCardStyle, padding: 0 }}>
								<div
									data-testid={`intent-${id}-subtle`}
									style={{
										backgroundColor: sample.subtle,
										borderRadius: `${vars.radius.surface} ${vars.radius.surface} 0 0`,
										color: sample.text,
										padding: vars.space[400],
									}}
								>
									{sample.label} subtle
								</div>
								<div
									data-testid={`intent-${id}-solid`}
									style={{
										backgroundColor: sample.solid,
										borderRadius: `0 0 ${vars.radius.surface} ${vars.radius.surface}`,
										color: sample.onSolid,
										padding: vars.space[400],
									}}
								>
									{sample.label} solid
								</div>
							</div>
						);
					})}
				</div>
			</TokenSection>

			<TokenSection title="Depth and material">
				<div style={gridStyle}>
					{depthSamples.map((sample) => (
						<div
							data-testid={`depth-${sample.label.toLowerCase()}`}
							key={sample.label}
							style={{ ...sampleCardStyle, boxShadow: sample.value }}
						>
							<span style={labelStyle}>{sample.label}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
					{finishSamples.map((sample) => (
						<div
							key={`finish-${sample.label}`}
							style={{ ...sampleCardStyle, backgroundImage: sample.value }}
						>
							<span style={labelStyle}>{`Control finish ${sample.label.toLowerCase()}`}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Typography">
				<div style={sectionStyle}>
					{fontSamples.map((sample) => (
						<div
							data-testid={`font-${sample.label}`}
							key={sample.label}
							style={{
								fontFamily: vars.font.family,
								fontSize: sample.fontSize,
								letterSpacing: sample.letterSpacing,
								lineHeight: sample.lineHeight,
							}}
						>
							{sample.label} — Sphinx of black quartz, judge my vow.
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Spacing">
				<div style={sectionStyle}>
					{spaceSamples.map((sample) => (
						<div
							key={sample.label}
							style={{ alignItems: 'center', display: 'flex', gap: vars.space[400] }}
						>
							<code style={{ inlineSize: '3rem' }}>{sample.label}</code>
							<span
								data-testid={`space-${sample.label}`}
								style={{
									backgroundColor: vars.color.intent.accent.surface.solid,
									blockSize: vars.space[300],
									inlineSize: sample.value,
								}}
							/>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Radii">
				<div style={gridStyle}>
					{radiusSamples.map((sample) => (
						<div key={sample.label} style={{ ...sampleCardStyle, borderRadius: sample.value }}>
							<span style={labelStyle}>{sample.label}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Control and icon sizes">
				<div style={gridStyle}>
					{sizeSamples.map((sample) => {
						const id = sample.label.toLowerCase().replace(' ', '-');
						return (
							<div key={sample.label} style={sampleCardStyle}>
								<span style={labelStyle}>{sample.label}</span>
								<span
									data-testid={`size-${id}`}
									style={{
										backgroundColor: vars.color.intent.accent.surface.solid,
										blockSize: sample.value,
										borderRadius: vars.radius.detail,
										inlineSize: sample.value,
									}}
								/>
								<TokenValue value={sample.value} />
							</div>
						);
					})}
				</div>
			</TokenSection>

			<TokenSection title="Motion">
				<div style={gridStyle}>
					{motionSamples.map((sample) => {
						const easing = sample.label.includes('enter')
							? vars.motion.easing.enter
							: sample.label.includes('exit')
								? vars.motion.easing.exit
								: vars.motion.easing.standard;
						const id = sample.label.toLowerCase().replaceAll(' / ', '-');
						return (
							<div key={sample.label} style={sampleCardStyle}>
								<span style={labelStyle}>{sample.label}</span>
								<div
									data-testid={`motion-${id}`}
									style={{
										backgroundColor: vars.color.surface.recessed,
										borderRadius: vars.radius.full,
										padding: vars.space[100],
										transitionDuration: sample.value,
										transitionProperty: 'transform',
										transitionTimingFunction: easing,
									}}
								>
									<div
										style={{
											backgroundColor: vars.color.intent.accent.surface.solid,
											blockSize: vars.iconSize.xsmall,
											borderRadius: vars.radius.full,
											inlineSize: vars.iconSize.xsmall,
										}}
									/>
								</div>
								<TokenValue value={`${sample.value} ${easing}`} />
							</div>
						);
					})}
				</div>
			</TokenSection>
		</main>
	);
}

function TokenSection({ children, title }: TokenSectionProps) {
	return (
		<section style={sectionStyle}>
			<h2 style={{ margin: 0 }}>{title}</h2>
			{children}
		</section>
	);
}

function TokenValue({ value }: TokenValueProps) {
	return <code style={valueStyle}>{value}</code>;
}

function fontSample(label: string, step: FontStep): FontSample {
	return {
		fontSize: step.fontSize,
		label,
		letterSpacing: step.letterSpacing,
		lineHeight: step.lineHeight,
	};
}
