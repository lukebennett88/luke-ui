import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import { Heading } from 'react-aria-components/Heading';
import type { ThemeToken, ThemeTokenFamily } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';
import type { TokenPurposeGroup } from '../lib/token-purpose-groups.js';
import { tokenPurposeGroups } from '../lib/token-purpose-groups.js';
import { DocsLink } from './docs-link.js';

const TOTAL_TOKEN_COUNT = themeTokens.length;
const VARIABLE_BY_PATH = new Map(themeTokens.map((token) => [token.path, token.variable]));
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
		<Stack className="not-prose" gap="sp16">
			<style>{MOTION_KEYFRAMES}</style>

			<Cluster gap="sp12">
				<Box flexGrow="1" minInlineSize="12rem">
					<TextField
						aria-label="Filter tokens by name"
						onChange={setFilter}
						placeholder="Filter by name"
						prefix={<Icon name="search" size="small" />}
						size="small"
						value={filter}
					/>
				</Box>
				<Text
					aria-live="polite"
					className="ms-auto"
					color="secondary"
					elementType="p"
					fontVariantNumeric="tabular-nums"
					typography="caption"
				>
					{countText}
				</Text>
			</Cluster>

			{groups.length === 0 ? (
				<EmptyState onClear={() => setFilter('')} query={filter.trim()} />
			) : (
				groups.map((group) => <PurposeDetails group={group} key={group.id} />)
			)}
		</Stack>
	);
}

function matchGroups(query: string): ReadonlyArray<TokenPurposeGroup> {
	if (query === '') return tokenPurposeGroups;

	return tokenPurposeGroups.flatMap((group) => {
		if (group.title.toLowerCase().includes(query)) return [group];
		const tokens = group.tokens.filter((token) => {
			return (
				token.path.toLowerCase().includes(query) || token.variable.toLowerCase().includes(query)
			);
		});
		return tokens.length === 0 ? [] : [{ ...group, tokens }];
	});
}

function PurposeDetails({ group }: { group: TokenPurposeGroup }) {
	return (
		<Disclosure className="group rounded-xl border border-fd-border" defaultExpanded>
			<Heading className="m-0" level={3}>
				<RacButton
					className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-inset"
					slot="trigger"
				>
					<Icon
						aria-hidden
						className="transition-transform group-data-expanded:rotate-90 motion-reduce:transition-none"
						name="chevronRight"
						size="xsmall"
					/>
					{group.title}
					<span className="ms-auto font-normal text-fd-muted-foreground text-sm tabular-nums">
						{group.tokens.length}
					</span>
				</RacButton>
			</Heading>

			<DisclosurePanel className="border-fd-border border-t">
				<Cluster
					alignItems="baseline"
					gap="sp8"
					justifyContent="space-between"
					paddingBlock="sp12"
					paddingInline="sp16"
				>
					<Text color="secondary" typography="caption">
						{group.description}
					</Text>
					{group.related ? (
						<DocsLink
							className="text-fd-muted-foreground text-sm underline-offset-4 hover:text-fd-foreground hover:underline"
							params={{ _splat: group.related.splat }}
							to="/$"
						>
							{group.related.label}
						</DocsLink>
					) : null}
				</Cluster>
				<TokenTable showSamples={group.showSamples} tokens={group.tokens} />
			</DisclosurePanel>
		</Disclosure>
	);
}

function TokenTable({
	showSamples,
	tokens,
}: {
	showSamples: boolean;
	tokens: ReadonlyArray<ThemeToken>;
}) {
	return (
		<div className="overflow-x-auto border-fd-border border-t">
			<table
				className={cx('w-full border-collapse text-sm', showSamples ? 'min-w-160' : 'min-w-lg')}
			>
				<thead>
					<tr className="border-fd-border border-b text-left">
						{showSamples ? (
							<th className="w-32 px-4 py-2 font-medium" scope="col">
								Sample
							</th>
						) : null}
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
							{showSamples ? (
								<td aria-hidden className="px-4 py-2">
									<TokenSample token={token} />
								</td>
							) : null}
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

function SampleFrame({
	children,
	className,
	justifyContent = 'center',
	paddingInline,
	style,
}: {
	children?: ReactNode;
	className?: string;
	justifyContent?: 'center' | 'flex-start';
	paddingInline?: 'sp8';
	style?: CSSProperties;
}): JSX.Element {
	return (
		<Box
			alignItems="center"
			className={className}
			display="flex"
			elementType="span"
			inlineSize="6rem"
			justifyContent={justifyContent}
			minBlockSize="2.5rem"
			paddingInline={paddingInline}
			style={style}
		>
			{children}
		</Box>
	);
}

function ColorSample({ variable }: ThemeToken) {
	return (
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.canvas }}>
			<span
				style={{ alignSelf: 'stretch', backgroundColor: `var(${variable})`, inlineSize: '100%' }}
			/>
		</SampleFrame>
	);
}

function DepthSample({ variable }: ThemeToken) {
	return (
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}>
			<span
				style={{
					backgroundColor: vars.color.surface.floating,
					blockSize: '1.5rem',
					borderRadius: vars.radius.control,
					boxShadow: `var(${variable})`,
					inlineSize: '60%',
				}}
			/>
		</SampleFrame>
	);
}

function FinishSample({ variable }: ThemeToken) {
	return (
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}>
			<span
				style={{
					backgroundColor: vars.color.background.neutral.solid.rest,
					backgroundImage: `var(${variable})`,
					blockSize: '1.75rem',
					borderRadius: vars.radius.control,
					inlineSize: '70%',
				}}
			/>
		</SampleFrame>
	);
}

function RadiusSample({ variable }: ThemeToken) {
	return (
		<SampleFrame>
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
		</SampleFrame>
	);
}

function SpaceSample({ variable }: ThemeToken) {
	return (
		<SampleFrame justifyContent="flex-start" paddingInline="sp8" style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
					maxInlineSize: '100%',
				}}
			/>
		</SampleFrame>
	);
}

function SizeSample({ variable }: ThemeToken) {
	return (
		<SampleFrame>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: `var(${variable})`,
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
				}}
			/>
		</SampleFrame>
	);
}

function InteractionSample({ variable }: ThemeToken) {
	return (
		<SampleFrame className="gap-1.5">
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '1rem',
					borderRadius: vars.radius.detail,
					inlineSize: '1rem',
				}}
			/>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '1rem',
					borderRadius: vars.radius.detail,
					inlineSize: '1rem',
					opacity: `var(${variable})`,
				}}
			/>
		</SampleFrame>
	);
}

function MotionSample({ path, variable }: ThemeToken) {
	const axis = path.split('.')[1];

	return (
		<SampleFrame style={stageStyle}>
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
		</SampleFrame>
	);
}

function TextSample({ children = 'Aa', style }: { children?: ReactNode; style: CSSProperties }) {
	return (
		<SampleFrame>
			<span style={{ color: vars.color.text.primary, ...style }}>{children}</span>
		</SampleFrame>
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
		<SampleFrame style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					inlineSize: '3rem',
					[property]: `var(${variable})`,
				}}
			/>
		</SampleFrame>
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
	interaction: InteractionSample,
	motion: MotionSample,
	radius: RadiusSample,
	space: SpaceSample,
};

function EmptyState({ onClear, query }: { onClear: () => void; query: string }) {
	return (
		<Stack
			alignItems="center"
			className="rounded-xl border border-fd-border text-center"
			gap="sp12"
			paddingBlock="sp64"
			paddingInline="sp24"
		>
			<Text color="secondary" elementType="p" typography="caption">
				No token matches &quot;{query}&quot;
			</Text>
			<Button onPress={onClear} size="small">
				Clear filter
			</Button>
		</Stack>
	);
}
