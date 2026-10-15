import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Grid } from '@luke-ui/react/grid';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import type { TextProps } from '@luke-ui/react/text';
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

type TokenTextProps = Omit<TextProps, 'children'> & { token: ThemeToken };

/** The full typed token path, in the code font. */
function TokenName({ className, token, ...props }: TokenTextProps) {
	return (
		<Text className={cx(styles.code, className)} shouldDisableTrim {...props}>
			<TokenPath path={token.path} />
		</Text>
	);
}

/** The typed token path, with break opportunities after its dots. */
export function TokenPath({ path }: { path: string }) {
	return (
		<>
			vars.
			{path.split('.').map((segment, index) => (
				<Fragment key={`${index}-${segment}`}>
					{index > 0 ? '.' : null}
					{index > 0 ? <wbr /> : null}
					{segment}
				</Fragment>
			))}
		</>
	);
}

/** The CSS custom property for use outside TypeScript. */
function TokenVariable({ className, token, ...props }: TokenTextProps) {
	return (
		<Text className={cx(styles.code, className)} color="secondary" shouldDisableTrim {...props}>
			{token.variable}
		</Text>
	);
}

/**
 * The token's resolved value in the active theme, with tabular numerals. Shows a dash until the page
 * has hydrated and can read the theme.
 */
function TokenValue({ className, token, ...props }: TokenTextProps) {
	const value = useTokenValue(token);
	return (
		<Text
			className={cx(styles.code, className)}
			color="secondary"
			fontVariantNumeric="tabular-nums"
			shouldDisableTrim
			{...props}
		>
			{value === null || value === '' ? '—' : value}
		</Text>
	);
}

/** Copies the full typed token path. The accessible name says what it copies. */
function TokenCopyButton({ token }: { token: ThemeToken }) {
	const { announcement, copy, status } = useClipboardFeedback<'token'>();
	const text = `vars.${token.path}`;

	const label = (() => {
		if (status?.state === 'copied') return 'Copied';
		if (status?.state === 'error') return 'Failed';
		return 'Copy';
	})();

	return (
		<>
			<Button
				aria-label={`Copy ${text}`}
				className={styles.tokenCopyButton}
				onPress={() => void copy('token', text)}
				prominence="low"
				size="small"
				startContent={<Icon name={status?.state === 'copied' ? 'check' : 'copy'} />}
			>
				{label}
			</Button>
			<VisuallyHidden aria-live="polite" elementType="span">
				{announcement}
			</VisuallyHidden>
		</>
	);
}

/** The single-border panel that holds a section's token rows. */
export function TokenPanel({ children }: { children: ReactNode }) {
	return (
		<Box
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			className="not-prose"
			marginBlockStart="sp24"
			overflow="hidden"
		>
			{children}
		</Box>
	);
}

/** A labelled group of rows inside a panel, such as the text colours among the neutral colours. */
export function TokenGroup({ children, label }: { children: ReactNode; label: string }) {
	const labelId = useId();
	return (
		<Box className={styles.group}>
			<Box paddingBlockEnd="sp4" paddingBlockStart="sp16" paddingInline="sp16">
				<Text color="secondary" elementType="p" id={labelId} typography="caption">
					{label}
				</Text>
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
	/** A picture of the value. It is hidden from assistive technology, because the value says it. */
	sample: ReactNode;
	/** The inline size of the sample column, so every row of a list lines up. */
	sampleInlineSize: string;
	token: ThemeToken;
}

/**
 * One token in a list: its sample, typed path, CSS variable, resolved value, and copy button.
 * The row's id is the target of a Find result.
 */
export function TokenRow({ sample, sampleInlineSize, token }: TokenRowProps) {
	return (
		<Grid
			alignItems="center"
			areas={{
				initial: ['sample copy', 'name name', 'value value'],
				bp768: ['sample name value copy'],
			}}
			className={styles.row}
			columnGap="sp16"
			columns={{
				initial: 'minmax(0, 1fr) auto',
				bp768: `${sampleInlineSize} minmax(0, 1fr) minmax(0, 13rem) 6rem`,
			}}
			elementType="li"
			id={tokenRowId(token.path)}
			paddingBlock={{ initial: 'sp16', bp768: 'sp12' }}
			paddingInline="sp16"
			rowGap={{ initial: 'sp12', bp768: 'sp4' }}
		>
			<Box
				alignItems="center"
				aria-hidden
				display="flex"
				gridArea="sample"
				inlineSize={sampleInlineSize}
				minBlockSize={vars.space.sp32}
			>
				{sample}
			</Box>
			<Stack gap="sp8" gridArea="name" minInlineSize="0">
				<TokenName elementType="p" token={token} typography="label" />
				<TokenVariable elementType="p" token={token} typography="caption" />
			</Stack>
			<Box gridArea="value" minInlineSize="0">
				<TokenValue elementType="p" token={token} typography="label" />
			</Box>
			<Box gridArea="copy" justifySelf="end">
				<TokenCopyButton token={token} />
			</Box>
		</Grid>
	);
}

/** A grid of token tiles, for samples that need room, such as shadows and radii. */
export function TokenTileGrid({
	children,
	labelledBy,
}: {
	children: ReactNode;
	labelledBy?: string;
}) {
	return (
		<Grid
			aria-labelledby={labelledBy}
			className={cx('not-prose', styles.list)}
			columns="repeat(auto-fill, minmax(min(16rem, 100%), 1fr))"
			columnGap="sp16"
			elementType="ul"
			margin="0"
			padding="0"
			rowGap="sp24"
		>
			{children}
		</Grid>
	);
}

interface TokenTileProps {
	/** When to use the token, in a few words. */
	note?: string;
	/** A picture of the value, drawn on a subdued stage. Hidden from assistive technology. */
	sample: ReactNode;
	token: ThemeToken;
}

/**
 * One token as a tile: a sample on a subdued stage, then its name, value, and copy button, each on
 * its own line so a narrow tile never splits a value.
 */
export function TokenTile({ note, sample, token }: TokenTileProps) {
	return (
		<Box
			borderRadius="surface"
			className={styles.tile}
			display="flex"
			elementType="li"
			flexDirection="column"
			gap="sp12"
			id={tokenRowId(token.path)}
			padding="sp8"
		>
			<Box
				alignItems="center"
				aria-hidden
				backgroundColor="surface.subdued"
				borderRadius="surface"
				display="flex"
				justifyContent="center"
				minBlockSize="7rem"
				padding="sp16"
			>
				{sample}
			</Box>
			<Stack gap="sp8">
				<TokenName elementType="p" token={token} typography="label" />
				<TokenVariable elementType="p" token={token} typography="caption" />
				{note ? (
					<Text color="secondary" elementType="p" typography="caption">
						{note}
					</Text>
				) : null}
				<TokenValue elementType="p" token={token} typography="label" />
				{/* The button's own inline padding pulls its icon in, so bleed by it to line up with the text. */}
				<Bleed inlineStart="sp12">
					<TokenCopyButton token={token} />
				</Bleed>
			</Stack>
		</Box>
	);
}
