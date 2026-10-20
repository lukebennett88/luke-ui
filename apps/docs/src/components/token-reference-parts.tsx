import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Code } from '@luke-ui/react/code';
import { Grid } from '@luke-ui/react/grid';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import type { TextElementProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ReactNode } from 'react';
import { Fragment, useId } from 'react';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import { tokenRowId } from '../lib/token-navigation.js';
import { useClipboardFeedback } from '../lib/use-clipboard-feedback.js';
import { useTokenValue } from '../lib/use-token-value.js';
import * as styles from './token-reference.css.js';

// Shared pieces of the token reference sections.

type TokenTextProps = Omit<TextElementProps, 'children'> & { token: ThemeToken };

/** The full typed token path as a `Code` chip. */
function TokenName({ token, ...props }: TokenTextProps) {
	return (
		<Text shouldDisableTrim {...props}>
			<TokenPath path={token.path} />
		</Text>
	);
}

/** The typed token path, with break opportunities after its dots. */
export function TokenPath({ path }: { path: string }) {
	return (
		<Code>
			vars.
			{path.split('.').map((segment, index) => (
				<Fragment key={`${index}-${segment}`}>
					{index > 0 ? '.' : null}
					{index > 0 ? <wbr /> : null}
					{segment}
				</Fragment>
			))}
		</Code>
	);
}

/**
 * The token's resolved value in the active theme, with tabular numerals. Shows a dash until the page
 * has hydrated and can read the theme.
 */
function TokenValue({ token, ...props }: TokenTextProps) {
	const value = useTokenValue(token);
	return (
		<Text fontVariantNumeric="tabular-nums" shouldDisableTrim {...props}>
			<Code>{value === null || value === '' ? '—' : value}</Code>
		</Text>
	);
}

/** Copies the full typed token path. The accessible name says what it copies. */
function TokenCopyButton({ token }: { token: ThemeToken }) {
	const { announcement, copy, status } = useClipboardFeedback<'token'>();
	const text = `vars.${token.path}`;

	return (
		<>
			<IconButton
				aria-label={`Copy ${text}`}
				icon={status?.state === 'copied' ? 'check' : 'copy'}
				onPress={() => void copy('token', text)}
				prominence="low"
				size="small"
				tone="neutral"
			/>
			<VisuallyHidden aria-live="polite" elementType="span">
				{announcement}
			</VisuallyHidden>
		</>
	);
}

/** The framed panel that holds a section's token rows. */
export function TokenPanel({
	children,
	sampleInlineSize,
}: {
	children: ReactNode;
	/** When set, the sticky header includes a sample column sized to match each `TokenRow`. */
	sampleInlineSize?: string;
}) {
	return (
		<Box className="not-prose" marginBlockStart="space.24">
			<TokenColumnHeader sampleInlineSize={sampleInlineSize} />
			<Box className={styles.panelBody}>{children}</Box>
		</Box>
	);
}

/** Named columns for a token row list at tablet and up. */
export function TokenColumnHeader({
	sampleInlineSize,
	valueInlineSize = '13rem',
}: {
	sampleInlineSize?: string;
	valueInlineSize?: string;
}) {
	const hasSample = sampleInlineSize !== undefined;

	return (
		<Grid
			alignItems="center"
			areas={
				hasSample
					? {
							initial: ['sample sample', 'name name', 'value value'],
							bp768: ['sample name value'],
						}
					: {
							initial: ['name name', 'value value'],
							bp768: ['name value'],
						}
			}
			className={cx(styles.columnHeaderShell, styles.columnHeader)}
			columnGap="space.16"
			columns={{
				initial: 'minmax(0, 1fr)',
				bp768: hasSample
					? `${sampleInlineSize} minmax(0, 1fr) minmax(0, ${valueInlineSize})`
					: `minmax(0, 1fr) minmax(0, ${valueInlineSize})`,
			}}
			paddingBlock="space.8"
			paddingInline="space.16"
		>
			{hasSample ? (
				<Box gridArea="sample">
					<VisuallyHidden>Sample</VisuallyHidden>
				</Box>
			) : null}
			<Box gridArea="name">
				<Text color="secondary" fontWeight="label" typography="label">
					Token
				</Text>
			</Box>
			<Box gridArea="value">
				<Text color="secondary" fontWeight="label" typography="label">
					Value
				</Text>
			</Box>
		</Grid>
	);
}

/** A labelled group of rows inside a panel, such as the text colours among the neutral colours. */
export function TokenGroup({
	children,
	control,
	label,
}: {
	children: ReactNode;
	/** Optional control grouped with the label on the start edge. */
	control?: ReactNode;
	label: string;
}) {
	const labelId = useId();
	return (
		<Box className={styles.group}>
			<Box paddingBlockEnd="space.4" paddingBlockStart="space.16" paddingInline="space.16">
				<Cluster alignItems="center" gap="space.12">
					<Text color="secondary" elementType="p" id={labelId} typography="caption">
						{label}
					</Text>
					{control}
				</Cluster>
			</Box>
			<TokenList labelledBy={labelId}>{children}</TokenList>
		</Box>
	);
}

/** A list of token rows, without list markers. */
export function TokenList({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
	return (
		<Box
			aria-labelledby={labelledBy}
			className={styles.list}
			elementType="ul"
			margin="0"
			padding="0"
		>
			{children}
		</Box>
	);
}

interface TokenRowProps {
	/** When to use the token, in a few words. */
	note?: string;
	/** A picture of the value. It is hidden from assistive technology, because the value says it. */
	sample: ReactNode;
	/** The inline size of the sample column, so every row of a list lines up. */
	sampleInlineSize: string;
	token: ThemeToken;
}

/** One token in a list: its sample, typed path, resolved value, and copy button. */
export function TokenRow({ note, sample, sampleInlineSize, token }: TokenRowProps) {
	return (
		<Grid
			alignItems="center"
			areas={{
				initial: ['sample sample', 'name name', 'value value'],
				bp768: ['sample name value'],
			}}
			className={styles.row}
			columnGap="space.16"
			columns={{
				initial: 'minmax(0, 1fr)',
				bp768: `${sampleInlineSize} minmax(0, 1fr) minmax(0, 13rem)`,
			}}
			elementType="li"
			id={tokenRowId(token.path)}
			paddingBlock={{ initial: 'space.16', bp768: 'space.12' }}
			paddingInline="space.16"
			rowGap={{ initial: 'space.12', bp768: 'space.4' }}
		>
			<Box
				alignItems="center"
				aria-hidden
				display="flex"
				gridArea="sample"
				inlineSize={sampleInlineSize}
				minBlockSize={vars.space['32']}
			>
				{sample}
			</Box>
			<Box className={styles.tokenIdentification} gridArea="name" minInlineSize="0">
				<Stack gap="space.4">
					<Cluster alignItems="center" gap="space.8">
						<TokenName elementType="p" token={token} typography="label" />
						<TokenCopyButton token={token} />
					</Cluster>
					{note ? (
						<Text color="secondary" elementType="p" typography="caption">
							{note}
						</Text>
					) : null}
				</Stack>
			</Box>
			<Box gridArea="value" minInlineSize="0">
				<TokenValue elementType="p" token={token} typography="label" />
			</Box>
		</Grid>
	);
}
