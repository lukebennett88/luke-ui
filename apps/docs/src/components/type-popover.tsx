import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';
import { createContext, Fragment, use, useRef, useState } from 'react';
import { Breadcrumb, Breadcrumbs } from 'react-aria-components/Breadcrumbs';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Link } from 'react-aria-components/Link';
import { Popover } from 'react-aria-components/Popover';
import type { TypeTokens } from '../lib/type-tokens.js';
import { lineBreakText } from '../lib/type-tokens.js';
import type { TypeDefinitionsContextValue } from './type-definitions-context.js';
import { TypeDefinitionsContext } from './type-definitions-context.js';
import * as styles from './type-popover.css.js';

/** Opens a type in place inside a popover that is already open, as React Aria's type popover does. */
const OpenTypeContext = createContext<((typeName: string) => void) | null>(null);

/**
 * Renders a type the build formatted: syntax colours, line breaks, and each Luke UI type name the
 * table's definitions asset holds as a link to its definition. Plain punctuation gets a line-break
 * opportunity before it, as in React Aria's type renderer.
 */
export function TypeTokensView({ tokens }: { tokens: TypeTokens }) {
	return (
		<span className={styles.tokens}>
			{tokens.map((token, index) => {
				if (typeof token === 'number') return lineBreakText(token);
				if (typeof token === 'string') {
					return (
						<Fragment key={index}>
							<wbr />
							{token}
						</Fragment>
					);
				}
				const [kind, text, typeName] = token;
				if (typeName === undefined) {
					return (
						<span className={styles.tokenKind[kind]} key={index}>
							{text}
						</span>
					);
				}
				return (
					<LinkedType key={index} typeName={typeName}>
						{text}
					</LinkedType>
				);
			})}
		</span>
	);
}

/**
 * A type name that opens its definition, and what it resolves to, when the table's definitions asset
 * holds it. Inside an open popover it opens the definition in place instead.
 */
function LinkedType({ children, typeName }: { children: ReactNode; typeName: string }) {
	const typeDefinitions = use(TypeDefinitionsContext);
	const openType = use(OpenTypeContext);
	if (typeDefinitions === null || !typeDefinitions.names.has(typeName)) {
		return <span className={styles.tokenKind.t}>{children}</span>;
	}

	const triggerClassName = cx(styles.trigger, styles.tokenKind.t);
	if (openType !== null) {
		return (
			<Button appearance="text" className={triggerClassName} onPress={() => openType(typeName)}>
				{children}
			</Button>
		);
	}

	const { ensureLoaded, load } = typeDefinitions;

	// The type name names the trigger. It loads the asset on hover, focus, or press. DialogTrigger
	// stays uncontrolled so React Aria returns focus to the trigger when the popover closes.
	return (
		<DialogTrigger>
			<Button
				appearance="text"
				className={triggerClassName}
				onFocus={ensureLoaded}
				onHoverStart={ensureLoaded}
				onPress={ensureLoaded}
			>
				{children}
			</Button>
			<Popover className={styles.popover} placement="bottom start">
				<DefinitionDialog ensureLoaded={ensureLoaded} load={load} typeName={typeName} />
			</Popover>
		</DialogTrigger>
	);
}

/**
 * The definitions a reader has opened from one trigger, newest last. The breadcrumbs go back to an
 * earlier one. Focus moves to the dialog, whose name says which type it shows.
 */
function DefinitionDialog({
	ensureLoaded,
	load,
	typeName,
}: Pick<TypeDefinitionsContextValue, 'ensureLoaded' | 'load'> & { typeName: string }) {
	const [trail, setTrail] = useState<ReadonlyArray<string>>([typeName]);
	const dialogRef = useRef<HTMLElement>(null);
	const current = trail.at(-1)!;

	function showTrail(nextTrail: ReadonlyArray<string>) {
		setTrail(nextTrail);
		dialogRef.current?.focus();
	}

	return (
		<Dialog aria-label={`Definition of ${current}`} className={styles.dialog} ref={dialogRef}>
			<Stack gap="sp8">
				<Breadcrumbs
					aria-label="Opened types"
					className={styles.breadcrumbs}
					onAction={(index) => showTrail(trail.slice(0, Number(index) + 1))}
				>
					{trail.map((name, index) => (
						<Breadcrumb className={styles.breadcrumb} id={index} key={index}>
							<Link>{name}</Link>
						</Breadcrumb>
					))}
				</Breadcrumbs>
				<OpenTypeContext.Provider value={(name) => showTrail([...trail, name])}>
					<DefinitionBody ensureLoaded={ensureLoaded} load={load} typeName={current} />
				</OpenTypeContext.Provider>
			</Stack>
		</Dialog>
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
					<Button onPress={ensureLoaded} prominence="low" size="small">
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
			// The same tokens, in the same order, as the type definitions in the page's Markdown.
			return (
				<Stack gap="sp8">
					{definition === undefined ? null : (
						<Text className={styles.definition} elementType="pre" typography="caption">
							<TypeTokensView tokens={definition} />
						</Text>
					)}
					{resolved === undefined ? null : (
						<Stack gap="sp4">
							<Text color="secondary" typography="caption">
								{definition === undefined ? 'Resolves to:' : 'Which resolves to:'}
							</Text>
							<Text className={styles.definition} elementType="pre" typography="caption">
								<TypeTokensView tokens={resolved} />
							</Text>
						</Stack>
					)}
				</Stack>
			);
		}
	}
}
