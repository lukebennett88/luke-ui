import type { DocEntry } from 'fumadocs-typescript';
import { Project, ts } from 'ts-morph';
import { expect, test } from 'vite-plus/test';
import { enrichGeneratedDocTypes } from './enrich-generated-doc-types.js';

const PACKAGE_DIR = '/repo/packages/@luke-ui/react';

/** Luke UI declarations the props below use, in a package-shaped in-memory project. */
const SOURCE = `
	import type { External } from '../../../../node_modules/external/index';

	export type Prominence = 'low' | 'standard' | 'high';
	export type Tone = 'neutral' | 'critical';
	export type Callback = (value: string) => void;
	export type Wrapped<Value> = Value | { initial: Value };

	interface Inherited {
		/** Inherited from another interface. */
		tone?: Tone;
	}

	interface Shared extends Inherited {
		callback?: Callback | undefined;
		external?: External;
		mixed?: Tone | Callback;
		wrapped?: Wrapped<number>;
	}

	interface LowBranch extends Shared {
		kind: 'low';
		prominence?: 'low' | 'standard';
	}

	interface FullBranch extends Shared {
		kind: 'full';
		prominence?: Prominence;
	}

	/** Branches declare different subsets of \`Prominence\`, like Button's presentation props. */
	export type Props = LowBranch | FullBranch;

	export interface GenericProps<T> {
		items?: ReadonlyArray<T>;
	}
`;

test('links a Luke UI alias however the prop declares it', () => {
	const rows = enrichedRows('Props');

	// Written directly, inherited, generic, and with an explicit `undefined`.
	expect(rows.get('tone')).toEqual({ links: ['Tone'], text: 'Tone' });
	expect(rows.get('wrapped')).toEqual({ links: ['Wrapped'], text: 'Wrapped<number>' });
	expect(rows.get('callback')).toEqual({ links: ['Callback'], text: 'Callback | undefined' });
	// The branches write different types, so the row shows the resolved type, which is the alias.
	expect(rows.get('prominence')).toEqual({ links: ['Prominence'], text: 'Prominence' });
});

test('links each Luke UI name in a signature, but not external types or type parameters', () => {
	const rows = enrichedRows('Props');
	const genericRows = enrichedRows('GenericProps');

	expect(rows.get('mixed')).toEqual({ links: ['Tone', 'Callback'], text: 'Tone | Callback' });
	expect(rows.get('external')).toEqual({ links: [], text: 'External' });
	expect(rows.get('kind')).toEqual({ links: [], text: '"full" | "low"' });
	expect(genericRows.get('items')).toEqual({ links: [], text: 'ReadonlyArray<T>' });
});

/**
 * Runs enrichment on fumadocs-shaped entries, and gives each row's text and the Luke UI types its
 * tokens link. Fumadocs prints each prop's type with `typeToString`, so the entries do the same.
 */
function enrichedRows(typeName: string): Map<string, { links: Array<string>; text: string }> {
	const project = new Project({ compilerOptions: { strict: true }, useInMemoryFileSystem: true });
	project.createSourceFile(
		'/repo/node_modules/external/index.d.ts',
		"export type External = 'a' | 'b';",
	);
	const sourceFile = project.createSourceFile(`${PACKAGE_DIR}/src/props.ts`, SOURCE);
	const declaration = sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterfaceOrThrow(typeName);
	const checker = project.getTypeChecker().compilerObject;
	const declarationNode = declaration.compilerNode;
	const type = checker.getTypeAtLocation(declarationNode);

	const docEntries = checker.getPropertiesOfType(type).map((prop): DocEntry => {
		const text = checker.typeToString(
			checker.getTypeOfSymbolAtLocation(prop, declarationNode),
			declarationNode,
			ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope | ts.TypeFormatFlags.NoTruncation,
		);
		return {
			deprecated: false,
			description: '',
			name: prop.getName(),
			required: (prop.flags & ts.SymbolFlags.Optional) === 0,
			simplifiedType: text,
			tags: [],
			type: text,
		};
	});

	const doc = enrichGeneratedDocTypes(
		{ description: '', entries: docEntries, id: typeName, name: typeName },
		declaration,
		`${PACKAGE_DIR}/src`,
		checker,
	);
	return new Map(
		doc.entries.map((entry) => {
			const links = (doc.typeTokens?.[entry.name] ?? []).flatMap((token) => {
				if (!Array.isArray(token) || token[2] === undefined) return [];
				return doc.typeDefinitions?.[token[2]]?.module === undefined ? [token[2]] : [];
			});
			return [entry.name, { links, text: entry.simplifiedType }];
		}),
	);
}
