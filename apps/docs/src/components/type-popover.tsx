import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import { use } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import type { TypeDefinitionsContextValue } from './type-definitions-context.js';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/**
 * Opens a type's source definition, and what it resolves to, when the table's definitions asset holds
 * them.
 */
export function LinkedType({ children, typeName }: { children: ReactNode; typeName: string }) {
	const typeDefinitions = use(TypeDefinitionsContext);
	if (typeDefinitions === null || !typeDefinitions.names.has(typeName)) return children;

	const { ensureLoaded, load } = typeDefinitions;

	// The visible type, generic arguments included, names the trigger. It loads the asset on hover,
	// focus, or press. DialogTrigger stays uncontrolled so React Aria returns focus to the trigger
	// when the popover closes.
	return (
		<DialogTrigger>
			<Button
				appearance="text"
				className={styles.trigger}
				onFocus={ensureLoaded}
				onHoverStart={ensureLoaded}
				onPress={ensureLoaded}
			>
				{children}
			</Button>
			<Popover className={styles.popover} placement="bottom start">
				<Dialog aria-label={`Definition of ${typeName}`} className={styles.dialog}>
					<DefinitionBody ensureLoaded={ensureLoaded} load={load} typeName={typeName} />
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

function DefinitionBody({
	ensureLoaded,
	load,
	typeName,
}: Pick<TypeDefinitionsContextValue, 'ensureLoaded' | 'load'> & { typeName: string }) {
	switch (load.status) {
		case 'idle':
		case 'loading':
			return (
				<Text className={styles.definition} elementType="pre" typography="caption">
					Loading definition…
				</Text>
			);
		case 'error':
			return (
				<Stack gap="sp8">
					<Text color="secondary" typography="caption">
						{load.message}
					</Text>
					<Button onPress={ensureLoaded} prominence="low" size="px32">
						Retry
					</Button>
				</Stack>
			);
		case 'ready': {
			const { definition, resolved } = load.data[typeName] ?? {};
			if (definition === undefined && resolved === undefined) {
				return (
					<Text color="secondary" typography="caption">
						Definition not available.
					</Text>
				);
			}
			// The same text, in the same order, as the type definitions in the page's Markdown.
			return (
				<Stack gap="sp8">
					{definition === undefined ? null : (
						<Text className={styles.definition} elementType="pre" typography="caption">
							{definition}
						</Text>
					)}
					{resolved === undefined ? null : (
						<Stack gap="sp4">
							<Text color="secondary" typography="caption">
								{definition === undefined ? 'Resolves to:' : 'Which resolves to:'}
							</Text>
							<Text className={styles.definition} elementType="pre" typography="caption">
								{resolved}
							</Text>
						</Stack>
					)}
				</Stack>
			);
		}
	}
}
