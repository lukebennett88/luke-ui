import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Code } from '@luke-ui/react/code';
import { IconButton } from '@luke-ui/react/icon-button';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import type { TokenSections } from '../lib/token-grammar.js';
import { tokenSections } from '../lib/token-grammar.js';
import { tokenRowId } from '../lib/token-navigation.js';
import type { ClipboardFeedbackStatus } from '../lib/use-clipboard-feedback.js';
import { useClipboardFeedback } from '../lib/use-clipboard-feedback.js';
import { useTokenValue } from '../lib/use-token-value.js';
import { TableCell, TableColumn, TableHeaderCell } from './reference-table.js';
import {
	TokenColumnHeader,
	TokenGroup,
	TokenPanel,
	TokenPath,
	TokenRow,
} from './token-reference-parts.js';
import * as styles from './token-reference.css.js';

type TypeStyleRow = TokenSections['typography']['styles'][number];
type TypeStyleName = TypeStyleRow['style'];
type TypeProperty = keyof TypeStyleRow['tokens'];

/** Every type style as a specimen, followed by its five tokens and resolved values. */
export function TypeStyleTable() {
	const { announcement, copy, status } = useClipboardFeedback<string>();

	return (
		<Box className="not-prose" marginBlockStart="sp24">
			<TokenColumnHeader />
			<Box className={styles.panelBody}>
				<Box className={styles.typeFrame}>
					<Box
						className={styles.typeTable}
						inlineSize="100%"
						renderRoot={(domProps) => <table {...domProps} />}
					>
						<caption>
							<VisuallyHidden>
								Type styles, smallest first. Use each row's copy control to copy its token.
							</VisuallyHidden>
						</caption>
						<colgroup>
							<TableColumn />
							<TableColumn inlineSize="13rem" />
						</colgroup>
						<Box className={styles.typeHead} renderRoot={(domProps) => <thead {...domProps} />}>
							<tr>
								<TypeHeaderCell>Token</TypeHeaderCell>
								<TypeHeaderCell>Value</TypeHeaderCell>
							</tr>
						</Box>
						{tokenSections.typography.styles.map((row) => (
							<Box
								className={styles.typeGroup}
								key={row.style}
								renderRoot={(domProps) => <tbody {...domProps} />}
							>
								<tr className={styles.typeSpecimenRow}>
									<Box
										className={styles.typeSpecimen}
										paddingInline="sp16"
										renderRoot={(domProps) => <th {...domProps} colSpan={2} scope="rowgroup" />}
									>
										<Text typography={row.style}>{TYPE_STYLE_LABELS[row.style]}</Text>
									</Box>
								</tr>
								{TYPE_COLUMNS.map((property) => (
									<TypeValueRow
										key={property}
										onCopy={(token, text) => void copy(token.path, text)}
										status={status}
										token={row.tokens[property]}
									/>
								))}
							</Box>
						))}
					</Box>
				</Box>
			</Box>
			<VisuallyHidden aria-live="polite" elementType="p">
				{announcement}
			</VisuallyHidden>
		</Box>
	);
}

/** The font families and weights the type styles resolve from, each with a sample. */
export function FontFamilyAndWeightTokens() {
	const { families, weights } = tokenSections.typography;
	return (
		<TokenPanel sampleInlineSize="3rem">
			<TokenGroup label="Families">
				{families.map((token) => (
					<TokenRow
						key={token.path}
						sample={<FontSample style={{ fontFamily: `var(${token.variable})` }} />}
						sampleInlineSize="3rem"
						token={token}
					/>
				))}
			</TokenGroup>
			<TokenGroup label="Weights">
				{weights.map((token) => (
					<TokenRow
						key={token.path}
						sample={<FontSample style={{ fontWeight: `var(${token.variable})` }} />}
						sampleInlineSize="3rem"
						token={token}
					/>
				))}
			</TokenGroup>
		</TokenPanel>
	);
}

function FontSample({ style }: { style: { fontFamily?: string; fontWeight?: string } }) {
	return (
		<Text shouldDisableTrim style={style} typography="heading4">
			Aa
		</Text>
	);
}

const TYPE_STYLE_LABELS: Record<TypeStyleName, string> = {
	body: 'Body',
	caption: 'Caption',
	display: 'Display',
	heading1: 'Heading 1',
	heading2: 'Heading 2',
	heading3: 'Heading 3',
	heading4: 'Heading 4',
	label: 'Label',
	lead: 'Lead',
};

/** Token properties, in reading order. */
const TYPE_COLUMNS: ReadonlyArray<TypeProperty> = [
	'fontSize',
	'lineHeight',
	'fontWeight',
	'letterSpacing',
	'fontFamily',
];

function TypeHeaderCell({ children }: { children: string }) {
	return (
		<TableHeaderCell
			className={styles.typeCell}
			paddingBlock="sp8"
			paddingInline="sp16"
			scope="col"
		>
			<Text color="secondary" fontWeight="label" typography="label">
				{children}
			</Text>
		</TableHeaderCell>
	);
}

interface TypeValueRowProps {
	onCopy: (token: ThemeToken, text: string) => void;
	status: ClipboardFeedbackStatus<string> | null;
	token: ThemeToken;
}

/** One type token, with its value and a single control for copying its typed path. */
function TypeValueRow({ onCopy, status, token }: TypeValueRowProps) {
	const value = useTokenValue(token);
	const text = `vars.${token.path}`;
	const state = status?.key === token.path ? status.state : null;

	return (
		<tr className={styles.typeRow}>
			<Box
				className={cx(styles.typeCell, styles.typeNameCell)}
				paddingInline="sp16"
				renderRoot={(domProps) => <th {...domProps} id={tokenRowId(token.path)} scope="row" />}
			>
				<Cluster alignItems="center" gap="sp8" minInlineSize="0">
					<Box className={styles.tokenIdentification} minInlineSize="0">
						<Text elementType="p" shouldDisableTrim typography="label">
							<TokenPath path={token.path} />
						</Text>
					</Box>
					<IconButton
						aria-label={`Copy ${text}`}
						icon={COPY_ICONS[state ?? 'idle']}
						onPress={() => {
							onCopy(token, text);
						}}
						prominence="low"
						size="px32"
						tone="neutral"
					/>
				</Cluster>
			</Box>
			<TableCell className={cx(styles.typeCell, styles.typeValueCell)} paddingInline="sp16">
				<Text fontVariantNumeric="tabular-nums" shouldDisableTrim typography="label">
					<Code>{value === null || value === '' ? '—' : value}</Code>
				</Text>
			</TableCell>
		</tr>
	);
}

const COPY_ICONS = {
	copied: 'check',
	error: 'close',
	idle: 'copy',
} as const;
