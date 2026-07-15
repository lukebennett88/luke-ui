import { vars } from '@luke-ui/react/theme';
import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

interface ColorSample {
	label: string;
	value: string;
}

interface FontStep {
	baselineTrim: string;
	capHeightTrim: string;
	fontSize: string;
	letterSpacing: string;
	lineHeight: string;
}

interface IntentSample {
	key: string;
	label: string;
	roles: Array<IntentRoleSample>;
	surfaces: Array<ColorSample>;
}

interface IntentRoleSample extends ColorSample {
	background?: string;
	key: string;
	preview: 'border' | 'onSolid' | 'text';
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
	durationKey: string;
	easing: string;
	easingKey: string;
	label: string;
}

interface TokenDatum {
	path: string;
	value: string;
}

interface TokenRow {
	key: string;
	preview: ReactNode;
	values: Array<TokenDatum>;
}

interface TokenSectionProps {
	children: ReactNode;
	title: string;
}

interface TokenTableProps {
	caption: string;
	rows: Array<TokenRow>;
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
		key: 'neutral',
		label: 'Neutral',
		roles: [
			{
				background: vars.color.intent.neutral.surface.solid,
				key: 'onSolid',
				label: 'On solid',
				preview: 'onSolid',
				value: vars.color.intent.neutral.onSolid,
			},
		],
		surfaces: intentSurfaceSamples(vars.color.intent.neutral.surface),
	},
	{
		key: 'accent',
		label: 'Accent',
		roles: [
			{ key: 'border', label: 'Border', preview: 'border', value: vars.color.intent.accent.border },
			{ key: 'text', label: 'Text', preview: 'text', value: vars.color.intent.accent.text },
			{
				key: 'textHover',
				label: 'Text hover',
				preview: 'text',
				value: vars.color.intent.accent.textHover,
			},
			{
				background: vars.color.intent.accent.surface.solid,
				key: 'onSolid',
				label: 'On solid',
				preview: 'onSolid',
				value: vars.color.intent.accent.onSolid,
			},
		],
		surfaces: intentSurfaceSamples(vars.color.intent.accent.surface),
	},
	{
		key: 'info',
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
		key: 'success',
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
		key: 'warning',
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
		key: 'danger',
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

const fontSamples = [
	{ label: '100', step: vars.font[100] },
	{ label: '200', step: vars.font[200] },
	{ label: '300', step: vars.font[300] },
	{ label: '400', step: vars.font[400] },
	{ label: '500', step: vars.font[500] },
	{ label: '600', step: vars.font[600] },
	{ label: '700', step: vars.font[700] },
	{ label: '800', step: vars.font[800] },
	{ label: '900', step: vars.font[900] },
] as const satisfies ReadonlyArray<{ label: string; step: FontStep }>;

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

const sizeSamples = [
	{ group: 'controlSize', label: 'Control small', token: 'small', value: vars.controlSize.small },
	{
		group: 'controlSize',
		label: 'Control medium',
		token: 'medium',
		value: vars.controlSize.medium,
	},
	{ group: 'iconSize', label: 'Icon xsmall', token: 'xsmall', value: vars.iconSize.xsmall },
	{ group: 'iconSize', label: 'Icon small', token: 'small', value: vars.iconSize.small },
	{ group: 'iconSize', label: 'Icon medium', token: 'medium', value: vars.iconSize.medium },
	{ group: 'iconSize', label: 'Icon large', token: 'large', value: vars.iconSize.large },
] as const;

const motionSamples: Array<MotionSample> = [
	{
		accessibleLabel: 'Fast standard motion sample',
		duration: vars.motion.duration.fast,
		durationKey: 'fast',
		easing: vars.motion.easing.standard,
		easingKey: 'standard',
		label: 'Fast / standard',
	},
	{
		accessibleLabel: 'Medium enter motion sample',
		duration: vars.motion.duration.medium,
		durationKey: 'medium',
		easing: vars.motion.easing.enter,
		easingKey: 'enter',
		label: 'Medium / enter',
	},
	{
		accessibleLabel: 'Slow exit motion sample',
		duration: vars.motion.duration.slow,
		durationKey: 'slow',
		easing: vars.motion.easing.exit,
		easingKey: 'exit',
		label: 'Slow / exit',
	},
	{
		accessibleLabel: 'Ambient standard motion sample',
		duration: vars.motion.duration.ambient,
		durationKey: 'ambient',
		easing: vars.motion.easing.standard,
		easingKey: 'standard',
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
	gap: vars.space[1000],
	inlineSize: '100%',
	marginInline: 'auto',
	maxInlineSize: '80rem',
} as const satisfies CSSProperties;

const sectionStyle = {
	display: 'grid',
	gap: vars.space[300],
} as const satisfies CSSProperties;

const tableWrapStyle = {
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.surface,
	borderStyle: 'solid',
	borderWidth: 1,
	inlineSize: '100%',
	overflow: 'auto',
} as const satisfies CSSProperties;

const tableStyle = {
	borderCollapse: 'collapse',
	fontSize: vars.font[200].fontSize,
	inlineSize: '100%',
	minInlineSize: '54rem',
	tableLayout: 'fixed',
} as const satisfies CSSProperties;

const headerCellStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderBlockEndColor: vars.color.border.decorative,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	fontWeight: vars.font.weight.label,
	paddingBlock: vars.space[300],
	paddingInline: vars.space[400],
	textAlign: 'start',
} as const satisfies CSSProperties;

const cellStyle = {
	borderBlockEndColor: vars.color.border.decorative,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	overflowWrap: 'anywhere',
	paddingBlock: vars.space[300],
	paddingInline: vars.space[400],
	verticalAlign: 'middle',
} as const satisfies CSSProperties;

const codeStyle = {
	fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: vars.font[100].fontSize,
	lineHeight: vars.font[100].lineHeight,
} as const satisfies CSSProperties;

const valueListStyle = {
	display: 'grid',
	gap: vars.space[100],
} as const satisfies CSSProperties;

const previewFrameStyle = {
	alignItems: 'center',
	blockSize: '2.5rem',
	display: 'flex',
	inlineSize: '7rem',
	justifyContent: 'center',
} as const satisfies CSSProperties;

const swatchStyle = {
	blockSize: '2rem',
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.detail,
	borderStyle: 'solid',
	borderWidth: 1,
	display: 'inline-block',
	inlineSize: '6rem',
} as const satisfies CSSProperties;

/**
 * Compact visual reference for every public semantic variable. Change the theme and colour mode in
 * the Storybook toolbar to compare both the previews and their resolved CSS values.
 */
export const Reference = meta.story({
	play: async ({ canvas, canvasElement }) => {
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
		await expect(getComputedStyle(primaryText).backgroundColor).not.toBe(
			getComputedStyle(disabledText).backgroundColor,
		);

		const controlBorder = canvas.getByRole('img', { name: 'Control border colour sample' });
		const focusBorder = canvas.getByRole('img', { name: 'Focus border colour sample' });
		await expect(getComputedStyle(controlBorder).borderColor).not.toBe(
			getComputedStyle(focusBorder).borderColor,
		);

		const depthOverlay = canvas.getByRole('img', { name: 'Overlay depth sample' });
		await expect(getComputedStyle(depthOverlay).boxShadow).not.toBe('none');

		const font100 = canvas.getByRole('img', { name: 'Font 100 size sample' });
		const font900 = canvas.getByRole('img', { name: 'Font 900 size sample' });
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
		await expect(getComputedStyle(mediumMotion).animationDuration).toBe('0.2s');

		const resolvedCanvas = canvasElement.querySelector('[data-token-path="color.surface.canvas"]');
		await expect(resolvedCanvas).not.toBeNull();
		await expect(resolvedCanvas?.textContent).not.toContain('var(');
	},
});

function ThemeTokens() {
	return (
		<main style={pageStyle}>
			<style>{`@keyframes luke-token-motion { from { transform: translateX(0); } to { transform: translateX(4.5rem); } } @media (prefers-reduced-motion: reduce) { [data-token-motion] { animation: none !important; } }`}</style>
			<header>
				<h1 style={{ marginBlock: 0 }}>Theme tokens</h1>
				<p style={{ color: vars.color.text.secondary, marginBlockEnd: 0 }}>
					Public semantic variables resolved from the active theme and colour mode.
				</p>
			</header>

			<TokenSection title="Surfaces">
				<TokenTable
					caption="Surface colour tokens"
					rows={surfaceSamples.map((sample) => {
						const path = surfacePath(sample.label);
						return tokenRow(
							path,
							<ColorPreview label={`${sample.label} surface colour sample`} value={sample.value} />,
							sample.value,
						);
					})}
				/>
			</TokenSection>

			<TokenSection title="Text colours">
				<TokenTable
					caption="Text colour tokens"
					rows={textSamples.map((sample) => {
						const path =
							sample.label === 'Disabled'
								? 'color.textDisabled'
								: `color.text.${toKey(sample.label)}`;
						return tokenRow(
							path,
							<TextPreview label={`${sample.label} text colour sample`} value={sample.value} />,
							sample.value,
						);
					})}
				/>
			</TokenSection>

			<TokenSection title="Border colours">
				<TokenTable
					caption="Border colour tokens"
					rows={borderSamples.map((sample) => {
						const path =
							sample.label === 'Disabled'
								? 'color.borderDisabled'
								: `color.border.${toKey(sample.label)}`;
						return tokenRow(
							path,
							<BorderPreview label={`${sample.label} border colour sample`} value={sample.value} />,
							sample.value,
						);
					})}
				/>
			</TokenSection>

			<TokenSection title="Intent colours">
				{intentSamples.map((intent) => (
					<section key={intent.key} style={sectionStyle}>
						<h3 style={{ margin: 0 }}>{intent.label}</h3>
						<TokenTable
							caption={`${intent.label} intent colour tokens`}
							rows={[
								...intent.surfaces.map((sample) => {
									const surfaceKey = toKey(sample.label);
									const path = `color.intent.${intent.key}.surface.${surfaceKey}`;
									return tokenRow(
										path,
										<ColorPreview
											label={`${intent.label} ${sample.label.toLowerCase()} colour sample`}
											value={sample.value}
										/>,
										sample.value,
									);
								}),
								...intent.roles.map((sample) => {
									const path = `color.intent.${intent.key}.${sample.key}`;
									return tokenRow(
										path,
										<IntentRolePreview intentLabel={intent.label} sample={sample} />,
										sample.value,
									);
								}),
							]}
						/>
					</section>
				))}
			</TokenSection>

			<TokenSection title="Depth and material">
				<TokenTable
					caption="Depth and control finish tokens"
					rows={[
						...depthSamples.map((sample) => {
							const path = `depth.${toKey(sample.label)}`;
							return tokenRow(
								path,
								<DepthPreview label={`${sample.label} depth sample`} value={sample.value} />,
								sample.value,
							);
						}),
						...finishSamples.map((sample) => {
							const path = `actionControlFinish.${toKey(sample.label)}`;
							return tokenRow(
								path,
								<FinishPreview
									label={`${sample.label} control finish sample`}
									value={sample.value}
								/>,
								sample.value,
							);
						}),
					]}
				/>
			</TokenSection>

			<TokenSection title="Typography">
				<TokenTable
					caption="Font family and weight tokens"
					rows={[
						tokenRow(
							'font.family',
							<span style={{ fontFamily: vars.font.family }}>Sphinx of black quartz</span>,
							vars.font.family,
						),
						...fontWeightSamples.map((sample) =>
							tokenRow(
								`font.weight.${toKey(sample.label)}`,
								<span style={{ fontWeight: sample.value }}>{`${sample.label} weight`}</span>,
								sample.value,
							),
						),
					]}
				/>
				<TokenTable
					caption="Typography scale tokens"
					rows={fontSamples.map(({ label, step }) => ({
						key: `font.${label}`,
						preview: (
							<span
								aria-label={`Font ${label} size sample`}
								role="img"
								style={{
									display: 'block',
									fontFamily: vars.font.family,
									fontSize: step.fontSize,
									letterSpacing: step.letterSpacing,
									lineHeight: step.lineHeight,
									overflow: 'hidden',
									whiteSpace: 'nowrap',
								}}
							>
								Aa
							</span>
						),
						values: fontStepData(label, step),
					}))}
				/>
			</TokenSection>

			<TokenSection title="Spacing">
				<TokenTable
					caption="Space tokens"
					rows={spaceSamples.map((sample) =>
						tokenRow(
							`space.${sample.label}`,
							<SpacePreview label={sample.label} value={sample.value} />,
							sample.value,
						),
					)}
				/>
			</TokenSection>

			<TokenSection title="Radii">
				<TokenTable
					caption="Radius tokens"
					rows={radiusSamples.map((sample) =>
						tokenRow(
							`radius.${toKey(sample.label)}`,
							<RadiusPreview label={sample.label} value={sample.value} />,
							sample.value,
						),
					)}
				/>
			</TokenSection>

			<TokenSection title="Control and icon sizes">
				<TokenTable
					caption="Control and icon size tokens"
					rows={sizeSamples.map((sample) =>
						tokenRow(
							`${sample.group}.${sample.token}`,
							<SizePreview label={sample.label} value={sample.value} />,
							sample.value,
						),
					)}
				/>
			</TokenSection>

			<TokenSection title="Motion">
				<TokenTable
					caption="Motion tokens"
					rows={motionSamples.map((sample) => ({
						key: sample.label,
						preview: <MotionPreview sample={sample} />,
						values: [
							{ path: `motion.duration.${sample.durationKey}`, value: sample.duration },
							{ path: `motion.easing.${sample.easingKey}`, value: sample.easing },
						],
					}))}
				/>
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

function TokenTable({ caption, rows }: TokenTableProps) {
	return (
		<div style={tableWrapStyle}>
			<table style={tableStyle}>
				<caption style={{ blockSize: 1, overflow: 'hidden', position: 'absolute', inlineSize: 1 }}>
					{caption}
				</caption>
				<colgroup>
					<col style={{ inlineSize: '9rem' }} />
					<col style={{ inlineSize: '17rem' }} />
					<col style={{ inlineSize: '14rem' }} />
					<col style={{ inlineSize: '22rem' }} />
				</colgroup>
				<thead>
					<tr>
						<th scope="col" style={headerCellStyle}>
							Preview
						</th>
						<th scope="col" style={headerCellStyle}>
							Semantic token
						</th>
						<th scope="col" style={headerCellStyle}>
							Resolved value
						</th>
						<th scope="col" style={headerCellStyle}>
							CSS variable
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.key}>
							<td style={cellStyle}>{row.preview}</td>
							<td style={cellStyle}>
								<div style={valueListStyle}>
									{row.values.map((datum) => (
										<code key={datum.path} style={codeStyle}>
											{datum.path}
										</code>
									))}
								</div>
							</td>
							<td style={cellStyle}>
								<div style={valueListStyle}>
									{row.values.map((datum) => (
										<ResolvedValue key={datum.path} path={datum.path} value={datum.value} />
									))}
								</div>
							</td>
							<td style={cellStyle}>
								<div style={valueListStyle}>
									{row.values.map((datum) => (
										<code key={datum.path} style={codeStyle}>
											{customPropertyName(datum.value)}
										</code>
									))}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ResolvedValue({ path, value }: { path: string; value: string }) {
	const ref = useRef<HTMLElement>(null);
	const [resolvedValue, setResolvedValue] = useState('');

	useLayoutEffect(() => {
		if (!ref.current) return;
		const element = ref.current;
		const updateValue = () => {
			const propertyName = customPropertyName(value);
			const nextValue = propertyName.startsWith('--')
				? getComputedStyle(element).getPropertyValue(propertyName).trim()
				: value;
			setResolvedValue((currentValue) => (currentValue === nextValue ? currentValue : nextValue));
		};
		const themeRoot = element.closest('[data-color-mode]');
		const observer = new MutationObserver(updateValue);

		updateValue();
		if (themeRoot) {
			observer.observe(themeRoot, {
				attributeFilter: ['class', 'data-color-mode'],
				attributes: true,
			});
		}

		return () => observer.disconnect();
	}, [value]);

	return (
		<code data-token-path={path} ref={ref} style={codeStyle}>
			{resolvedValue || 'Resolving…'}
		</code>
	);
}

function ColorPreview({ label, value }: { label: string; value: string }) {
	return <span aria-label={label} role="img" style={{ ...swatchStyle, backgroundColor: value }} />;
}

function TextPreview({ label, value }: { label: string; value: string }) {
	return <span aria-label={label} role="img" style={{ ...swatchStyle, backgroundColor: value }} />;
}

function BorderPreview({ label, value }: { label: string; value: string }) {
	return (
		<span
			aria-label={label}
			role="img"
			style={{
				...swatchStyle,
				backgroundColor: vars.color.surface.resting,
				borderColor: value,
				borderWidth: 3,
			}}
		/>
	);
}

function IntentRolePreview({
	intentLabel,
	sample,
}: {
	intentLabel: string;
	sample: IntentRoleSample;
}) {
	if (sample.preview === 'border') {
		return <BorderPreview label={`${intentLabel} intent border sample`} value={sample.value} />;
	}

	return (
		<span
			aria-label={`${intentLabel} intent ${sample.label.toLowerCase()} sample`}
			role="img"
			style={{
				...previewFrameStyle,
				backgroundColor: sample.background,
				borderRadius: vars.radius.detail,
				color: sample.value,
				fontSize: vars.font[500].fontSize,
				fontWeight: vars.font.weight.emphasis,
			}}
		>
			Aa
		</span>
	);
}

function DepthPreview({ label, value }: { label: string; value: string }) {
	return (
		<span
			aria-label={label}
			role="img"
			style={{ ...swatchStyle, backgroundColor: vars.color.surface.resting, boxShadow: value }}
		/>
	);
}

function FinishPreview({ label, value }: { label: string; value: string }) {
	return (
		<span
			aria-label={label}
			role="img"
			style={{
				...swatchStyle,
				backgroundColor: vars.color.intent.neutral.surface.solid,
				backgroundImage: value,
			}}
		/>
	);
}

function SpacePreview({ label, value }: { label: string; value: string }) {
	return (
		<span style={{ ...previewFrameStyle, justifyContent: 'flex-start' }}>
			<span
				aria-label={`Space ${label} sample`}
				role="img"
				style={{
					backgroundColor: vars.color.intent.accent.surface.solid,
					blockSize: vars.space[300],
					display: 'inline-block',
					inlineSize: value,
				}}
			/>
		</span>
	);
}

function RadiusPreview({ label, value }: { label: string; value: string }) {
	return (
		<span
			aria-label={`${label} radius sample`}
			role="img"
			style={{ ...swatchStyle, backgroundColor: vars.color.surface.recessed, borderRadius: value }}
		/>
	);
}

function SizePreview({ label, value }: { label: string; value: string }) {
	return (
		<span style={previewFrameStyle}>
			<span
				aria-label={`${label} size sample`}
				role="img"
				style={{
					backgroundColor: vars.color.intent.accent.surface.solid,
					blockSize: value,
					borderRadius: vars.radius.detail,
					display: 'inline-block',
					inlineSize: value,
				}}
			/>
		</span>
	);
}

function MotionPreview({ sample }: { sample: MotionSample }) {
	return (
		<span
			style={{
				...previewFrameStyle,
				backgroundColor: vars.color.surface.recessed,
				borderRadius: vars.radius.full,
				justifyContent: 'flex-start',
				paddingInline: vars.space[100],
			}}
		>
			<span
				aria-label={sample.accessibleLabel}
				data-token-motion
				role="img"
				style={{
					animationDirection: 'alternate',
					animationDuration: sample.duration,
					animationIterationCount: 'infinite',
					animationName: 'luke-token-motion',
					animationTimingFunction: sample.easing,
					backgroundColor: vars.color.intent.accent.surface.solid,
					blockSize: vars.iconSize.xsmall,
					borderRadius: vars.radius.full,
					display: 'inline-block',
					inlineSize: vars.iconSize.xsmall,
				}}
			/>
		</span>
	);
}

function tokenRow(path: string, previewNode: ReactNode, value: string): TokenRow {
	return { key: path, preview: previewNode, values: [{ path, value }] };
}

function fontStepData(label: string, step: FontStep): Array<TokenDatum> {
	return [
		{ path: `font.${label}.fontSize`, value: step.fontSize },
		{ path: `font.${label}.lineHeight`, value: step.lineHeight },
		{ path: `font.${label}.letterSpacing`, value: step.letterSpacing },
		{ path: `font.${label}.baselineTrim`, value: step.baselineTrim },
		{ path: `font.${label}.capHeightTrim`, value: step.capHeightTrim },
	];
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
		{ key: 'border', label: 'Border', preview: 'border', value: border },
		{ key: 'text', label: 'Text', preview: 'text', value: text },
		{ background: solid, key: 'onSolid', label: 'On solid', preview: 'onSolid', value: onSolid },
	];
}

function customPropertyName(value: string): string {
	const match = /^var\((--[^,)]+)/.exec(value);
	return match?.[1] ?? value;
}

function surfacePath(label: string): string {
	if (label === 'Disabled') return 'color.surfaceDisabled';
	if (label === 'Loading skeleton') return 'color.loadingSkeleton';
	return `color.surface.${toKey(label)}`;
}

function toKey(label: string): string {
	return label
		.toLowerCase()
		.replaceAll(/\s+(.)/g, (_match, letter: string) => letter.toUpperCase());
}
