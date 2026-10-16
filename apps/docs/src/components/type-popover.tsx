'use client';

import type { ReactNode } from 'react';
import { use, useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import type { TypeDefinition } from '../lib/type-definition-model.js';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/**
 * Clickable type name that reveals its source-backed TypeScript definition in an accessible
 * popover. Loads the page-level definition asset on first open when it is not already in memory.
 */
function TypePopover({ children, typeName }: { children: ReactNode; typeName: string }) {
	const { definitions, ensureLoaded } = use(TypeDefinitionsContext);
	const [definition, setDefinition] = useState<TypeDefinition | undefined>(
		() => definitions[typeName],
	);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DialogTrigger
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (open) {
					void ensureLoaded().then((loaded) => {
						setDefinition(loaded[typeName]);
						setIsOpen(true);
					});
					return;
				}
				setIsOpen(false);
			}}
		>
			<RacButton aria-label={`Show definition of ${typeName}`} className={styles.trigger}>
				{children}
			</RacButton>
			<Popover className={styles.popover} placement="bottom start">
				<Dialog aria-label={`Definition of ${typeName}`} className={styles.dialog}>
					<pre className={styles.definition}>{definition?.definition ?? 'Loading definition…'}</pre>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

/** Renders a prop type, linking the root alias when a definition is available or loadable. */
export function LinkedType({
	children,
	typeName,
}: {
	children: ReactNode;
	typeName: string | undefined;
}) {
	const { canLink } = use(TypeDefinitionsContext);
	if (typeName === undefined || !canLink(typeName)) return children;
	return <TypePopover typeName={typeName}>{children}</TypePopover>;
}
