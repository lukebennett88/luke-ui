import type { ts } from 'ts-morph';
import { Project } from 'ts-morph';
import { expect, test } from 'vite-plus/test';
import { createTypeDefinitionCollector } from './collect-type-definitions.js';
import type { TypeTokens } from './type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

const PACKAGE_DIR = '/repo/packages/@luke-ui/react';

test('links a row to the Luke UI type when an external type has the same name', () => {
	const { annotation, collector } = collectorFor(`
		import type { Size as ExternalSize } from '../../../../node_modules/external/index';
		export type Size = 'small' | 'large';
		export interface Props {
			external?: ExternalSize;
			local?: Size;
		}
	`);

	expect(collector.addTypeNode(annotation('external'))).toEqual([['t', 'ExternalSize', 'Size']]);
	expect(collector.addTypeNode(annotation('local'))).toEqual([['t', 'Size', 'Size (local)']]);
	const definitions = collector.definitions() ?? {};

	expect(text(definitions['Size (local)']?.definition)).toBe("type Size = 'small' | 'large';");
	expect(definitions.Size).toEqual(
		expect.objectContaining({ module: 'external', writtenAs: ['ExternalSize'] }),
	);
});

test('expands a type a row shows after other definitions reach the limit', () => {
	const chain = Array.from(
		{ length: 70 },
		(_, index) => `type Step${index} = ${index === 69 ? 'string' : `Step${index + 1}`};`,
	).join('\n');
	const { annotation, collector } = collectorFor(`
		${chain}
		export type Late = 'late';
		export interface Props {
			early?: Step0;
			late?: Late;
		}
	`);

	collector.addTypeNode(annotation('early'));
	collector.addTypeNode(annotation('late'));
	const definitions = collector.definitions() ?? {};

	expect(text(definitions.Late?.definition)).toBe("type Late = 'late';");
	expect(definitions.Step69?.definition).toBeUndefined();
});

test('links the Luke UI types a definition names, so a popover can open them in turn', () => {
	const { annotation, collector } = collectorFor(`
		type Condition = 'initial' | 'wide';
		type Responsive<Value> = Value | { [Key in Condition]?: Value };
		export interface Props {
			gap?: Responsive<number>;
		}
	`);

	expect(collector.addTypeNode(annotation('gap'))).toEqual([
		['t', 'Responsive', 'Responsive'],
		'<',
		['k', 'number'],
		'>',
	]);
	const definitions = collector.definitions() ?? {};

	expect(definitions.Responsive?.references).toEqual(['Condition']);
	expect(definitions.Responsive?.definition).toContainEqual(['t', 'Condition', 'Condition']);
	expect(text(definitions.Condition?.definition)).toBe("type Condition = 'initial' | 'wide';");
});

function text(tokens: TypeTokens | undefined): string | undefined {
	return tokens === undefined ? undefined : typeTokensToText(tokens, { multiline: false });
}

function collectorFor(source: string) {
	const project = new Project({
		compilerOptions: { strict: true },
		useInMemoryFileSystem: true,
	});
	project.createSourceFile(
		'/repo/node_modules/external/index.d.ts',
		"export type Size = 'sm' | 'lg';",
	);
	const sourceFile = project.createSourceFile(`${PACKAGE_DIR}/src/props.ts`, source);
	const props = sourceFile.getInterfaceOrThrow('Props');
	const collector = createTypeDefinitionCollector({
		checker: project.getTypeChecker().compilerObject,
		enclosingDeclaration: props.compilerNode,
		packageDir: PACKAGE_DIR,
	});

	function annotation(name: string): ts.TypeNode {
		return props.getPropertyOrThrow(name).getTypeNodeOrThrow().compilerNode;
	}

	return { annotation, collector };
}
