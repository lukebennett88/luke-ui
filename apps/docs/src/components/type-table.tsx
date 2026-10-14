import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Grid } from '@luke-ui/react/grid';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ReactNode } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import * as styles from './type-table.css.js';

/** Prop name / type columns shared by the header and each row trigger. */
const PROP_TYPE_COLUMNS = '1fr 3fr';

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
 * Expandable prop/type reference table. Keeps the generated `TypeNode` contract; styling is
 * docs-local. Row labels use non-paragraph elements so MDX descriptions cannot nest `<p>` in `<p>`.
 */
export function TypeTable({
	className,
	id,
	type,
	...props
}: {
	type: Record<string, TypeNode>;
} & ComponentProps<'div'>) {
	return (
		<Box
			{...props}
			backgroundColor="surface.base"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			className={cx(styles.root, 'not-prose', className)}
			display="flex"
			flexDirection="column"
			gap="sp4"
			id={id}
			maxInlineSize="100%"
			overflow="hidden"
			padding="sp4"
		>
			<Grid
				alignItems="center"
				columnGap="sp8"
				columns={PROP_TYPE_COLUMNS}
				paddingBlock="sp4"
				paddingInline="sp12"
			>
				<Text color="secondary" elementType="span" fontWeight="label" typography="caption">
					Prop
				</Text>
				<Text
					className={styles.typeColumn}
					color="secondary"
					elementType="span"
					fontWeight="label"
					typography="caption"
				>
					Type
				</Text>
			</Grid>
			{Object.entries(type).map(([name, item]) => (
				<TypeTableRow item={item} key={name} name={name} parentId={id} />
			))}
		</Box>
	);
}

function TypeTableRow({
	item,
	name,
	parentId,
}: {
	item: TypeNode;
	name: string;
	parentId: string | undefined;
}) {
	const rowId = parentId === undefined ? undefined : `${parentId}-${name}`;
	const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);
	// `null` means the reader has not toggled yet, so a matching URL hash can open the row.
	const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
	const isExpanded = userExpanded ?? (rowId !== undefined && hash === `#${rowId}`);

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

	return (
		<Box
			className={styles.row}
			overflow="hidden"
			renderRoot={(domProps) => (
				<Disclosure
					{...domProps}
					id={rowId}
					isExpanded={isExpanded}
					onExpandedChange={(next) => {
						if (next && rowId !== undefined) {
							window.history.replaceState(null, '', `#${rowId}`);
						}
						setUserExpanded(next);
					}}
				/>
			)}
		>
			<Box
				className={styles.trigger}
				inlineSize="100%"
				paddingBlock="sp8"
				paddingInline="sp12"
				renderRoot={(domProps) => <RacButton {...domProps} slot="trigger" />}
			>
				<Track
					gap="sp8"
					railAlignment="center"
					railEnd={<Icon aria-hidden className={styles.chevron} name="chevronDown" size="xsmall" />}
				>
					<Grid alignItems="center" columnGap="sp8" columns={PROP_TYPE_COLUMNS} minInlineSize="0">
						<Code className={cx(styles.propName, deprecated && styles.propNameDeprecated)}>
							{name}
							{required ? null : '?'}
						</Code>
						<span className={styles.typeColumn}>
							{typeDescriptionLink === undefined ? (
								type
							) : (
								<Link appearance="text" className={styles.propTypeLink} href={typeDescriptionLink}>
									{type}
								</Link>
							)}
						</span>
					</Grid>
				</Track>
			</Box>
			<DisclosurePanel>
				<Grid
					className={styles.panel}
					columns={PROP_TYPE_COLUMNS}
					gap="sp16"
					overflow="auto"
					padding="sp12"
				>
					{description === undefined || description === null || description === '' ? null : (
						<Box className={styles.description} gridColumn="1 / -1">
							{description}
						</Box>
					)}
					{typeDescription === undefined ? null : (
						<>
							<FieldLabel>Type</FieldLabel>
							<Box alignSelf="center" minInlineSize="0">
								{typeDescription}
							</Box>
						</>
					)}
					{defaultValue === undefined ? null : (
						<>
							<FieldLabel>Default</FieldLabel>
							<Box alignSelf="center" minInlineSize="0">
								{defaultValue}
							</Box>
						</>
					)}
					{parameters.length === 0 ? null : (
						<>
							<FieldLabel>Parameters</FieldLabel>
							<Stack gap="sp8">
								{parameters.map((param) => (
									<Track
										gap="sp4"
										key={param.name}
										railAlignment="center"
										railStart={
											<Text elementType="span" fontWeight="label" style={{ whiteSpace: 'nowrap' }}>
												{param.name} -
											</Text>
										}
									>
										<Box minInlineSize="0">{param.description}</Box>
									</Track>
								))}
							</Stack>
						</>
					)}
					{returns === undefined ? null : (
						<>
							<FieldLabel>Returns</FieldLabel>
							<Box alignSelf="center" minInlineSize="0">
								{returns}
							</Box>
						</>
					)}
				</Grid>
			</DisclosurePanel>
		</Box>
	);
}

function FieldLabel({ children }: { children: ReactNode }) {
	return (
		<Box paddingInlineEnd="sp8">
			<Text color="secondary" elementType="div" typography="caption">
				{children}
			</Text>
		</Box>
	);
}

function subscribeToHash(onStoreChange: () => void) {
	window.addEventListener('hashchange', onStoreChange);
	return () => {
		window.removeEventListener('hashchange', onStoreChange);
	};
}

function getHashSnapshot() {
	return window.location.hash;
}

function getServerHashSnapshot() {
	return '';
}
