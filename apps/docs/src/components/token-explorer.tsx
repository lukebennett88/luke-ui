import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useState } from 'react';
import type { ThemeToken, ThemeTokenFamily } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';
import type { TokenPurposeGroup } from '../lib/token-purpose-groups.js';
import { tokenPurposeGroups } from '../lib/token-purpose-groups.js';
import { DocsLink } from './docs-link.js';

const TOTAL_TOKEN_COUNT = themeTokens.length;
const VARIABLE_BY_PATH = new Map(themeTokens.map((token) => [token.path, token.variable]));
const SAMPLE_FRAME_CLASS_NAME = 'flex min-h-10 w-24 items-center justify-center';
const MOTION_KEYFRAMES = `@keyframes luke-docs-token-motion { from { transform: translateX(-0.75rem); } to { transform: translateX(0.75rem); } } @media (prefers-reduced-motion: reduce) { [data-token-motion] { animation: none !important; } }`;
const FALLBACK_MOTION_DURATION = '0.9s';
const FALLBACK_MOTION_EASING = 'ease-in-out';

const stageStyle = {
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.detail,
	borderStyle: 'solid',
	borderWidth: 1,
} as const satisfies CSSProperties;

/** Purpose-grouped index of every public token, sampled in the active theme. */
export function TokenExplorer(): JSX.Element {
	const [filter, setFilter] = useState('');
	const query = filter.trim().toLowerCase();
	const groups = matchGroups(query);
	const matchCount = groups.reduce((total, group) => total + group.tokens.length, 0);
	const countText =
		query === '' ? `${TOTAL_TOKEN_COUNT} tokens` : `${matchCount} of ${TOTAL_TOKEN_COUNT}`;

	return (
		<div className="not-prose flex flex-col gap-4">
			<style>{MOTION_KEYFRAMES}</style>

			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-48 flex-1">
					<TextField
						aria-label="Filter tokens by name"
						onChange={setFilter}
						placeholder="Filter by name"
						prefix={<Icon aria-hidden name="search" size="small" />}
						size="small"
						value={filter}
					/>
				</div>
				<p aria-live="polite" className="ms-auto text-fd-muted-foreground text-sm tabular-nums">
					{countText}
				</p>
			</div>

			{groups.length === 0 ? (
				<EmptyState onClear={() => setFilter('')} query={filter.trim()} />
			) : (
				groups.map((group, index) => (
					<PurposeDetails group={group} isOpen={query !== '' || index === 0} key={group.id} />
				))
			)}
		</div>
	);
}

function matchGroups(query: string): ReadonlyArray<TokenPurposeGroup> {
	if (query === '') return tokenPurposeGroups;

	return tokenPurposeGroups.flatMap((group) => {
		if (group.title.toLowerCase().includes(query)) return [group];
		const tokens = group.tokens.filter(
			(token) =>
				token.path.toLowerCase().includes(query) || token.variable.toLowerCase().includes(query),
		);
		return tokens.length === 0 ? [] : [{ ...group, tokens }];
	});
}

function PurposeDetails({ group, isOpen }: { group: TokenPurposeGroup; isOpen: boolean }) {
	return (
		<details className="group rounded-xl border border-fd-border" open={isOpen}>
			<summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-semibold text-base marker:hidden">
				<Icon
					aria-hidden
					className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
					name="chevronRight"
					size="xsmall"
				/>
				{group.title}
				<span className="ms-auto font-normal text-fd-muted-foreground text-sm tabular-nums">
					{group.tokens.length}
				</span>
			</summary>

			<div className="border-fd-border border-t">
				<div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
					<p className="text-fd-muted-foreground text-sm">{group.description}</p>
					{group.related ? (
						<DocsLink
							className="text-fd-muted-foreground text-sm underline-offset-4 hover:text-fd-foreground hover:underline"
							params={{ _splat: group.related.splat }}
							to="/$"
						>
							{group.related.label}
						</DocsLink>
					) : null}
				</div>
				<TokenTable tokens={group.tokens} />
			</div>
		</details>
	);
}

function TokenTable({ tokens }: { tokens: ReadonlyArray<ThemeToken> }) {
	return (
		<div className="overflow-x-auto border-fd-border border-t">
			<table className="w-full min-w-[40rem] border-collapse text-sm">
				<thead>
					<tr className="border-fd-border border-b text-left">
						<th className="w-32 px-4 py-2 font-medium" scope="col">
							Sample
						</th>
						<th className="px-4 py-2 font-medium" scope="col">
							<code>vars</code> path
						</th>
						<th className="px-4 py-2 font-medium" scope="col">
							CSS variable
						</th>
					</tr>
				</thead>
				<tbody>
					{tokens.map((token) => (
						<tr className="border-fd-border border-b last:border-b-0" key={token.path}>
							<td aria-hidden className="px-4 py-2">
								<TokenSample token={token} />
							</td>
							<td className="px-4 py-2">
								<code>{token.path}</code>
							</td>
							<td className="px-4 py-2">
								<code className="text-fd-muted-foreground">{token.variable}</code>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function TokenSample({ token }: { token: ThemeToken }) {
	const Sample = FAMILY_SAMPLES[token.family];
	return <Sample {...token} />;
}

function ColorSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.canvas }}
		>
			<span
				style={{ alignSelf: 'stretch', backgroundColor: `var(${variable})`, inlineSize: '100%' }}
			/>
		</span>
	);
}

function DepthSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}
		>
			<span
				style={{
					backgroundColor: vars.color.surface.floating,
					blockSize: '1.5rem',
					borderRadius: vars.radius.control,
					boxShadow: `var(${variable})`,
					inlineSize: '60%',
				}}
			/>
		</span>
	);
}

function FinishSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}
		>
			<span
				style={{
					backgroundColor: vars.color.background.neutral.solid.rest,
					backgroundImage: `var(${variable})`,
					blockSize: '1.75rem',
					borderRadius: vars.radius.control,
					inlineSize: '70%',
				}}
			/>
		</span>
	);
}

function RadiusSample({ variable }: ThemeToken) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.subtle.rest,
					blockSize: '2.5rem',
					borderColor: vars.color.border.decorative,
					borderRadius: `var(${variable})`,
					borderStyle: 'solid',
					borderWidth: 1,
					inlineSize: '2.5rem',
				}}
			/>
		</span>
	);
}

function SpaceSample({ variable }: ThemeToken) {
	return (
		<span className={cx(SAMPLE_FRAME_CLASS_NAME, 'justify-start px-2')} style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
					maxInlineSize: '100%',
				}}
			/>
		</span>
	);
}

function SizeSample({ variable }: ThemeToken) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: `var(${variable})`,
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
				}}
			/>
		</span>
	);
}

function MotionSample({ path, variable }: ThemeToken) {
	const axis = path.split('.')[1];

	return (
		<span className={SAMPLE_FRAME_CLASS_NAME} style={stageStyle}>
			<span
				data-token-motion
				style={{
					animationDirection: 'alternate',
					animationDuration: axis === 'duration' ? `var(${variable})` : FALLBACK_MOTION_DURATION,
					animationIterationCount: 'infinite',
					animationName: 'luke-docs-token-motion',
					animationTimingFunction: axis === 'easing' ? `var(${variable})` : FALLBACK_MOTION_EASING,
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: vars.iconSize.xsmall,
					borderRadius: vars.radius.full,
					inlineSize: vars.iconSize.xsmall,
				}}
			/>
		</span>
	);
}

function TextSample({ children = 'Aa', style }: { children?: ReactNode; style: CSSProperties }) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span style={{ color: vars.color.text.primary, ...style }}>{children}</span>
		</span>
	);
}

function TrimSample({
	property,
	variable,
}: {
	property: 'marginBlockEnd' | 'marginBlockStart';
	variable: string;
}) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME} style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					inlineSize: '3rem',
					[property]: `var(${variable})`,
				}}
			/>
		</span>
	);
}

function FontSample({ path, variable }: ThemeToken) {
	const [, section, property] = path.split('.');

	if (section === 'family') return <TextSample style={{ fontFamily: `var(${variable})` }} />;
	if (section === 'weight') return <TextSample style={{ fontWeight: `var(${variable})` }} />;

	const stepFontSizeVariable = VARIABLE_BY_PATH.get(`font.${section}.fontSize`);
	const fontSize = stepFontSizeVariable ? `var(${stepFontSizeVariable})` : undefined;

	if (property === 'fontSize') return <TextSample style={{ fontSize: `var(${variable})` }} />;
	if (property === 'lineHeight') {
		return (
			<TextSample style={{ fontSize, lineHeight: `var(${variable})` }}>
				Aa
				<br />
				Aa
			</TextSample>
		);
	}
	if (property === 'letterSpacing') {
		return <TextSample style={{ fontSize, letterSpacing: `var(${variable})` }} />;
	}
	if (property === 'baselineTrim') {
		return <TrimSample property="marginBlockStart" variable={variable} />;
	}
	if (property === 'capHeightTrim') {
		return <TrimSample property="marginBlockEnd" variable={variable} />;
	}

	return <TextSample style={{}} />;
}

const FAMILY_SAMPLES: Record<ThemeTokenFamily, (token: ThemeToken) => ReactNode> = {
	actionControlFinish: FinishSample,
	color: ColorSample,
	controlSize: SizeSample,
	depth: DepthSample,
	font: FontSample,
	iconSize: SizeSample,
	motion: MotionSample,
	radius: RadiusSample,
	space: SpaceSample,
};

function EmptyState({ onClear, query }: { onClear: () => void; query: string }) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-fd-border px-6 py-16 text-center">
			<p className="text-fd-muted-foreground text-sm">No token matches &quot;{query}&quot;</p>
			<Button appearance="subtle" onPress={onClear} size="small">
				Clear filter
			</Button>
		</div>
	);
}
