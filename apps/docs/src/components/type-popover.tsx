'use client';

import type { ReactNode } from 'react';
import { use, useCallback, useRef } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/**
 * Clickable type name that reveals its source-backed TypeScript definition in an accessible
 * popover. Prefetches the page-level definition asset on hover/focus when missing from context.
 * DialogTrigger stays uncontrolled; after the dialog unmounts we ensure focus returns to the
 * trigger (RAC FocusScope restores in a rAF, which can lose to CI timing).
 */
function TypePopover({ children, typeName }: { children: ReactNode; typeName: string }) {
	const { definitions, ensureLoaded } = use(TypeDefinitionsContext);
	const definition = definitions[typeName];
	const triggerRef = useRef<HTMLButtonElement | null>(null);

	const prefetch = () => {
		if (definitions[typeName] !== undefined) return;
		void ensureLoaded();
	};

	const restoreTriggerFocus = useCallback(() => {
		const node = triggerRef.current;
		if (!node?.isConnected) return;
		const active = document.activeElement;
		// Unmount may leave focus on the detaching dialog node or already on <body>.
		if (active === document.body || active == null || !active.isConnected) {
			node.focus();
			return;
		}
		requestAnimationFrame(() => {
			if (node.isConnected && document.activeElement === document.body) {
				node.focus();
			}
		});
	}, []);

	// React 19 callback-ref cleanup runs when the dialog unmounts after its exit animation.
	const dialogExitRef = useCallback(() => restoreTriggerFocus, [restoreTriggerFocus]);

	return (
		<DialogTrigger>
			<RacButton
				ref={triggerRef}
				aria-label={`Show definition of ${typeName}`}
				className={styles.trigger}
				onFocus={prefetch}
				onHoverStart={prefetch}
				onPress={prefetch}
			>
				{children}
			</RacButton>
			<Popover className={styles.popover} placement="bottom start">
				<Dialog
					ref={dialogExitRef}
					aria-label={`Definition of ${typeName}`}
					className={styles.dialog}
				>
					<pre className={styles.definition}>
						{definition?.definition ?? 'Loading definition…'}
					</pre>
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
