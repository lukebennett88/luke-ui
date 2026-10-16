'use client';

import type { ReactNode } from 'react';
import { use } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/**
 * Clickable type name that reveals its source-backed TypeScript definition in an accessible
 * popover. Prefetches the page-level definition asset on hover/focus when missing from context;
 * RAC keeps an uncontrolled DialogTrigger so Escape restores focus to the trigger.
 */
function TypePopover({ children, typeName }: { children: ReactNode; typeName: string }) {
	const { definitions, ensureLoaded, loadError, loadStatus } = use(TypeDefinitionsContext);
	const definition = definitions[typeName];

	const prefetch = () => {
		if (definitions[typeName] !== undefined) return;
		// ensureLoaded settles without throwing; still attach catch so a future change cannot leave
		// an unhandled rejection from this fire-and-forget path.
		void ensureLoaded().catch(() => {});
	};

	return (
		<DialogTrigger>
			<RacButton
				aria-label={`Show definition of ${typeName}`}
				className={styles.trigger}
				onFocus={prefetch}
				onHoverStart={prefetch}
				onPress={prefetch}
			>
				{children}
			</RacButton>
			<Popover className={styles.popover} placement="bottom start">
				<Dialog aria-label={`Definition of ${typeName}`} className={styles.dialog}>
					{definition !== undefined ? (
						<pre className={styles.definition}>{definition.definition}</pre>
					) : loadStatus === 'error' ? (
						<div className={styles.loadError}>
							<p className={styles.loadErrorMessage}>
								{loadError ?? "Couldn't load this definition."}
							</p>
							<RacButton
								aria-label="Retry loading definition"
								className={styles.retry}
								onPress={() => {
									void ensureLoaded().catch(() => {});
								}}
							>
								Retry
							</RacButton>
						</div>
					) : loadStatus === 'ready' ? (
						<p className={styles.loadErrorMessage}>Definition not available.</p>
					) : (
						<pre className={styles.definition}>Loading definition…</pre>
					)}
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
