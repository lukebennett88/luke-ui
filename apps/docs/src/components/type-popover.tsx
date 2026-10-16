import { Stack } from '@luke-ui/react/stack';
import type { ReactNode } from 'react';
import { use } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import type { TypeDefinitionsLoadState } from './type-definitions-context.js';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/**
 * Clickable type name that reveals its source-backed TypeScript definition in an accessible
 * popover. Prefetches the page-level definition asset on hover/focus when missing from context;
 * RAC keeps an uncontrolled DialogTrigger so Escape restores focus to the trigger.
 */
function TypePopover({ children, typeName }: { children: ReactNode; typeName: string }) {
	const context = use(TypeDefinitionsContext);
	if (context === null) return children;

	const { definitions, ensureLoaded, load } = context;
	const definition = definitions[typeName];

	const prefetch = () => {
		if (definitions[typeName] !== undefined) return;
		void ensureLoaded();
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
					<TypePopoverBody
						definition={definition?.definition}
						ensureLoaded={ensureLoaded}
						load={load}
					/>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

function TypePopoverBody({
	definition,
	ensureLoaded,
	load,
}: {
	definition: string | undefined;
	ensureLoaded: () => Promise<void>;
	load: TypeDefinitionsLoadState;
}) {
	if (definition !== undefined) {
		return <pre className={styles.definition}>{definition}</pre>;
	}

	switch (load.status) {
		case 'error':
			return (
				<Stack gap="sp8">
					<p className={styles.statusMessage}>{load.message}</p>
					<RacButton
						aria-label="Retry loading definition"
						className={styles.retry}
						onPress={() => {
							void ensureLoaded();
						}}
					>
						Retry
					</RacButton>
				</Stack>
			);
		case 'ready':
			return <p className={styles.statusMessage}>Definition not available.</p>;
		case 'idle':
		case 'loading':
			return <pre className={styles.definition}>Loading definition…</pre>;
	}
}

/** Renders a prop type, linking the root alias when a definition is available or loadable. */
export function LinkedType({
	children,
	typeName,
}: {
	children: ReactNode;
	typeName: string | undefined;
}) {
	const context = use(TypeDefinitionsContext);
	if (context === null || typeName === undefined || !context.canLink(typeName)) {
		return children;
	}
	return <TypePopover typeName={typeName}>{children}</TypePopover>;
}
