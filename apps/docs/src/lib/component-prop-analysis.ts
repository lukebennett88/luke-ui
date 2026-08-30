import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GeneratedDoc } from 'fumadocs-typescript';
import { createProject } from 'fumadocs-typescript';

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
	getFilePath(): string;
}

interface PropSymbol {
	getDeclarations(): ReadonlyArray<PropSymbolDeclaration>;
	getName(): string;
}

/**
 * The syntax node that declares one flattened prop, e.g. the `interface` or type literal a property
 * signature belongs to. Its own `getMembers` count (own-declared members, not inherited ones) is
 * what tells a curated `Pick` apart from a wholesale-inherited DOM attribute bag; see
 * `isWholesaleExternalNode` below.
 */
interface PropSymbolDeclaration {
	getParent(): PropDeclaringNode | undefined;
	getSourceFile(): PropSourceFile;
}

interface PropDeclaringNode {
	/** Present on `InterfaceDeclaration` and `TypeLiteralNode`; absent on other parent kinds. */
	getMembers?(): ReadonlyArray<unknown>;
	/** Used only as a cache key to group declarations by the same syntax node; never called. */
	getStart(): number;
}

const sharedProjects = new Map<string, Promise<Awaited<ReturnType<typeof createProject>>>>();

/** Returns the ts-morph project for a repo root, creating it at most once per root. */
export function getSharedPropProject(
	repoRoot: string,
): Promise<Awaited<ReturnType<typeof createProject>>> {
	const cached = sharedProjects.get(repoRoot);
	if (cached !== undefined) return cached;

	const project = createProject({ tsconfigPath: `${repoRoot}/apps/docs/tsconfig.json` });
	sharedProjects.set(repoRoot, project);
	return project;
}

/** Returns the absolute `packages/@luke-ui/react/src` directory for a repository root. */
export function lukeUiReactSrcDir(repoRoot: string): string {
	return resolve(repoRoot, 'packages/@luke-ui/react/src');
}

/** Filters generated documentation entries to the Luke UI prop contract. */
export function filterGeneratedDoc(
	doc: GeneratedDoc,
	declaration: PropDeclaration,
	reactSrcDir: string,
): GeneratedDoc {
	const visibleNames = visiblePropNameSet(declaration, reactSrcDir);
	return {
		...doc,
		entries: doc.entries.filter((entry) => visibleNames.has(entry.name)),
	};
}

/** True when a prop type still accepts pass-through DOM or ARIA attributes at runtime. */
export function typeForwardsDomProps(declaration: PropDeclaration, reactSrcDir: string): boolean {
	const props = declaration.getType().getProperties();
	const visibleNames = visiblePropNameSet(declaration, reactSrcDir);
	return props.some((prop) => !visibleNames.has(prop.getName()));
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

	const file = project.getSourceFile(absolutePath) ?? readSourceFile(project, absolutePath);
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

function readSourceFile(project: PropProject, absolutePath: string): PropSourceFile {
	return project.createSourceFile(absolutePath, readFileSync(absolutePath, 'utf8'), {
		overwrite: true,
	});
}

/**
 * An interface below this many own (syntactically declared, not inherited) members is treated as a
 * small, named semantic contract — e.g. React Aria's `PressEvents` (3 members) or `AriaLabelingProps`
 * (4 members) — and always stays visible, regardless of how much of it a type includes.
 * `ComboBoxProps`'s own body (12 members) sits just under this floor; `AriaBaseButtonProps` (16 own
 * members, mostly generic `aria-*`/`form*` passthrough) sits just over it. The floor has to clear
 * `TextInputDOMEvents` (9 members, a real input-event contract that types like `TextFieldProps`
 * include wholesale) while still catching `ListBoxProps` (13 members, mostly DOM/RAC passthrough).
 */
const SMALL_INTERFACE_OWN_MEMBERS = 12;

/**
 * Once an interface is large enough to fail the size check above, a prop only counts as
 * wholesale-inherited (and so gets hidden) when the type includes at least half of that interface's
 * own members. `IconProps` includes 4 of `SVGAttributes`' 263 own members (a deliberate `Pick`, ratio
 * 0.02) and must stay visible; `AriaBaseButtonProps` contributes 15 of its 16 own members to
 * `ButtonProps` (ratio 0.94, true wholesale inheritance) and must hide. The measured data has a wide
 * gap between the two (0.04 vs 0.55+), so the exact cut only has to land inside that gap.
 */
const WHOLESALE_COVERAGE_THRESHOLD = 0.5;

/**
 * Prop names that stay treated as native DOM pass-through even inside a small external interface
 * that is otherwise kept visible (see `isWholesaleExternalNode`). Every RAC component interface
 * carries `className`/`style` as the same generic styling escape hatch (already classified as
 * `STYLING_PROPS` in `component-prop-groups.ts`, never as a component's distinguishing contract).
 * `onClick` is React Aria's own documented DOM-compatibility alias for `onPress`, declared directly
 * alongside it on the tiny `PressEvents` interface — the one case where a single native-named prop
 * sits inside an otherwise-genuine semantic contract. This set intentionally excludes ARIA and focus
 * names (`aria-label`, `onFocus`, …): those ARE the documented contract on interfaces such as
 * `AriaLabelingProps`/`FocusEvents`, even though the names also happen to exist on plain elements.
 */
const NATIVE_PASSTHROUGH_PROP_NAMES = new Set(['className', 'style', 'onClick']);

/**
 * Computes the set of flattened prop names that belong to the Luke UI contract: every prop declared
 * in Luke UI source, plus every externally-declared prop that is not part of a large interface
 * inherited wholesale (a generic DOM or ARIA attribute bag) rather than a small semantic contract or
 * a curated `Pick`.
 */
function visiblePropNameSet(declaration: PropDeclaration, reactSrcDir: string): Set<string> {
	const props = declaration.getType().getProperties();

	// Group each prop's *external* declaration sites by the syntax node that declares them (their
	// interface or type literal), so wholesale inheritance can be measured against that node's own
	// member count rather than per-prop. Grouped by node identity (`getStart` + source file), not by
	// name, since two different interfaces can share a name (e.g. multiple `ButtonProps`).
	const externalNodes = new Map<string, { includedNames: Set<string>; node: PropDeclaringNode }>();

	for (const prop of props) {
		for (const propDeclaration of prop.getDeclarations()) {
			const sourceFile = propDeclaration.getSourceFile();
			if (sourceFile.getFilePath().startsWith(reactSrcDir)) continue;

			const parent = propDeclaration.getParent();
			if (parent === undefined) continue;

			const key = `${sourceFile.getFilePath()}:${parent.getStart()}`;
			const group = externalNodes.get(key) ?? { includedNames: new Set<string>(), node: parent };
			group.includedNames.add(prop.getName());
			externalNodes.set(key, group);
		}
	}

	const wholesaleExternalNames = new Set<string>();
	for (const { includedNames, node } of externalNodes.values()) {
		for (const name of includedNames) {
			if (isWholesaleExternalNode(node, includedNames.size, name)) wholesaleExternalNames.add(name);
		}
	}

	const visibleNames = new Set<string>();
	for (const prop of props) {
		const name = prop.getName();
		const isLukeDeclared = prop
			.getDeclarations()
			.some((propDeclaration) =>
				propDeclaration.getSourceFile().getFilePath().startsWith(reactSrcDir),
			);
		if (isLukeDeclared || !wholesaleExternalNames.has(name)) visibleNames.add(name);
	}
	return visibleNames;
}

/**
 * True when a prop declared on an external node should be hidden: either the node is a large bag
 * that the consuming type inherits most or all of (true wholesale inheritance — see
 * `SMALL_INTERFACE_OWN_MEMBERS` and `WHOLESALE_COVERAGE_THRESHOLD` above), or the node is small but
 * this specific prop's name is a native pass-through kept only for DOM compatibility (see
 * `NATIVE_PASSTHROUGH_PROP_NAMES`). `includedCount` is how many of the node's own members the
 * consuming type actually flattens in.
 */
function isWholesaleExternalNode(
	node: PropDeclaringNode,
	includedCount: number,
	propName: string,
): boolean {
	const ownMembers = node.getMembers?.();
	// A node without syntactic members (e.g. a generic interface whose body is empty and whose props
	// all come through `extends`) can't be measured this way; treat it as external noise rather than
	// risk mis-measuring its coverage.
	if (ownMembers === undefined) return true;

	const ownMemberCount = ownMembers.length;
	if (ownMemberCount <= SMALL_INTERFACE_OWN_MEMBERS)
		return NATIVE_PASSTHROUGH_PROP_NAMES.has(propName);

	const coverage = Math.min(includedCount / ownMemberCount, 1);
	return coverage >= WHOLESALE_COVERAGE_THRESHOLD;
}
