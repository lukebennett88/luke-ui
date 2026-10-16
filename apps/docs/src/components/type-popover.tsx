import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { use } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import type { TypeDefinitionsLoadState } from '../lib/type-definitions-load-state.js';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/** Links the root alias when a definition is available or loadable. */
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

/**
 * Clickable type name that reveals its source-backed TypeScript definition. Prefetches the page
 * asset on hover/focus; DialogTrigger stays uncontrolled so Escape restores focus.
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
			<Button
				appearance="text"
				aria-label={`Show definition of ${typeName}`}
				className={styles.trigger}
				onFocus={prefetch}
				onHoverStart={prefetch}
				onPress={prefetch}
			>
				{children}
			</Button>
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
		return (
			<Text className={styles.definition} elementType="pre" typography="caption">
				{definition}
			</Text>
		);
	}

	switch (load.status) {
		case 'error':
			return (
				<Stack gap="sp8">
					<Text color="secondary" typography="caption">
						{load.message}
					</Text>
					<Button
						aria-label="Retry loading definition"
						prominence="low"
						size="small"
						onPress={() => {
							void ensureLoaded();
						}}
					>
						Retry
					</Button>
				</Stack>
			);
		case 'ready':
			return (
				<Text color="secondary" typography="caption">
					Definition not available.
				</Text>
			);
		case 'idle':
		case 'loading':
			return (
				<Text className={styles.definition} elementType="pre" typography="caption">
					Loading definition…
				</Text>
			);
	}
}
