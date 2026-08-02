import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { compileTheme } from './build-theme.js';
import type { Oklch } from './color.js';
import { formatOklch } from './color.js';
import { vars } from './contract.css.js';
import { normalizeTheme } from './define-theme.js';
import type { ThemeInput } from './define-theme.js';
import type {
	ContrastCheck,
	FamilyDiagnostics,
	ThemeDiagnostics,
	ThemeModeDiagnostics,
} from './diagnostics.js';
import type { GeneratedSurfaces } from './elevation.js';
import { paperTheme, tactileTheme } from './foundations.js';
import type { FamilyRequirements, FamilyRole, ScaleFamily, ScaleStep } from './scale.js';

type BundledThemeKey = 'tactile' | 'paper';

const BUNDLED_THEMES = {
	paper: paperTheme,
	tactile: tactileTheme,
} as const satisfies Record<BundledThemeKey, ThemeInput>;

const FAMILY_ROLES: ReadonlyArray<FamilyRole> = [
	'neutral',
	'accent',
	'danger',
	'info',
	'success',
	'warning',
];
const SCALE_STEPS: ReadonlyArray<ScaleStep> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Computed once at module scope: `compileTheme` is pure and Node-compatible, so both bundled themes'
// full diagnostics (both colour modes) are available up front rather than recomputed per render.
const diagnosticsByTheme: Record<BundledThemeKey, ThemeDiagnostics> = {
	paper: compileTheme(normalizeTheme(paperTheme)).diagnostics,
	tactile: compileTheme(normalizeTheme(tactileTheme)).diagnostics,
};

const pageStyle = {
	display: 'grid',
	gap: vars.space[1000],
	inlineSize: '100%',
	marginInline: 'auto',
	maxInlineSize: '80rem',
} as const satisfies CSSProperties;

const themeSwitchStyle = {
	display: 'flex',
	gap: vars.space[400],
} as const satisfies CSSProperties;

const themeOptionStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[100],
	textTransform: 'capitalize',
} as const satisfies CSSProperties;

const modeSectionStyle = {
	display: 'grid',
	gap: vars.space[600],
} as const satisfies CSSProperties;

const modeHeadingStyle = {
	borderBlockEndColor: vars.color.border.decorative,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	margin: 0,
	paddingBlockEnd: vars.space[200],
} as const satisfies CSSProperties;

const sectionCardStyle = {
	display: 'grid',
	gap: vars.space[300],
} as const satisfies CSSProperties;

const sectionHeadingStyle = {
	margin: 0,
} as const satisfies CSSProperties;

const familyRowStyle = {
	display: 'grid',
	gap: vars.space[100],
} as const satisfies CSSProperties;

const familyHeaderStyle = {
	alignItems: 'baseline',
	display: 'flex',
	gap: vars.space[300],
	textTransform: 'capitalize',
} as const satisfies CSSProperties;

const requirementsTextStyle = {
	color: vars.color.text.secondary,
	fontSize: vars.font[100].fontSize,
	textTransform: 'none',
} as const satisfies CSSProperties;

const rampRowStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[100],
} as const satisfies CSSProperties;

const stepCardStyle = {
	display: 'grid',
	gap: vars.space[100],
	inlineSize: '4.5rem',
	justifyItems: 'start',
} as const satisfies CSSProperties;

const stepBoxStyle = {
	blockSize: '2rem',
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.detail,
	borderStyle: 'solid',
	borderWidth: 1,
	inlineSize: '100%',
} as const satisfies CSSProperties;

const stepLabelStyle = {
	fontSize: vars.font[100].fontSize,
} as const satisfies CSSProperties;

const swatchRowStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[300],
} as const satisfies CSSProperties;

const tableWrapStyle = {
	inlineSize: '100%',
	overflow: 'auto',
} as const satisfies CSSProperties;

const tableStyle = {
	borderCollapse: 'collapse',
	fontSize: vars.font[100].fontSize,
	inlineSize: '100%',
} as const satisfies CSSProperties;

const headerCellStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderBlockEndColor: vars.color.border.decorative,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	paddingBlock: vars.space[100],
	paddingInline: vars.space[300],
	textAlign: 'start',
} as const satisfies CSSProperties;

const cellStyle = {
	borderBlockEndColor: vars.color.border.decorative,
	borderBlockEndStyle: 'solid',
	borderBlockEndWidth: 1,
	paddingBlock: vars.space[100],
	paddingInline: vars.space[300],
	verticalAlign: 'middle',
} as const satisfies CSSProperties;

const codeStyle = {
	fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: vars.font[100].fontSize,
} as const satisfies CSSProperties;

const captionStyle = {
	color: vars.color.text.secondary,
	fontSize: vars.font[100].fontSize,
	margin: 0,
} as const satisfies CSSProperties;

const groupStackStyle = {
	display: 'grid',
	gap: vars.space[100],
} as const satisfies CSSProperties;

export function ThemeDiagnosticsInspector() {
	const [themeKey, setThemeKey] = useState<BundledThemeKey>('tactile');
	const diagnostics = diagnosticsByTheme[themeKey];

	return (
		<main style={pageStyle}>
			<header>
				<h1 style={{ marginBlock: 0 }}>Theme diagnostics</h1>
				<p style={{ color: vars.color.text.secondary, marginBlockEnd: 0 }}>
					The private scale families, generated surfaces, solid-anchor search, and WCAG 2.2
					validation matrix `compileTheme` resolved for a bundled theme. It is read-only and not
					public API.
				</p>
			</header>

			<div aria-label="Bundled theme" role="radiogroup" style={themeSwitchStyle}>
				{(Object.keys(BUNDLED_THEMES) as Array<BundledThemeKey>).map((key) => (
					<label key={key} style={themeOptionStyle}>
						<input
							checked={themeKey === key}
							name="bundled-theme"
							onChange={() => setThemeKey(key)}
							type="radio"
							value={key}
						/>
						{key}
					</label>
				))}
			</div>

			<ModeSection diagnostics={diagnostics.light} />
			<ModeSection diagnostics={diagnostics.dark} />
		</main>
	);
}

function ModeSection({ diagnostics }: { diagnostics: ThemeModeDiagnostics }) {
	return (
		<section style={modeSectionStyle}>
			<h2 style={modeHeadingStyle}>{diagnostics.mode === 'light' ? 'Light mode' : 'Dark mode'}</h2>
			<FamiliesSection families={diagnostics.families} />
			<SurfacesSection surfaces={diagnostics.surfaces} />
			<SolidAnchorSection families={diagnostics.families} />
			<ContrastChecksSection checks={diagnostics.contrastChecks} />
			<GamutReductionsSection families={diagnostics.families} />
		</section>
	);
}

function SectionCard({ children, title }: { children: ReactNode; title: string }) {
	return (
		<section style={sectionCardStyle}>
			<h3 style={sectionHeadingStyle}>{title}</h3>
			{children}
		</section>
	);
}

function FamiliesSection({ families }: { families: Record<FamilyRole, FamilyDiagnostics> }) {
	return (
		<SectionCard title="Private 12-step families">
			{FAMILY_ROLES.map((role) => {
				const roleDiagnostics = families[role];
				return (
					<div key={role} style={familyRowStyle}>
						<div style={familyHeaderStyle}>
							<strong>{role}</strong>
							<RequirementBadges requirements={roleDiagnostics.requirements} />
						</div>
						<FamilyRamp family={roleDiagnostics.family} />
					</div>
				);
			})}
		</SectionCard>
	);
}

function RequirementBadges({ requirements }: { requirements: FamilyRequirements }) {
	const capabilities: Array<[label: string, needed: boolean]> = [
		['subtle states', requirements.needsSubtleStates],
		['solid states', requirements.needsSolidStates],
		['on-solid', requirements.needsOnSolid],
		['text', requirements.needsText],
		['border', requirements.needsBorder],
	];
	const needed = capabilities.filter(([, isNeeded]) => isNeeded).map(([label]) => label);
	return <span style={requirementsTextStyle}>{needed.join(' · ')}</span>;
}

function FamilyRamp({ family }: { family: ScaleFamily }) {
	return (
		<div style={rampRowStyle}>
			{SCALE_STEPS.map((step) => (
				<StepSwatch key={step} label={String(step)} oklch={family[step]} />
			))}
			<StepSwatch label="On-solid" oklch={family.contrast} />
		</div>
	);
}

function StepSwatch({ label, oklch }: { label: string; oklch: Oklch }) {
	return (
		<div style={stepCardStyle}>
			<span
				aria-label={`${label} colour sample`}
				role="img"
				style={{ ...stepBoxStyle, backgroundColor: formatOklch(oklch) }}
			/>
			<code style={stepLabelStyle}>{label}</code>
		</div>
	);
}

function SurfacesSection({ surfaces }: { surfaces: GeneratedSurfaces }) {
	return (
		<SectionCard title="Generated surfaces">
			<div style={swatchRowStyle}>
				<StepSwatch label="Canvas" oklch={surfaces.canvas} />
				<StepSwatch label="Recessed" oklch={surfaces.recessed} />
				<StepSwatch label="Floating" oklch={surfaces.floating} />
				<StepSwatch label="Overlay" oklch={surfaces.overlay} />
			</div>
		</SectionCard>
	);
}

function SolidAnchorSection({ families }: { families: Record<FamilyRole, FamilyDiagnostics> }) {
	return (
		<SectionCard title="Solid anchor (step 9) search">
			<div style={tableWrapStyle}>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={headerCellStyle}>Role</th>
							<th style={headerCellStyle}>Target L</th>
							<th style={headerCellStyle}>Resolved L</th>
							<th style={headerCellStyle}>Band</th>
							<th style={headerCellStyle}>Adapted</th>
							<th style={headerCellStyle}>On-solid vs solid</th>
							<th style={headerCellStyle}>On-solid vs hover</th>
							<th style={headerCellStyle}>Satisfied</th>
						</tr>
					</thead>
					<tbody>
						{FAMILY_ROLES.map((role) => {
							const { solidAnchor } = families[role];
							return (
								<tr key={role}>
									<td style={{ ...cellStyle, textTransform: 'capitalize' }}>{role}</td>
									<td style={cellStyle}>{solidAnchor.targetLightness.toFixed(3)}</td>
									<td style={cellStyle}>{solidAnchor.resolvedLightness.toFixed(3)}</td>
									<td style={cellStyle}>
										{`[${solidAnchor.band[0].toFixed(2)}, ${solidAnchor.band[1].toFixed(2)}]`}
									</td>
									<td style={cellStyle}>{solidAnchor.adaptedForOnSolid ? 'yes' : 'no'}</td>
									<td style={cellStyle}>{`${solidAnchor.onSolidRatioSolid.toFixed(2)}:1`}</td>
									<td style={cellStyle}>{`${solidAnchor.onSolidRatioSolidHover.toFixed(2)}:1`}</td>
									<td style={cellStyle}>{solidAnchor.satisfied ? 'yes' : 'no'}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);
}

function ContrastChecksSection({ checks }: { checks: Array<ContrastCheck> }) {
	// Each check carries the compiler's own hard-gate classification, so this split cannot drift from
	// `validateContrast` the way inferring it from token paths could.
	const hard = checks.filter((check) => check.hard);
	const advisory = checks.filter((check) => !check.hard);
	return (
		<SectionCard title="Contrast checks">
			<ContrastCheckTable
				caption="Hard-gate checks: compileTheme throws ThemeContrastError if any of these misses its ratio"
				checks={hard}
			/>
			<ContrastCheckTable
				caption="Advisory checks are measured only. Borders other than border.control/border.focus are subtle and do not gate the build"
				checks={advisory}
			/>
		</SectionCard>
	);
}

function ContrastCheckTable({
	caption,
	checks,
}: {
	caption: string;
	checks: Array<ContrastCheck>;
}) {
	return (
		<div style={groupStackStyle}>
			<p style={captionStyle}>
				{caption} ({checks.length})
			</p>
			<div style={tableWrapStyle}>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={headerCellStyle}>Foreground</th>
							<th style={headerCellStyle}>Background</th>
							<th style={headerCellStyle}>Ratio</th>
							<th style={headerCellStyle}>Required</th>
							<th style={headerCellStyle}>Passes</th>
						</tr>
					</thead>
					<tbody>
						{checks.map((check) => (
							<tr key={`${check.foreground}__${check.background}`}>
								<td style={cellStyle}>
									<code style={codeStyle}>{check.foreground}</code>
								</td>
								<td style={cellStyle}>
									<code style={codeStyle}>{check.background}</code>
								</td>
								<td style={cellStyle}>{check.ratio.toFixed(2)}:1</td>
								<td style={cellStyle}>{check.required}:1</td>
								<td style={cellStyle}>{check.passes ? 'pass' : 'FAIL'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function GamutReductionsSection({ families }: { families: Record<FamilyRole, FamilyDiagnostics> }) {
	const rows = FAMILY_ROLES.flatMap((role) =>
		families[role].gamutReductions.map((reduction, index) => ({ index, role, ...reduction })),
	);
	return (
		<SectionCard title="Gamut reductions">
			{rows.length === 0 ? (
				<p style={captionStyle}>No sRGB gamut reductions for this theme and mode.</p>
			) : (
				<div style={tableWrapStyle}>
					<table style={tableStyle}>
						<thead>
							<tr>
								<th style={headerCellStyle}>Role</th>
								<th style={headerCellStyle}>Step</th>
								<th style={headerCellStyle}>Requested chroma</th>
								<th style={headerCellStyle}>Resolved chroma</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={`${row.role}-${row.step}-${row.index}`}>
									<td style={{ ...cellStyle, textTransform: 'capitalize' }}>{row.role}</td>
									<td style={cellStyle}>{row.step}</td>
									<td style={cellStyle}>{row.requestedChroma.toFixed(4)}</td>
									<td style={cellStyle}>{row.resolvedChroma.toFixed(4)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</SectionCard>
	);
}
