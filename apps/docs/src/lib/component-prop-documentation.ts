import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GeneratedDoc } from 'fumadocs-typescript';

export const PROP_GROUP_ORDER = [
	'Component props',
	'Events',
	'Styling',
	'Forms',
	'Accessibility',
	'Advanced',
] as const;

export type PropGroupName = (typeof PROP_GROUP_ORDER)[number];

interface PropDeclaration {
	getType(): {
		getProperties(): ReadonlyArray<PropSymbol>;
	};
}

export interface PropProject {
	createSourceFile(path: string, content: string, options: { overwrite: boolean }): PropSourceFile;
	getSourceFile(path: string): PropSourceFile | undefined;
}

interface PropSourceFile {
	getExportedDeclarations(): ReadonlyMap<string, ReadonlyArray<PropDeclaration>>;
	getFullText(): string;
}

interface PropSymbol {
	getDeclarations(): ReadonlyArray<{
		getSourceFile(): { getFilePath(): string };
	}>;
	getName(): string;
}

const EVENT_PROP = /^on[A-Z]/;
const ARIA_PROP = /^aria(-|[A-Z])/;

const FORM_PROPS = new Set([
	'autoComplete',
	'autoFocus',
	'defaultValue',
	'enterKeyHint',
	'form',
	'formAction',
	'formEncType',
	'formMethod',
	'formNoValidate',
	'formTarget',
	'inputMode',
	'isDisabled',
	'isReadOnly',
	'isRequired',
	'max',
	'maxLength',
	'min',
	'minLength',
	'name',
	'pattern',
	'step',
	'type',
	'validationBehavior',
	'value',
]);

const STYLING_PROPS = new Set(['className', 'style', 'UNSAFE_className', 'UNSAFE_style']);

const ADVANCED_PROPS = new Set([
	'children',
	'dangerouslySetInnerHTML',
	'elementType',
	'id',
	'inert',
	'key',
	'popover',
	'ref',
	'render',
	'slot',
	'suppressHydrationWarning',
]);

/** Classifies a visible prop name into one shared documentation group. */
export function classifyPropGroup(name: string): PropGroupName {
	if (EVENT_PROP.test(name)) return 'Events';
	if (STYLING_PROPS.has(name)) return 'Styling';
	if (FORM_PROPS.has(name)) return 'Forms';
	if (ARIA_PROP.test(name) || name === 'role') return 'Accessibility';
	if (ADVANCED_PROPS.has(name)) return 'Advanced';
	return 'Component props';
}

/** Groups visible prop names in the shared documentation order, omitting empty groups. */
export function groupPropNames(names: ReadonlyArray<string>): ReadonlyArray<{
	defaultOpen: boolean;
	name: PropGroupName;
	props: ReadonlyArray<string>;
}> {
	const buckets = new Map<PropGroupName, Array<string>>();

	for (const name of names) {
		const group = classifyPropGroup(name);
		const bucket = buckets.get(group) ?? [];
		bucket.push(name);
		buckets.set(group, bucket);
	}

	return PROP_GROUP_ORDER.flatMap((name) => {
		const props = buckets.get(name);
		if (props === undefined || props.length === 0) return [];
		return [
			{
				defaultOpen: name === 'Component props',
				name,
				props: [...props].sort((left, right) => left.localeCompare(right)),
			},
		];
	});
}

/** Returns the absolute `packages/@luke-ui/react/src` directory for a repository root. */
export function lukeUiReactSrcDir(repoRoot: string): string {
	return resolve(repoRoot, 'packages/@luke-ui/react/src');
}

/** True when a flattened prop is declared in Luke UI source rather than inherited DOM noise. */
function isLukeUiDeclaredProp(prop: PropSymbol, reactSrcDir: string): boolean {
	return prop
		.getDeclarations()
		.some((declaration) => declaration.getSourceFile().getFilePath().startsWith(reactSrcDir));
}

/** Filters generated documentation entries to the Luke UI prop contract. */
export function filterGeneratedDoc(
	doc: GeneratedDoc,
	declaration: PropDeclaration,
	reactSrcDir: string,
): GeneratedDoc {
	const visibleNames = new Set(
		declaration
			.getType()
			.getProperties()
			.filter((prop) => isLukeUiDeclaredProp(prop, reactSrcDir))
			.map((prop) => prop.getName()),
	);

	return {
		...doc,
		entries: doc.entries.filter((entry) => visibleNames.has(entry.name)),
	};
}

/** True when a prop type still accepts pass-through DOM or ARIA attributes at runtime. */
export function typeForwardsDomProps(declaration: PropDeclaration, reactSrcDir: string): boolean {
	return declaration
		.getType()
		.getProperties()
		.some((prop) => !isLukeUiDeclaredProp(prop, reactSrcDir));
}

/** Loads an exported prop declaration from a repo-relative TypeScript path. */
export function loadExportedPropDeclaration(
	project: PropProject,
	repoRoot: string,
	repoRelativePath: string,
	exportName: string,
): PropDeclaration | undefined {
	const absolutePath = resolve(repoRoot, repoRelativePath);
	if (!existsSync(absolutePath)) return undefined;

	const sourceFile = project.getSourceFile(absolutePath);
	const sourceText = readFileSync(absolutePath, 'utf8');
	const file =
		sourceFile === undefined
			? project.createSourceFile(absolutePath, sourceText, { overwrite: true })
			: sourceFile.getFullText() === sourceText
				? sourceFile
				: project.createSourceFile(absolutePath, sourceText, { overwrite: true });

	return file.getExportedDeclarations().get(exportName)?.[0];
}

/** Checks whether an exported prop type forwards native DOM props for docs generation. */
export function typeForwardsDomPropsForExport(
	project: PropProject,
	repoRoot: string,
	repoRelativePath: string,
	exportName: string,
): boolean {
	const declaration = loadExportedPropDeclaration(project, repoRoot, repoRelativePath, exportName);
	if (declaration === undefined) return false;
	return typeForwardsDomProps(declaration, lukeUiReactSrcDir(repoRoot));
}

/** Markdown note shown under a DOM-forwarding prop type heading. */
export function renderNativePropsNote(typeName: string): string {
	return `\`${typeName}\` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.\n\n`;
}
