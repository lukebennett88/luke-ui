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
	roles: Array<IntentRoleSample>;
	surfaces: Array<ColorSample>;
}

interface IntentRoleSample extends ColorSample {
	background?: string;
	preview: 'border' | 'onSolid' | 'text';
}

interface IntentRoleProps {
	intentLabel: string;
	sample: IntentRoleSample;
}

interface IntentSurfaceVars {
	solid: string;
	solidHover: string;
	solidPressed: string;
	subtle: string;
	subtleHover: string;
	subtlePressed: string;
}

interface MotionSample {
	accessibleLabel: string;
	duration: string;
	easing: string;
	label: string;
}

interface FontSample {
	baselineTrim: string;
	capHeightTrim: string;
	fontSize: string;
	label: string;
	letterSpacing: string;
	lineHeight: string;
}

interface FontStep {
	baselineTrim: string;
	capHeightTrim: string;
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
	{ label: 'Disabled', value: vars.color.surfaceDisabled },
	{ label: 'Loading skeleton', value: vars.color.loadingSkeleton },
];

const textSamples: Array<ColorSample> = [
	{ label: 'Primary', value: vars.color.text.primary },
	{ label: 'Secondary', value: vars.color.text.secondary },
	{ label: 'Disabled', value: vars.color.textDisabled },
];

const borderSamples: Array<ColorSample> = [
	{ label: 'Decorative', value: vars.color.border.decorative },
	{ label: 'Control', value: vars.color.border.control },
	{ label: 'Focus', value: vars.color.border.focus },
	{ label: 'Disabled', value: vars.color.borderDisabled },
];

const intentSamples: Array<IntentSample> = [
	{
		label: 'Neutral',
		roles: [
			{
				background: vars.color.intent.neutral.surface.solid,
				label: 'On solid',
				preview: 'onSolid',
				value: vars.color.intent.neutral.onSolid,
			},
		],
		surfaces: intentSurfaceSamples(vars.color.intent.neutral.surface),
	},
	{
		label: 'Accent',
		roles: [
			{ label: 'Border', preview: 'border', value: vars.color.intent.accent.border },
			{ label: 'Text', preview: 'text', value: vars.color.intent.accent.text },
			{ label: 'Text hover', preview: 'text', value: vars.color.intent.accent.textHover },
			{
				background: vars.color.intent.accent.surface.solid,
				label: 'On solid',
				preview: 'onSolid',
				value: vars.color.intent.accent.onSolid,
			},
		],
		surfaces: intentSurfaceSamples(vars.color.intent.accent.surface),
	},
	{
		label: 'Info',
		roles: intentRoles(
			vars.color.intent.info.border,
			vars.color.intent.info.text,
			vars.color.intent.info.onSolid,
			vars.color.intent.info.surface.solid,
		),
		surfaces: intentSurfaceSamples(vars.color.intent.info.surface),
	},
	{
		label: 'Success',
		roles: intentRoles(
			vars.color.intent.success.border,
			vars.color.intent.success.text,
			vars.color.intent.success.onSolid,
			vars.color.intent.success.surface.solid,
		),
		surfaces: intentSurfaceSamples(vars.color.intent.success.surface),
	},
	{
		label: 'Warning',
		roles: intentRoles(
			vars.color.intent.warning.border,
			vars.color.intent.warning.text,
			vars.color.intent.warning.onSolid,
			vars.color.intent.warning.surface.solid,
		),
		surfaces: intentSurfaceSamples(vars.color.intent.warning.surface),
	},
	{
		label: 'Danger',
		roles: intentRoles(
			vars.color.intent.danger.border,
			vars.color.intent.danger.text,
			vars.color.intent.danger.onSolid,
			vars.color.intent.danger.surface.solid,
		),
		surfaces: intentSurfaceSamples(vars.color.intent.danger.surface),
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

const fontWeightSamples: Array<ValueSample> = [
	{ label: 'Body', value: vars.font.weight.body },
	{ label: 'Label', value: vars.font.weight.label },
	{ label: 'Heading', value: vars.font.weight.heading },
	{ label: 'Emphasis', value: vars.font.weight.emphasis },
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

const motionSamples: Array<MotionSample> = [
	{
		accessibleLabel: 'Fast standard motion sample',
		duration: vars.motion.duration.fast,
		easing: vars.motion.easing.standard,
		label: 'Fast / standard',
	},
	{
		accessibleLabel: 'Medium enter motion sample',
		duration: vars.motion.duration.medium,
		easing: vars.motion.easing.enter,
		label: 'Medium / enter',
	},
	{
		accessibleLabel: 'Slow exit motion sample',
		duration: vars.motion.duration.slow,
		easing: vars.motion.easing.exit,
		label: 'Slow / exit',
	},
	{
		accessibleLabel: 'Ambient standard motion sample',
		duration: vars.motion.duration.ambient,
		easing: vars.motion.easing.standard,
		label: 'Ambient / standard',
	},
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
 * mode in the Storybook toolbar to compare representative semantic values.
 */
export const Reference = meta.story({
	play: async ({ canvas }) => {
		const accentSubtle = canvas.getByRole('img', { name: 'Accent subtle colour sample' });
		const accentSubtleHover = canvas.getByRole('img', {
			name: 'Accent subtle hover colour sample',
		});
		const accentSubtlePressed = canvas.getByRole('img', {
			name: 'Accent subtle pressed colour sample',
		});
		await expect(getComputedStyle(accentSubtle).backgroundColor).not.toBe(
			getComputedStyle(accentSubtleHover).backgroundColor,
		);
		await expect(getComputedStyle(accentSubtleHover).backgroundColor).not.toBe(
			getComputedStyle(accentSubtlePressed).backgroundColor,
		);

		const primaryText = canvas.getByRole('img', { name: 'Primary text colour sample' });
		const disabledText = canvas.getByRole('img', { name: 'Disabled text colour sample' });
		await expect(getComputedStyle(primaryText).color).not.toBe(
			getComputedStyle(disabledText).color,
		);

		const controlBorder = canvas.getByRole('img', { name: 'Control border colour sample' });
		const focusBorder = canvas.getByRole('img', { name: 'Focus border colour sample' });
		await expect(getComputedStyle(controlBorder).borderColor).not.toBe(
			getComputedStyle(focusBorder).borderColor,
		);

		const depthOverlay = canvas.getByRole('img', { name: 'Overlay depth sample' });
		await expect(getComputedStyle(depthOverlay).boxShadow).not.toBe('none');

		const font100 = canvas.getByText('100 — Sphinx of black quartz, judge my vow.');
		const font900 = canvas.getByText('900 — Sphinx of black quartz, judge my vow.');
		await expect(Number.parseFloat(getComputedStyle(font900).fontSize)).toBeGreaterThan(
			Number.parseFloat(getComputedStyle(font100).fontSize),
		);
		const bodyWeight = canvas.getByText('Body weight');
		const emphasisWeight = canvas.getByText('Emphasis weight');
		await expect(Number(getComputedStyle(emphasisWeight).fontWeight)).toBeGreaterThan(
			Number(getComputedStyle(bodyWeight).fontWeight),
		);
		const space100 = canvas.getByRole('img', { name: 'Space 100 sample' });
		const space1600 = canvas.getByRole('img', { name: 'Space 1600 sample' });
		await expect(space1600.getBoundingClientRect().width).toBeGreaterThan(
			space100.getBoundingClientRect().width,
		);

		const mediumControl = canvas.getByRole('img', { name: 'Control medium size sample' });
		await expect(getComputedStyle(mediumControl).blockSize).toBe('40px');

		const mediumMotion = canvas.getByRole('img', { name: 'Medium enter motion sample' });
		await expect(getComputedStyle(mediumMotion).transitionDuration).toBe('0.2s');
	},
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

			<TokenSection title="Text colours">
				<div style={gridStyle}>
					{textSamples.map((sample) => (
						<div key={sample.label} style={sampleCardStyle}>
							<span
								aria-label={`${sample.label} text colour sample`}
								role="img"
								style={{ color: sample.value, fontWeight: vars.font.weight.emphasis }}
							>
								{sample.label} text
							</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Border colours">
				<div style={gridStyle}>
					{borderSamples.map((sample) => (
						<div key={sample.label} style={sampleCardStyle}>
							<span
								aria-label={`${sample.label} border colour sample`}
								role="img"
								style={{
									blockSize: vars.controlSize.medium,
									borderColor: sample.value,
									borderRadius: vars.radius.control,
									borderStyle: 'solid',
									borderWidth: 3,
								}}
							/>
							<span style={labelStyle}>{sample.label}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
			</TokenSection>

			<TokenSection title="Intent colours">
				<div style={sectionStyle}>
					{intentSamples.map((sample) => {
						return (
							<article key={sample.label} style={sectionStyle}>
								<h3 style={{ margin: 0 }}>{sample.label}</h3>
								<div style={gridStyle}>
									{sample.surfaces.map((surface) => (
										<div
											aria-label={`${sample.label} ${surface.label.toLowerCase()} colour sample`}
											key={surface.label}
											role="img"
											style={{ ...sampleCardStyle, backgroundColor: surface.value }}
										>
											<span
												style={labelStyle}
											>{`${sample.label} ${surface.label.toLowerCase()}`}</span>
											<TokenValue value={surface.value} />
										</div>
									))}
								</div>
								<div style={gridStyle}>
									{sample.roles.map((role) => (
										<IntentRole intentLabel={sample.label} key={role.label} sample={role} />
									))}
								</div>
							</article>
						);
					})}
				</div>
			</TokenSection>

			<TokenSection title="Depth and material">
				<div style={gridStyle}>
					{depthSamples.map((sample) => (
						<div
							aria-label={`${sample.label} depth sample`}
							key={sample.label}
							role="img"
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
				<div style={gridStyle}>
					<div style={sampleCardStyle}>
						<span
							aria-label="Font family sample"
							role="img"
							style={{ fontFamily: vars.font.family, fontSize: vars.font[500].fontSize }}
						>
							Sphinx of black quartz
						</span>
						<TokenValue value={vars.font.family} />
					</div>
					{fontWeightSamples.map((sample) => (
						<div key={sample.label} style={sampleCardStyle}>
							<span style={{ fontWeight: sample.value }}>{`${sample.label} weight`}</span>
							<TokenValue value={sample.value} />
						</div>
					))}
				</div>
				<div style={sectionStyle}>
					{fontSamples.map((sample) => (
						<div key={sample.label} style={sampleCardStyle}>
							<div
								style={{
									fontFamily: vars.font.family,
									fontSize: sample.fontSize,
									letterSpacing: sample.letterSpacing,
									lineHeight: sample.lineHeight,
								}}
							>
								{sample.label} — Sphinx of black quartz, judge my vow.
							</div>
							<TokenValue
								value={`fontSize ${sample.fontSize}; lineHeight ${sample.lineHeight}; letterSpacing ${sample.letterSpacing}`}
							/>
							<TokenValue
								value={`baselineTrim ${sample.baselineTrim}; capHeightTrim ${sample.capHeightTrim}`}
							/>
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
								aria-label={`Space ${sample.label} sample`}
								role="img"
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
						return (
							<div key={sample.label} style={sampleCardStyle}>
								<span style={labelStyle}>{sample.label}</span>
								<span
									aria-label={`${sample.label} size sample`}
									role="img"
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
					{motionSamples.map((sample) => (
						<div key={sample.label} style={sampleCardStyle}>
							<span style={labelStyle}>{sample.label}</span>
							<div
								aria-label={sample.accessibleLabel}
								role="img"
								style={{
									backgroundColor: vars.color.surface.recessed,
									borderRadius: vars.radius.full,
									padding: vars.space[100],
									transitionDuration: sample.duration,
									transitionProperty: 'transform',
									transitionTimingFunction: sample.easing,
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
							<TokenValue value={`${sample.duration} ${sample.easing}`} />
						</div>
					))}
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
		baselineTrim: step.baselineTrim,
		capHeightTrim: step.capHeightTrim,
		fontSize: step.fontSize,
		label,
		letterSpacing: step.letterSpacing,
		lineHeight: step.lineHeight,
	};
}

function intentSurfaceSamples(surface: IntentSurfaceVars): Array<ColorSample> {
	return [
		{ label: 'Subtle', value: surface.subtle },
		{ label: 'Subtle hover', value: surface.subtleHover },
		{ label: 'Subtle pressed', value: surface.subtlePressed },
		{ label: 'Solid', value: surface.solid },
		{ label: 'Solid hover', value: surface.solidHover },
		{ label: 'Solid pressed', value: surface.solidPressed },
	];
}

function intentRoles(
	border: string,
	text: string,
	onSolid: string,
	solid: string,
): Array<IntentRoleSample> {
	return [
		{ label: 'Border', preview: 'border', value: border },
		{ label: 'Text', preview: 'text', value: text },
		{ background: solid, label: 'On solid', preview: 'onSolid', value: onSolid },
	];
}

function IntentRole({ intentLabel, sample }: IntentRoleProps) {
	if (sample.preview === 'border') {
		return (
			<div style={sampleCardStyle}>
				<span
					aria-label={`${intentLabel} intent border sample`}
					role="img"
					style={{
						blockSize: vars.controlSize.medium,
						borderColor: sample.value,
						borderRadius: vars.radius.control,
						borderStyle: 'solid',
						borderWidth: 3,
					}}
				/>
				<span style={labelStyle}>{`${intentLabel} ${sample.label.toLowerCase()}`}</span>
				<TokenValue value={sample.value} />
			</div>
		);
	}

	return (
		<div style={{ ...sampleCardStyle, backgroundColor: sample.background }}>
			<span
				aria-label={`${intentLabel} intent ${sample.label.toLowerCase()} sample`}
				role="img"
				style={{ color: sample.value, fontWeight: vars.font.weight.emphasis }}
			>
				{`${intentLabel} ${sample.label.toLowerCase()}`}
			</span>
			<TokenValue value={sample.value} />
		</div>
	);
}
