'use client';

import type { ReactNode } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import type { TypeDefinition } from '../lib/type-definition-model.js';
import * as styles from './type-popover.css.js';

/**
 * Clickable type name that reveals its source-backed TypeScript definition in an accessible
 * popover. Follows React Aria's TypePopover pattern with Luke UI docs chrome.
 */
function TypePopover({
	children,
	definition,
}: {
	children: ReactNode;
	definition: TypeDefinition;
}) {
	return (
		<DialogTrigger>
			<RacButton aria-label={`Show definition of ${definition.name}`} className={styles.trigger}>
				{children}
			</RacButton>
			<Popover className={styles.popover} placement="bottom start">
				<Dialog aria-label={`Definition of ${definition.name}`} className={styles.dialog}>
					<pre className={styles.definition}>{definition.definition}</pre>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

/** Renders a prop type, linking the root alias when a definition is available. */
export function LinkedType({
	children,
	definitions,
	typeName,
}: {
	children: ReactNode;
	definitions: Readonly<Record<string, TypeDefinition>>;
	typeName: string | undefined;
}) {
	if (typeName === undefined) return children;
	const definition = definitions[typeName];
	if (definition === undefined) return children;
	return <TypePopover definition={definition}>{children}</TypePopover>;
}
