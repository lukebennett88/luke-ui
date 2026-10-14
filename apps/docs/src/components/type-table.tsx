import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import * as disclosureStyles from './docs-disclosure.css.js';
import * as styles from './type-table.css.js';

interface ParameterNode {
	description: ReactNode;
	name: string;
}

/** Field shape produced by `fumadocs-typescript` / `remarkAutoTypeTable`. */
export interface TypeNode {
	default?: ReactNode;
	deprecated?: boolean;
	description?: ReactNode;
	parameters?: Array<ParameterNode>;
	required?: boolean;
	returns?: ReactNode;
	type: ReactNode;
	typeDescription?: ReactNode;
	typeDescriptionLink?: string;
}

/**
 * Expandable prop/type reference list. Keeps the generated `TypeNode` contract. Types stay visible
 * in every row at every width; `typeDescriptionLink` opens in the panel so it is never nested
 * inside the disclosure button. Row labels avoid paragraphs so MDX cannot nest `<p>` in `<p>`.
 */
export function TypeTable({
	className,
	id,
	rowIdPrefix,
	type,
	...props
}: {
	/**
	 * Prefix for hash-openable row ids (`${prefix}-${propName}`). Defaults to `id`. Pass this from
	 * `ComponentPropsTable` so grouped tables share one hash namespace without duplicate DOM ids.
	 */
	rowIdPrefix?: string;
	type: Record<string, TypeNode>;
} & ComponentProps<'div'>) {
	const hashPrefix = rowIdPrefix ?? id;

	return (
		<Stack
			{...props}
			className={cx(styles.root, 'not-prose', className)}
			id={id}
			maxInlineSize="100%"
		>
			{Object.entries(type).map(([name, item]) => (
				<TypeTableRow hashPrefix={hashPrefix} item={item} key={name} name={name} />
			))}
		</Stack>
	);
}

function TypeTableRow({
	hashPrefix,
	item,
	name,
}: {
	hashPrefix: string | undefined;
	item: TypeNode;
	name: string;
}) {
	const rowId = hashPrefix === undefined ? undefined : `${hashPrefix}-${name}`;
	const navigate = useNavigate();
	const hash = useRouterState({ select: (state) => state.location.hash });
	// `null` means the reader has not toggled yet, so a matching URL hash can open the row.
	const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
	const isExpanded = userExpanded ?? (rowId !== undefined && hash === rowId);

	const {
		default: defaultValue,
		deprecated = false,
		description,
		parameters = [],
		required = false,
		returns,
		type,
		typeDescription,
		typeDescriptionLink,
	} = item;

	// Generator often puts a short kind (e.g. "union") in `type` and the readable signature in
	// `typeDescription`. Prefer the signature in the trigger so types stay discoverable collapsed.
	const triggerType = typeDescription ?? type;
	// Panel Type row is only for the link — the signature already sits in the trigger.
	const showTypeLink = typeDescriptionLink !== undefined;

	return (
		<Box
			className={styles.row}
			renderRoot={(domProps) => (
				<Disclosure
					{...domProps}
					id={rowId}
					isExpanded={isExpanded}
					onExpandedChange={(next) => {
						if (next && rowId !== undefined) {
							void navigate({ hash: rowId, replace: true });
						}
						setUserExpanded(next);
					}}
				/>
			)}
		>
			<Box
				className={disclosureStyles.trigger}
				inlineSize="100%"
				paddingBlock="sp8"
				paddingInline="sp4"
				renderRoot={(domProps) => <RacButton {...domProps} slot="trigger" />}
			>
				<Track
					gap="sp8"
					railAlignment="firstLine"
					railEnd={
						<Icon
							aria-hidden
							className={disclosureStyles.chevronDown}
							name="chevronDown"
							size="xsmall"
						/>
					}
				>
					<Stack gap="sp4" minInlineSize="0">
						<Code className={cx(styles.propName, deprecated && styles.propNameDeprecated)}>
							{name}
							{required ? null : '?'}
						</Code>
						{/* Plain text only — links belong in the panel. */}
						<Text className={styles.propType} color="secondary" typography="caption">
							{triggerType}
						</Text>
					</Stack>
				</Track>
			</Box>
			<DisclosurePanel>
				<Stack gap="sp8" paddingBlock="sp8" paddingInline="sp4" paddingInlineStart="sp8">
					{description === undefined || description === null || description === '' ? null : (
						<Box>{description}</Box>
					)}
					{showTypeLink ? (
						<DetailRow label="Type">
							<Link appearance="text" className={styles.propTypeLink} href={typeDescriptionLink}>
								{typeDescription ?? type}
							</Link>
						</DetailRow>
					) : null}
					{defaultValue === undefined ? null : (
						<DetailRow label="Default">{defaultValue}</DetailRow>
					)}
					{parameters.length === 0 ? null : (
						<DetailRow label="Parameters">
							<Stack gap="sp4">
								{parameters.map((param) => (
									<Track
										gap="sp4"
										key={param.name}
										railAlignment="firstLine"
										railStart={
											<Text fontWeight="label" style={{ whiteSpace: 'nowrap' }}>
												{param.name}
											</Text>
										}
									>
										<Box minInlineSize="0">{param.description}</Box>
									</Track>
								))}
							</Stack>
						</DetailRow>
					)}
					{returns === undefined ? null : <DetailRow label="Returns">{returns}</DetailRow>}
				</Stack>
			</DisclosurePanel>
		</Box>
	);
}

function DetailRow({ children, label }: { children: ReactNode; label: string }) {
	return (
		<Track
			gap="sp12"
			railAlignment="firstLine"
			railStart={
				<Text
					color="secondary"
					fontWeight="label"
					style={{ minInlineSize: '5.5rem' }}
					typography="caption"
				>
					{label}
				</Text>
			}
		>
			<Box minInlineSize="0">{children}</Box>
		</Track>
	);
}
