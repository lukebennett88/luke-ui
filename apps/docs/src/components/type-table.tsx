import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ReactNode } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
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
		<div {...props} className={cx(styles.root, 'not-prose', className)} id={id}>
			<div className={styles.header}>
				<span className={styles.headerProp}>Prop</span>
				<span className={styles.headerType}>Type</span>
			</div>
			{Object.entries(type).map(([name, item]) => (
				<TypeTableRow item={item} key={name} name={name} parentId={id} />
			))}
		</div>
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
		<Disclosure
			className={styles.row}
			id={rowId}
			isExpanded={isExpanded}
			onExpandedChange={(next) => {
				if (next && rowId !== undefined) {
					window.history.replaceState(null, '', `#${rowId}`);
				}
				setUserExpanded(next);
			}}
		>
			<RacButton className={styles.trigger} slot="trigger">
				<code className={cx(styles.propName, deprecated && styles.propNameDeprecated)}>
					{name}
					{required ? null : '?'}
				</code>
				<span className={styles.propType}>
					{typeDescriptionLink === undefined ? (
						type
					) : (
						<Link appearance="text" className={styles.propTypeLink} href={typeDescriptionLink}>
							{type}
						</Link>
					)}
				</span>
				<Icon aria-hidden className={styles.chevron} name="chevronDown" size="xsmall" />
			</RacButton>
			<DisclosurePanel>
				<div className={styles.panel}>
					{description === undefined || description === null || description === '' ? null : (
						<div className={styles.description}>{description}</div>
					)}
					{typeDescription === undefined ? null : (
						<>
							<div className={styles.fieldLabel}>Type</div>
							<div className={styles.fieldValue}>{typeDescription}</div>
						</>
					)}
					{defaultValue === undefined ? null : (
						<>
							<div className={styles.fieldLabel}>Default</div>
							<div className={styles.fieldValue}>{defaultValue}</div>
						</>
					)}
					{parameters.length === 0 ? null : (
						<>
							<div className={styles.fieldLabel}>Parameters</div>
							<div className={styles.parameters}>
								{parameters.map((param) => (
									<div className={styles.parameter} key={param.name}>
										<span className={styles.parameterName}>{param.name} -</span>
										<div>{param.description}</div>
									</div>
								))}
							</div>
						</>
					)}
					{returns === undefined ? null : (
						<>
							<div className={styles.fieldLabel}>Returns</div>
							<div className={styles.fieldValue}>{returns}</div>
						</>
					)}
				</div>
			</DisclosurePanel>
		</Disclosure>
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
