import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Code } from '@luke-ui/react/code';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
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
import * as styles from './token-explorer.css.js';

const TOTAL_TOKEN_COUNT = themeTokens.length;
const VARIABLE_BY_PATH = new Map(themeTokens.map((token) => [token.path, token.variable]));
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
			<Track
				gap="sp12"
				railAlignment="center"
				railEnd={
					<Text
						aria-live="polite"
						color="secondary"
						elementType="p"
						fontVariantNumeric="tabular-nums"
						typography="caption"
					>
						{countText}
					</Text>
				}
			>
				<Box flexGrow="1" minInlineSize="12rem">
					<TextInputField
						aria-label="Filter tokens by name"
						onChange={setFilter}
						placeholder="Filter by name"
						prefix={<Icon name="search" size="small" />}
						size="small"
						value={filter}
					/>
				</Box>
			</Track>

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
		<Box
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			overflow="hidden"
			renderRoot={(domProps) => <Disclosure {...domProps} defaultExpanded />}
		>
			<Heading level={3} style={{ margin: 0 }}>
				<Box
					className={styles.groupTrigger}
					inlineSize="100%"
					paddingBlock="sp12"
					paddingInline="sp16"
					renderRoot={(domProps) => <RacButton {...domProps} slot="trigger" />}
				>
					<Track
						gap="sp8"
						railAlignment="center"
						railEnd={
							<Text
								color="secondary"
								elementType="span"
								fontVariantNumeric="tabular-nums"
								typography="caption"
							>
								{group.tokens.length}
							</Text>
						}
						railStart={
							<Icon aria-hidden className={styles.groupChevron} name="chevronRight" size="xsmall" />
						}
					>
						{group.title}
					</Track>
				</Box>
			</Heading>

			<DisclosurePanel>
				<Box paddingBlock="sp12" paddingInline="sp16">
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railEnd={
							group.related ? (
								<DocsLink
									className={styles.relatedLink}
									params={{ _splat: group.related.splat }}
									to="/$"
								>
									{group.related.label}
								</DocsLink>
							) : null
						}
					>
						<Text color="secondary" typography="caption">
							{group.description}
						</Text>
					</Track>
				</Box>
				<TokenTable showSamples={group.showSamples} tokens={group.tokens} />
			</DisclosurePanel>
		</Box>
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
		<Box className={styles.tableScroll} overflowX="auto">
			<table className={cx(styles.table, showSamples && styles.tableWithSamples)}>
				<thead>
					<tr className={styles.tableHeaderRow}>
						{showSamples ? (
							<th className={cx(styles.tableHeaderCell, styles.sampleHeaderCell)} scope="col">
								Sample
							</th>
						) : null}
						<th className={styles.tableHeaderCell} scope="col">
							<Code>vars</Code> path
						</th>
						<th className={styles.tableHeaderCell} scope="col">
							CSS variable
						</th>
					</tr>
				</thead>
				<tbody>
					{tokens.map((token) => (
						<tr className={styles.tableRow} key={token.path}>
							{showSamples ? (
								<td className={styles.tableCell}>
									<span aria-hidden>
										<TokenSample token={token} />
									</span>
								</td>
							) : null}
							<td className={styles.tableCell}>
								<Code textWrap="pretty">{token.path}</Code>
							</td>
							<td className={styles.tableCell}>
								<Code className={styles.variableCode} textWrap="pretty">
									{token.variable}
								</Code>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</Box>
	);
}

function TokenSample({ token }: { token: ThemeToken }) {
	const Sample = FAMILY_SAMPLES[token.family];
	return <Sample {...token} />;
}

function SampleFrame({
	children,
	gap,
	justifyContent = 'center',
	paddingInline,
	style,
}: {
	children?: ReactNode;
	gap?: 'sp8';
	justifyContent?: 'center' | 'flex-start';
	paddingInline?: 'sp8';
	style?: CSSProperties;
}): JSX.Element {
	return (
		<Box
			alignItems="center"
			display="flex"
			elementType="span"
			gap={gap}
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
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.base }}>
			<span
				style={{ alignSelf: 'stretch', backgroundColor: `var(${variable})`, inlineSize: '100%' }}
			/>
		</SampleFrame>
	);
}

function DepthSample({ variable }: ThemeToken) {
	return (
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.subdued }}>
			<span
				style={{
					backgroundColor: vars.color.surface.base,
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
		<SampleFrame style={{ ...stageStyle, backgroundColor: vars.color.surface.subdued }}>
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
		<SampleFrame gap="sp8">
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
				className={styles.motionDot}
				style={{
					animationDuration: axis === 'duration' ? `var(${variable})` : FALLBACK_MOTION_DURATION,
					animationTimingFunction: axis === 'easing' ? `var(${variable})` : FALLBACK_MOTION_EASING,
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

	return <TextSample style={{}} />;
}

const FAMILY_SAMPLES: Record<ThemeTokenFamily, (token: ThemeToken) => ReactNode> = {
	color: ColorSample,
	controlFinish: FinishSample,
	controlSize: SizeSample,
	depth: DepthSample,
	font: FontSample,
	interaction: InteractionSample,
	motion: MotionSample,
	radius: RadiusSample,
	space: SpaceSample,
};

function EmptyState({ onClear, query }: { onClear: () => void; query: string }) {
	return (
		<Box borderColor="decorative" borderRadius="surface" borderStyle="solid" borderWidth="thin">
			<Stack alignItems="center" gap="sp12" paddingBlock="sp64" paddingInline="sp24">
				<Text color="secondary" elementType="p" textAlign="center" typography="caption">
					No token matches &quot;{query}&quot;
				</Text>
				<Button onPress={onClear} size="small">
					Clear filter
				</Button>
			</Stack>
		</Box>
	);
}
