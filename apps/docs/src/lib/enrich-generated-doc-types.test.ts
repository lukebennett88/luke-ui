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
	const entries = enrichedEntries('Props');

	// Written directly, inherited, generic, and with an explicit `undefined`.
	expect(entries.get('tone')).toEqual(
		expect.objectContaining({ simplifiedType: 'Tone', typeHref: 'Tone' }),
	);
	expect(entries.get('wrapped')).toEqual(
		expect.objectContaining({ simplifiedType: 'Wrapped<number>', typeHref: 'Wrapped' }),
	);
	expect(entries.get('callback')).toEqual(
		expect.objectContaining({ simplifiedType: 'Callback | undefined', typeHref: 'Callback' }),
	);
	// The branches write different types, so the row shows the resolved type, which is the alias.
	expect(entries.get('prominence')).toEqual(
		expect.objectContaining({ simplifiedType: 'Prominence', typeHref: 'Prominence' }),
	);
});

test('leaves external types, type parameters, and unions of aliases unlinked', () => {
	const entries = enrichedEntries('Props');
	const genericEntries = enrichedEntries('GenericProps');

	expect(entries.get('external')?.simplifiedType).toBe('External');
	expect(entries.get('external')?.typeHref).toBeUndefined();
	expect(entries.get('mixed')?.simplifiedType).toBe('Tone | Callback');
	expect(entries.get('mixed')?.typeHref).toBeUndefined();
	expect(entries.get('kind')?.typeHref).toBeUndefined();
	expect(genericEntries.get('items')?.simplifiedType).toBe('ReadonlyArray<T>');
	expect(genericEntries.get('items')?.typeHref).toBeUndefined();
});

/**
 * Runs enrichment on fumadocs-shaped entries. Fumadocs prints each prop's type with
 * `typeToString`, so the entries do the same.
 */
function enrichedEntries(typeName: string): Map<string, DocEntry> {
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
	return new Map(doc.entries.map((entry) => [entry.name, entry]));
}
