import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { Button as RacButton } from 'react-aria-components/Button';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import type { TokenSections } from '../lib/token-grammar.js';
import { tokenSections } from '../lib/token-grammar.js';
import { tokenRowId } from '../lib/token-navigation.js';
import type { ClipboardFeedbackStatus } from '../lib/use-clipboard-feedback.js';
import { useClipboardFeedback } from '../lib/use-clipboard-feedback.js';
import { useTokenValue } from '../lib/use-token-value.js';
import { TableCell, TableColumn, TableHeaderCell } from './reference-table.js';
import { TokenGroup, TokenPanel, TokenPath, TokenRow } from './token-reference-parts.js';
import * as styles from './token-reference.css.js';

type TypeCopyTarget = 'path' | 'variable';
type TypeCopyKey = `${string}:${TypeCopyTarget}`;

type TypeStyleRow = TokenSections['typography']['styles'][number];
type TypeStyleName = TypeStyleRow['style'];
type TypeProperty = keyof TypeStyleRow['tokens'];

/** Every type style as a specimen, followed by its five tokens and resolved values. */
export function TypeStyleTable() {
	const { announcement, copy, status } = useClipboardFeedback<TypeCopyKey>();

	return (
		<Box className={cx('not-prose', styles.typeFrame)} marginBlockStart="sp24">
			<Box
				borderColor="decorative"
				borderRadius="surface"
				borderStyle="solid"
				borderWidth="thin"
				className={styles.typeTable}
				inlineSize="100%"
				overflow="hidden"
				renderRoot={(domProps) => <table {...domProps} />}
			>
				<caption>
					<VisuallyHidden>
						Type styles, smallest first. Use each row's copy controls to copy its typed path or CSS
						variable.
					</VisuallyHidden>
				</caption>
				<colgroup>
					<TableColumn />
					<TableColumn inlineSize="1%" />
					<TableColumn inlineSize="1%" />
				</colgroup>
				<Box
					backgroundColor="surface.subdued"
					className={styles.typeHead}
					renderRoot={(domProps) => <thead {...domProps} />}
				>
					<tr>
						<TypeHeaderCell>Token</TypeHeaderCell>
						<TypeHeaderCell>Value</TypeHeaderCell>
						<TypeHeaderCell isVisuallyHidden>Copy</TypeHeaderCell>
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
								renderRoot={(domProps) => <th {...domProps} colSpan={3} scope="rowgroup" />}
							>
								<Text typography={row.style}>{TYPE_STYLE_LABELS[row.style]}</Text>
							</Box>
						</tr>
						{TYPE_COLUMNS.map((property) => (
							<TypeValueRow
								key={property}
								onCopy={(key, text) => void copy(key, text)}
								status={status}
								token={row.tokens[property]}
							/>
						))}
					</Box>
				))}
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
		<TokenPanel>
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

function TypeHeaderCell({
	children,
	isVisuallyHidden = false,
}: {
	children: string;
	isVisuallyHidden?: boolean;
}) {
	return (
		<TableHeaderCell
			className={cx(styles.typeCell, isVisuallyHidden && styles.typeCopyHeader)}
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
	onCopy: (key: TypeCopyKey, text: string) => void;
	status: ClipboardFeedbackStatus<TypeCopyKey> | null;
	token: ThemeToken;
}

/** One type token, with its value and controls for copying its typed path or CSS variable. */
function TypeValueRow({ onCopy, status, token }: TypeValueRowProps) {
	const value = useTokenValue(token);
	const pathText = `vars.${token.path}`;
	const pathKey: TypeCopyKey = `${token.path}:path`;
	const variableKey: TypeCopyKey = `${token.path}:variable`;

	return (
		<tr className={styles.typeRow}>
			<Box
				className={cx(styles.typeCell, styles.typeNameCell)}
				paddingInline="sp16"
				renderRoot={(domProps) => <th {...domProps} id={tokenRowId(token.path)} scope="row" />}
			>
				<Stack gap="sp4">
					<Text className={styles.code} elementType="p" shouldDisableTrim typography="label">
						<TokenPath path={token.path} />
					</Text>
					<Text
						className={styles.code}
						color="secondary"
						elementType="p"
						shouldDisableTrim
						typography="caption"
					>
						{token.variable}
					</Text>
				</Stack>
			</Box>
			<TableCell className={cx(styles.typeCell, styles.typeValueCell)} paddingInline="sp16">
				<Text fontVariantNumeric="tabular-nums" typography="label">
					{value === null || value === '' ? '—' : value}
				</Text>
			</TableCell>
			<TableCell
				className={cx(styles.typeCell, styles.typeActionCell)}
				paddingBlock="sp4"
				paddingInline="sp4"
			>
				<Cluster gap="sp4" justifyContent="end">
					<TypeCopyButton
						accessibleName={`Copy ${pathText}`}
						idleLabel="vars"
						onCopy={() => {
							onCopy(pathKey, pathText);
						}}
						state={status?.key === pathKey ? status.state : null}
					/>
					<TypeCopyButton
						accessibleName={`Copy CSS ${token.variable}`}
						idleLabel="CSS"
						onCopy={() => {
							onCopy(variableKey, token.variable);
						}}
						state={status?.key === variableKey ? status.state : null}
					/>
				</Cluster>
			</TableCell>
		</tr>
	);
}

function TypeCopyButton({
	accessibleName,
	idleLabel,
	onCopy,
	state,
}: {
	accessibleName: string;
	idleLabel: string;
	onCopy: () => void;
	state: 'copied' | 'error' | null;
}) {
	const label = (() => {
		if (state === 'copied') return 'Copied';
		if (state === 'error') return 'Failed';
		return idleLabel;
	})();

	return (
		<Box
			alignItems="center"
			className={styles.typeCopyButton}
			display="flex"
			gap="sp4"
			justifyContent="center"
			minBlockSize={vars.space.sp32}
			minInlineSize={vars.space.sp32}
			paddingInline="sp4"
			renderRoot={(domProps) => (
				<RacButton
					{...domProps}
					aria-label={accessibleName}
					onPress={() => {
						onCopy();
					}}
				/>
			)}
		>
			<Icon aria-hidden name={COPY_ICONS[state ?? 'idle']} size="xsmall" />
			<Text fontWeight="label" typography="caption">
				{label}
			</Text>
		</Box>
	);
}

const COPY_ICONS = {
	copied: 'check',
	error: 'close',
	idle: 'copy',
} as const;
