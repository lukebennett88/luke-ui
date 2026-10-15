import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { Fragment, useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import { Heading } from 'react-aria-components/Heading';
import type { ThemeToken, ThemeTokenFamily } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';
import type { TokenPurposeGroup } from '../lib/token-purpose-groups.js';
import { tokenPurposeGroups } from '../lib/token-purpose-groups.js';
import * as disclosureStyles from './docs-disclosure.css.js';
import { DocsLink } from './docs-link.js';
import * as tableStyles from './reference-table.css.js';
import {
	CellText,
	ReferenceHeaderCell,
	ReferenceTableFrame,
	ReferenceTableHeader,
	TableCell,
	TableColumn,
} from './reference-table.js';
import * as styles from './token-explorer.css.js';

const TOTAL_TOKEN_COUNT = themeTokens.length;
const VARIABLE_BY_PATH = new Map(themeTokens.map((token) => [token.path, token.variable]));
const FALLBACK_MOTION_DURATION = '0.9s';
const FALLBACK_MOTION_EASING = 'ease-in-out';

/** Purpose-grouped index of every public token, sampled in the active theme. */
export function TokenExplorer(): JSX.Element {
	const [filter, setFilter] = useState('');
	const query = filter.trim().toLowerCase();
	const groups = matchGroups(query);
	const matchCount = groups.reduce((total, group) => total + group.tokens.length, 0);
	const countText =
		query === '' ? `${TOTAL_TOKEN_COUNT} tokens` : `${matchCount} of ${TOTAL_TOKEN_COUNT}`;

	return (
		<Stack className="not-prose" gap="sp16" marginBlockStart="sp16">
			<Track
				className={tableStyles.filterTrack}
				gap="sp12"
				railAlignment="firstLine"
				railEnd={
					<Text
						aria-live="polite"
						color="secondary"
						fontVariantNumeric="tabular-nums"
						fontWeight="body"
						typography="label"
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
				<Stack gap="sp32">
					{groups.map((group) => (
						<PurposeDetails group={group} key={group.id} />
					))}
				</Stack>
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
		<Box renderRoot={(domProps) => <Disclosure {...domProps} defaultExpanded />}>
			<Box margin="0" renderRoot={(domProps) => <Heading {...domProps} level={3} />}>
				<Cluster
					alignItems="center"
					className={disclosureStyles.trigger}
					flexWrap="nowrap"
					gap="sp8"
					inlineSize="100%"
					paddingBlock="sp8"
					renderRoot={(domProps) => <RacButton {...domProps} slot="trigger" />}
				>
					<Icon
						aria-hidden
						className={disclosureStyles.chevronEnd}
						name="chevronRight"
						size="xsmall"
					/>
					<Cluster alignItems="baseline" flexWrap="nowrap" gap="sp8">
						<Text fontWeight="emphasis" typography="heading4">
							{group.title}
						</Text>
						<Text
							color="secondary"
							fontVariantNumeric="tabular-nums"
							fontWeight="body"
							typography="label"
						>
							{group.tokens.length}
						</Text>
					</Cluster>
				</Cluster>
			</Box>

			<DisclosurePanel>
				<Stack gap="sp12">
					<Text color="secondary" elementType="p" fontWeight="body" typography="label">
						{group.description}
						{group.related ? (
							<Fragment>
								{' '}
								See{' '}
								<DocsLink params={{ _splat: group.related.splat }} to="/$">
									{group.related.label}
								</DocsLink>
								.
							</Fragment>
						) : null}
					</Text>
					<TokenTable showSamples={group.showSamples} tokens={group.tokens} />
				</Stack>
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
		<ReferenceTableFrame>
			<colgroup>
				{showSamples ? <TableColumn className={tableStyles.hideNarrow} inlineSize="8rem" /> : null}
				<TableColumn className={tableStyles.hideNarrow} inlineSize="45%" />
				<col />
			</colgroup>
			<ReferenceTableHeader>
				{showSamples ? <ReferenceHeaderCell>Sample</ReferenceHeaderCell> : null}
				<ReferenceHeaderCell>
					<CellText className={tableStyles.monospace}>vars</CellText> path
				</ReferenceHeaderCell>
				<ReferenceHeaderCell>CSS variable</ReferenceHeaderCell>
			</ReferenceTableHeader>
			<tbody className={tableStyles.bodyGroupCentered}>
				{tokens.map((token) => (
					<tr key={token.path}>
						{showSamples ? (
							<TokenCell>
								<span aria-hidden>
									<TokenSample token={token} />
								</span>
							</TokenCell>
						) : null}
						<TokenCell>
							<CellText className={tableStyles.monospace} fontWeight="body">
								{token.path}
							</CellText>
						</TokenCell>
						<TokenCell isRowEnd>
							<CellText className={tableStyles.monospace} color="secondary" fontWeight="body">
								{token.variable}
							</CellText>
						</TokenCell>
					</tr>
				))}
			</tbody>
		</ReferenceTableFrame>
	);
}

function TokenCell({ children, isRowEnd }: { children: ReactNode; isRowEnd?: boolean }) {
	return (
		<TableCell
			className={cx(
				tableStyles.cell,
				tableStyles.stackedCell,
				tableStyles.ruled,
				isRowEnd ? tableStyles.rowEnd : undefined,
			)}
			paddingBlock="sp8"
			paddingInline="sp16"
		>
			{children}
		</TableCell>
	);
}

function TokenSample({ token }: { token: ThemeToken }) {
	const Sample = FAMILY_SAMPLES[token.family];
	return <Sample {...token} />;
}

/** Static props that frame a sample on a bordered stage. */
const STAGE = {
	borderColor: 'decorative',
	borderRadius: 'detail',
	borderStyle: 'solid',
	borderWidth: 'thin',
} as const satisfies BoxProps;

function SampleFrame({
	children,
	gap,
	justifyContent = 'center',
	paddingInline,
	stage,
}: {
	children?: ReactNode;
	gap?: 'sp8';
	justifyContent?: 'center' | 'flex-start';
	paddingInline?: 'sp8';
	stage?: 'base' | 'subdued' | 'transparent';
}): JSX.Element {
	return (
		<Box
			{...(stage ? STAGE : undefined)}
			alignItems="center"
			backgroundColor={stage === 'base' || stage === 'subdued' ? `surface.${stage}` : undefined}
			display="flex"
			elementType="span"
			gap={gap}
			inlineSize="6rem"
			justifyContent={justifyContent}
			minBlockSize="2.5rem"
			paddingInline={paddingInline}
		>
			{children}
		</Box>
	);
}

function ColorSample({ variable }: ThemeToken) {
	return (
		<SampleFrame stage="base">
			<Box
				alignSelf="stretch"
				elementType="span"
				inlineSize="100%"
				style={{ backgroundColor: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function DepthSample({ variable }: ThemeToken) {
	return (
		<SampleFrame stage="subdued">
			<Box
				backgroundColor="surface.base"
				blockSize="1.5rem"
				borderRadius="control"
				elementType="span"
				inlineSize="60%"
				style={{ boxShadow: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function FinishSample({ variable }: ThemeToken) {
	return (
		<SampleFrame stage="subdued">
			<Box
				backgroundColor="neutral.solid.rest"
				blockSize="1.75rem"
				borderRadius="control"
				elementType="span"
				inlineSize="70%"
				style={{ backgroundImage: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function RadiusSample({ variable }: ThemeToken) {
	return (
		<SampleFrame>
			<Box
				{...STAGE}
				backgroundColor="accent.subtle.rest"
				blockSize="2.5rem"
				elementType="span"
				inlineSize="2.5rem"
				style={{ borderRadius: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function SpaceSample({ variable }: ThemeToken) {
	return (
		<SampleFrame justifyContent="flex-start" paddingInline="sp8" stage="transparent">
			<Box
				backgroundColor="accent.solid.rest"
				blockSize="0.75rem"
				borderRadius="detail"
				elementType="span"
				maxInlineSize="100%"
				style={{ inlineSize: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function SizeSample({ variable }: ThemeToken) {
	return (
		<SampleFrame>
			<Box
				backgroundColor="accent.solid.rest"
				borderRadius="detail"
				elementType="span"
				style={{ blockSize: `var(${variable})`, inlineSize: `var(${variable})` }}
			/>
		</SampleFrame>
	);
}

function InteractionSample({ variable }: ThemeToken) {
	return (
		<SampleFrame gap="sp8">
			<InteractionDot />
			<InteractionDot style={{ opacity: `var(${variable})` }} />
		</SampleFrame>
	);
}

function InteractionDot({ style }: { style?: CSSProperties }) {
	return (
		<Box
			backgroundColor="accent.solid.rest"
			blockSize="1rem"
			borderRadius="detail"
			elementType="span"
			inlineSize="1rem"
			style={style}
		/>
	);
}

function MotionSample({ path, variable }: ThemeToken) {
	const axis = path.split('.')[1];

	return (
		<SampleFrame stage="transparent">
			<Box
				backgroundColor="accent.solid.rest"
				blockSize="1rem"
				borderRadius="full"
				className={styles.motionDot}
				elementType="span"
				inlineSize="1rem"
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
		<Stack alignItems="center" gap="sp12" paddingBlock="sp48" paddingInline="sp24">
			<Text color="secondary" elementType="p" textAlign="center" typography="label">
				No token matches &quot;{query}&quot;
			</Text>
			<Button onPress={onClear} size="small">
				Clear filter
			</Button>
		</Stack>
	);
}
