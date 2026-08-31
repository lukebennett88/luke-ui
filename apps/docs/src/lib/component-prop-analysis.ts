import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GeneratedDoc } from 'fumadocs-typescript';
import { createProject } from 'fumadocs-typescript';

export interface PropProject {
	createSourceFile: (
		path: string,
		content: string,
		options: { overwrite: boolean },
	) => PropSourceFile;
	getSourceFile: (path: string) => PropSourceFile | undefined;
}

interface PropSourceFile {
	getExportedDeclarations: () => ReadonlyMap<string, ReadonlyArray<PropDeclaration>>;
	getFilePath: () => string;
}

/**
 * The exported declaration a `<component-props-table>` tag names — always a `type` alias or an
 * `interface`. The analysis reads it two ways: `getType()` for the flattened prop list the table
 * renders, and the syntax tree beneath it for *how* each prop got there.
 */
interface PropDeclaration extends SyntaxNode {
	getType: () => PropType;
}

/** A resolved type. `getUnionTypes` is empty unless `isUnion()`. */
interface PropType {
	getProperties: () => ReadonlyArray<PropSymbol>;
	getUnionTypes: () => ReadonlyArray<PropType>;
	isUnion: () => boolean;
}

interface PropSymbol {
	getAliasedSymbol?: () => PropSymbol | undefined;
	getDeclarations: () => ReadonlyArray<SyntaxNode>;
	getName: () => string;
}

/**
 * The subset of the ts-morph `Node` surface the structural walk uses. Every accessor beyond
 * `getKindName`/`getStart`/`getSourceFile` is optional because it exists on only some kinds; the
 * walk switches on `getKindName()` before reaching for the rest.
 */
interface SyntaxNode {
	/**
	 * `InterfaceDeclaration`: the `extends A, B` heritage clauses. A `ClassDeclaration` also carries
	 * `getExtends`, returning a single clause or `undefined`, so the return type covers both and the
	 * walk normalises it — only interfaces are ever walked here in practice.
	 */
	getExtends?: () => ReadonlyArray<SyntaxNode> | SyntaxNode | undefined;
	/** `ExpressionWithTypeArguments` only: the referenced name, e.g. `Pick` in `extends Pick<…>`. */
	getExpression?: () => SyntaxNode;
	getKindName: () => string;
	/** `InterfaceDeclaration` and `TypeLiteral`: own (syntactically declared) members. */
	getMembers?: () => ReadonlyArray<SyntaxNode>;
	/** `InterfaceDeclaration` only. */
	getName?: () => string | undefined;
	getSourceFile: () => PropSourceFile;
	getStart: () => number;
	getSymbol?: () => PropSymbol | undefined;
	getText: () => string;
	/** `TypeReference` and `ExpressionWithTypeArguments`: the `<…>` arguments. */
	getTypeArguments?: () => ReadonlyArray<SyntaxNode>;
	/** `TypeAliasDeclaration` and `ParenthesizedType`: the type on the right of the `=`. */
	getTypeNode?: () => SyntaxNode | undefined;
	/** `TypeReference` only: the referenced name, e.g. `Prettify` in `Prettify<X>`. */
	getTypeName?: () => SyntaxNode;
	/** `UnionType` and `IntersectionType`: the constituents. */
	getTypeNodes?: () => ReadonlyArray<SyntaxNode>;
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

/**
 * True when a prop type still accepts pass-through DOM or ARIA attributes at runtime — that is, when
 * some prop it flattens in reaches it through a generic element attribute bag and so is not
 * documented in its table.
 */
export function typeForwardsDomProps(declaration: PropDeclaration, reactSrcDir: string): boolean {
	const visibleNames = visiblePropNameSet(declaration, reactSrcDir);
	return flattenedProps(declaration).some((prop) => !visibleNames.has(prop.getName()));
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

function readSourceFile(project: PropProject, absolutePath: string): PropSourceFile {
	return project.createSourceFile(absolutePath, readFileSync(absolutePath, 'utf8'), {
		overwrite: true,
	});
}

/**
 * Generic aliases whose payload sits in a type argument rather than in their own body. Following
 * argument 0 is what lets the walk see through the wrappers Luke UI puts on nearly every prop type;
 * without this, `Prettify<_ButtonProps>` looks like an opaque mapped type and nothing below it is
 * reachable. `Omit`/`DistributiveOmit` subtract names but leave the rest of the source in place, so
 * whatever the source is — a curated interface or a DOM bag — the remaining props keep its nature.
 */
const TYPE_ARGUMENT_ALIASES = new Set([
	'DistributiveOmit',
	'Exclude',
	'NonNullable',
	'Omit',
	'Partial',
	'Prettify',
	'Readonly',
	'Required',
]);

/**
 * React helpers that resolve to the *entire* props object of a DOM element or component — a generic
 * element attribute bag reached without naming a single prop. They are conditional types, so the
 * syntax below them leads nowhere and the walk has to read their resolved property set instead.
 */
const ELEMENT_PROPS_ALIASES = new Set([
	'ComponentProps',
	'ComponentPropsWithRef',
	'ComponentPropsWithoutRef',
	'HTMLProps',
	'IntrinsicElements',
	'JSX.IntrinsicElements',
]);

/**
 * Prop names that stay treated as native DOM pass-through even when they arrive on an interface that
 * is otherwise a documented contract. Every React Aria component interface carries `className`/`style`
 * as the same generic styling escape hatch (already classified as `STYLING_PROPS` in
 * `component-prop-groups.ts`, never as a component's distinguishing contract). `onClick` is React
 * Aria's own documented DOM-compatibility alias for `onPress`, declared directly alongside it on the
 * tiny `PressEvents` interface. These three are not recoverable from structure: they sit on the same
 * syntax nodes as the props they must be told apart from, so a name rule is the only mechanism left.
 * A prop a type names explicitly through `Pick` overrides this — `Icon` picks `className` and `style`
 * on purpose, and that deliberate choice wins over the generic default.
 */
const NATIVE_PASSTHROUGH_PROP_NAMES = new Set(['className', 'style', 'onClick']);

/**
 * True when an interface is the one fixed accessibility-labeling contract React Aria repeats,
 * verbatim, across nearly every component: `AriaLabelingProps` in `@react-types/shared`
 * (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`). It is small, named, and never
 * changes shape, so Luke UI treats props declared directly on it as always-documented even when a
 * component inherits it externally without redeclaring it — the same way `docs/DOCUMENTATION.md`
 * expects `aria-label` to remain reachable everywhere without requiring every component to redeclare
 * it by hand. This is a structural check on the *interface*, not a name check on the prop: `aria-label`
 * also arrives through React's own `AriaAttributes` (folded into `HTMLAttributes`/`SVGAttributes`), and
 * there it must stay hidden like the rest of that bag — `Code`'s bare `extends ComponentProps<'code'>`
 * has no business documenting `aria-label` just because the name matches.
 */
function isAriaLabelingContract(node: SyntaxNode): boolean {
	return node.getName?.() === 'AriaLabelingProps';
}

/**
 * Name shapes that mark a prop as React Aria's own long-tail HTML pass-through — `aria-*` state and
 * relationship attributes beyond the fixed labeling contract above, and the `<form>`-submission
 * attributes (`form`, `formAction`, `formEncType`, `formMethod`, `formNoValidate`, `formTarget`, plus
 * the sibling `name`/`value` pair submitted alongside them). React Aria interfaces such as
 * `AriaBaseButtonProps` declare these directly on the *same* interface body as genuinely documented
 * props (`type`, `isDisabled`'s siblings), reached through a plain `extends` rather than a `Pick` or an
 * `Attributes`-suffixed bag — so there is no syntax that separates the two groups; only the name shape
 * does. A prop matching this shape is long-tail unless Luke UI redeclares it itself (see
 * `documented-rac-props.ts` and `ComboboxRootRedeclaredRACProps`), which is what keeps `form`/`name`
 * visible on `ComboboxRootProps` while hiding them on `ButtonProps`.
 */
const ARIA_FORM_LONG_TAIL_PROP_NAMES = new Set([
	'aria-controls',
	'aria-current',
	'aria-disabled',
	'aria-expanded',
	'aria-haspopup',
	'aria-pressed',
	'excludeFromTabOrder',
	'form',
	'formAction',
	'formEncType',
	'formMethod',
	'formNoValidate',
	'formTarget',
	'name',
	'preventFocusOnPress',
	'value',
]);

/** What one structural walk of a prop type learned about where its props come from. */
interface StructuralOrigins {
	/**
	 * Syntax-node keys (`file:start`) of the `AriaLabelingProps` interface declarations the type
	 * reaches. `AriaLabelingProps` (react-aria's `@react-types/shared`) is a distinct interface from
	 * React's own `AriaAttributes`, which declares similarly-named props but is an `Attributes`-suffixed
	 * bag and stays broad as normal — so this set only ever picks up the small, named, documented
	 * contract, never the DOM attribute bag that happens to share a naming convention.
	 */
	ariaLabelingNodeKeys: Set<string>;
	/**
	 * Syntax-node keys (`file:start`) of interfaces the type reaches through broad structural
	 * inheritance of a generic element attribute bag. Props declared on these are undocumented
	 * pass-through.
	 */
	broadNodeKeys: Set<string>;
	/**
	 * Prop names the type brings in through `Pick<Source, 'a' | 'b'>`. `Pick` erases at the symbol
	 * level — the picked props still report React's own declaration site — so the *only* record that
	 * they were chosen deliberately is this syntax. Reading it is what keeps `Icon`'s five curated
	 * SVG props visible.
	 */
	selectedNames: Set<string>;
}

/**
 * True when an interface is one of React's generic element prop families: `Attributes` (`key`),
 * `RefAttributes` (`ref`), `AriaAttributes`, `DOMAttributes<T>`, `HTMLAttributes<T>`,
 * `SVGAttributes<T>`, and the per-tag `<Tag>HTMLAttributes<T>` interfaces. These describe what any
 * element accepts rather than a component's own contract, so a type that inherits one wholesale has
 * said nothing about its documented API. Redeclare a prop on a Luke UI type when the guide teaches
 * it as intentional behaviour — for example `BoxProps['ref']` or `LoadingSpinnerProps['aria-label']`.
 */
function isElementAttributeBag(node: SyntaxNode): boolean {
	const name = node.getName?.();
	if (name === undefined) return false;
	return name === 'Attributes' || name === 'RefAttributes' || name.endsWith('Attributes');
}

/** The `extends` clauses of a declaration, as a list whichever shape the node reports them in. */
function heritageClauses(node: SyntaxNode): ReadonlyArray<SyntaxNode> {
	const clauses = node.getExtends?.();
	if (clauses === undefined) return [];
	return Array.isArray(clauses) ? clauses : [clauses as SyntaxNode];
}

/** Stable identity for a syntax node, used both as a walk seen-key and to match declaration sites. */
function nodeKey(node: SyntaxNode): string {
	return `${node.getSourceFile().getFilePath()}:${node.getStart()}`;
}

/**
 * Resolves the declarations a referenced name points at, crossing `ImportSpecifier` nodes. A
 * re-exported interface resolves to its import specifier first; `getAliasedSymbol` walks that alias
 * through to the real `InterfaceDeclaration`.
 */
function referencedDeclarations(nameNode: SyntaxNode): ReadonlyArray<SyntaxNode> {
	const symbol = nameNode.getSymbol?.();
	if (symbol === undefined) return [];
	return (symbol.getAliasedSymbol?.() ?? symbol).getDeclarations();
}

/** The string literals in a `Pick`'s key argument, whether a single literal or a union of them. */
function literalKeyNames(node: SyntaxNode | undefined): ReadonlyArray<string> {
	if (node === undefined) return [];
	const kind = node.getKindName();
	if (kind === 'LiteralType') return [node.getText().replace(/^['"`]|['"`]$/g, '')];
	if (kind === 'UnionType') return (node.getTypeNodes?.() ?? []).flatMap(literalKeyNames);
	return [];
}

/**
 * Walks the syntax below an exported prop type to record where its props come from. `isBroad` tracks
 * whether the current path has already passed through a generic element attribute bag, so an
 * interface that merely sits *below* `HTMLAttributes` in an `extends` chain inherits its broadness.
 *
 * The seen-set is keyed on the node's source file, start offset and the broadness it was visited
 * with: the same interface can legitimately be reached both selectively and broadly, and only
 * re-visiting under a repeated key would loop.
 */
function walkOrigins(
	node: SyntaxNode | undefined,
	isBroad: boolean,
	origins: StructuralOrigins,
	seen: Set<string>,
	reactSrcDir: string,
): void {
	if (node === undefined) return;

	const key = `${nodeKey(node)}:${node.getKindName()}:${isBroad}`;
	if (seen.has(key)) return;
	seen.add(key);

	const recurse = (child: SyntaxNode | undefined, broad = isBroad): void =>
		walkOrigins(child, broad, origins, seen, reactSrcDir);

	switch (node.getKindName()) {
		case 'TypeAliasDeclaration':
		case 'ParenthesizedType':
			recurse(node.getTypeNode?.());
			return;

		case 'IntersectionType':
		case 'UnionType':
			// A union documents everything any constituent documents, so both branches are walked with
			// the same broadness and their findings merge into one set of origins.
			for (const member of node.getTypeNodes?.() ?? []) recurse(member);
			return;

		case 'TypeReference': {
			const name = node.getTypeName?.();
			if (name !== undefined) {
				walkReference(node, name, isBroad, origins, seen, reactSrcDir);
			}
			return;
		}

		case 'ExpressionWithTypeArguments': {
			const name = node.getExpression?.();
			if (name !== undefined) {
				walkReference(node, name, isBroad, origins, seen, reactSrcDir);
			}
			return;
		}

		case 'InterfaceDeclaration': {
			const isExternal = !node.getSourceFile().getFilePath().startsWith(reactSrcDir);
			const isBroadHere = isExternal && (isBroad || isElementAttributeBag(node));
			if (isBroadHere) origins.broadNodeKeys.add(nodeKey(node));
			if (isExternal && isAriaLabelingContract(node))
				origins.ariaLabelingNodeKeys.add(nodeKey(node));
			for (const heritage of heritageClauses(node)) recurse(heritage, isBroadHere);
			return;
		}

		default:
			return;
	}
}

/** Handles a `Foo<…>` reference, whether written as a type reference or in a heritage clause. */
function walkReference(
	referenceNode: SyntaxNode,
	nameNode: SyntaxNode,
	isBroad: boolean,
	origins: StructuralOrigins,
	seen: Set<string>,
	reactSrcDir: string,
): void {
	const fullName = nameNode.getText();
	const simpleName = fullName.split('.').at(-1) ?? fullName;
	const typeArguments = referenceNode.getTypeArguments?.() ?? [];
	const recurse = (child: SyntaxNode | undefined, broad = isBroad): void =>
		walkOrigins(child, broad, origins, seen, reactSrcDir);

	if (simpleName === 'Pick') {
		// `Pick<Source, Keys>` is the one construct that names props deliberately. Record the keys, then
		// keep walking the source so any bag underneath is still marked broad for everything *not* named.
		for (const name of literalKeyNames(typeArguments[1])) origins.selectedNames.add(name);
		recurse(typeArguments[0]);
		return;
	}

	if (ELEMENT_PROPS_ALIASES.has(simpleName) || ELEMENT_PROPS_ALIASES.has(fullName)) {
		markResolvedElementBags(referenceNode, origins);
		return;
	}

	if (TYPE_ARGUMENT_ALIASES.has(simpleName)) {
		recurse(typeArguments[0]);
		return;
	}

	for (const declaration of referencedDeclarations(nameNode)) recurse(declaration);
	for (const argument of typeArguments) recurse(argument);
}

/**
 * Marks the element attribute bags a `ComponentProps<'code'>`-style reference resolves through. The
 * alias is a conditional type, so there is no syntax to follow; the resolved property set is read
 * instead and every generic attribute-bag declaration site — including `Attributes` and
 * `RefAttributes` — is marked broad.
 */
function markResolvedElementBags(referenceNode: SyntaxNode, origins: StructuralOrigins): void {
	for (const prop of (referenceNode as PropDeclaration).getType().getProperties()) {
		for (const declaration of prop.getDeclarations()) {
			const parent = declarationParent(declaration);
			if (parent === undefined || parent.getKindName() !== 'InterfaceDeclaration') continue;
			if (!isElementAttributeBag(parent)) continue;
			origins.broadNodeKeys.add(nodeKey(parent));
		}
	}
}

interface WithParent {
	getParent: () => SyntaxNode | undefined;
}

function declarationParent(declaration: SyntaxNode): SyntaxNode | undefined {
	return (declaration as unknown as WithParent).getParent();
}

/**
 * Every prop a type accepts, across all of a union's constituents. TypeScript's own
 * `getProperties()` on a union returns only the props common to *all* branches, which would hide
 * `Box`'s entire element branch behind its render branch.
 */
function flattenedProps(declaration: PropDeclaration): ReadonlyArray<PropSymbol> {
	const type = declaration.getType();
	const constituents = type.isUnion() ? type.getUnionTypes() : [type];

	const props = new Map<string, PropSymbol>();
	for (const constituent of constituents) {
		for (const prop of constituent.getProperties()) {
			if (!props.has(prop.getName())) props.set(prop.getName(), prop);
		}
	}
	return [...props.values()];
}

/**
 * The flattened prop names that belong to the Luke UI contract. A prop is documented when Luke UI
 * declares it, when the type names it deliberately through a `Pick`, or when it is declared directly on
 * the small named `AriaLabelingProps` contract. A prop is hidden when it only ever arrives through a
 * generic element attribute bag — `HTMLAttributes`, `SVGAttributes`, `AriaAttributes`, `DOMAttributes`,
 * a `ComponentProps<'div'>` expansion, or anything that inherits one of those wholesale — when it is
 * one of the three native pass-through names above, or when it is an external `aria-*`/`form*`
 * long-tail prop Luke UI never redeclared.
 *
 * The long-tail check exists because structure alone cannot separate it from a legitimate small
 * contract: React Aria interfaces like `AriaBaseButtonProps` declare `aria-pressed`, `formMethod`,
 * `name`, `preventFocusOnPress` and friends directly alongside genuinely documented siblings (`type`,
 * the props `DocumentedPressProps` redeclares) on the very same interface body, reached through a plain
 * `extends` rather than any syntax a walk could single out. Only the prop's own name shape tells them
 * apart, so `ARIA_FORM_LONG_TAIL_PROP_NAMES` is the one place that decision is made explicitly.
 */
function computeVisiblePropNameSet(declaration: PropDeclaration, reactSrcDir: string): Set<string> {
	const origins: StructuralOrigins = {
		ariaLabelingNodeKeys: new Set<string>(),
		broadNodeKeys: new Set<string>(),
		selectedNames: new Set<string>(),
	};
	walkOrigins(declaration, false, origins, new Set<string>(), reactSrcDir);

	const visibleNames = new Set<string>();
	for (const prop of flattenedProps(declaration)) {
		const name = prop.getName();
		const declarations = prop.getDeclarations();

		const isLukeDeclared = declarations.some((propDeclaration) =>
			propDeclaration.getSourceFile().getFilePath().startsWith(reactSrcDir),
		);
		if (isLukeDeclared || origins.selectedNames.has(name)) {
			visibleNames.add(name);
			continue;
		}

		const isFromAriaLabelingContract = declarations.some((propDeclaration) => {
			const parent = declarationParent(propDeclaration);
			return parent !== undefined && origins.ariaLabelingNodeKeys.has(nodeKey(parent));
		});
		if (isFromAriaLabelingContract) {
			visibleNames.add(name);
			continue;
		}

		if (NATIVE_PASSTHROUGH_PROP_NAMES.has(name) || ARIA_FORM_LONG_TAIL_PROP_NAMES.has(name))
			continue;

		const isFromBroadBag = declarations.some((propDeclaration) => {
			const parent = declarationParent(propDeclaration);
			// A prop with no declaring syntax node can't be traced to a contract; treat it as pass-through
			// rather than claim it as documented.
			if (parent === undefined) return true;
			return origins.broadNodeKeys.has(nodeKey(parent));
		});
		if (!isFromBroadBag) visibleNames.add(name);
	}
	return visibleNames;
}

/**
 * Caches `computeVisiblePropNameSet` results per `(declaration, reactSrcDir)` pair. Both
 * `filterGeneratedDoc` and `typeForwardsDomProps` are called once per documented type with the same
 * declaration, and the structural walk (`walkOrigins`) is the expensive part of the computation — this
 * cache lets the second call reuse the first's result instead of re-walking the same syntax tree. The
 * key combines `reactSrcDir` with the declaration's `nodeKey` using a space, which cannot appear inside
 * a `nodeKey` (a `file:start` pair), so two different declarations or the same declaration analysed
 * against a different `reactSrcDir` never collide. The cache lives for the process lifetime: within a
 * single build or test run the source files on disk don't change mid-run, so a stale entry surviving a
 * `readSourceFile` re-read (via `overwrite: true`) is not a concern here.
 */
const visiblePropNameSetCache = new Map<string, ReadonlySet<string>>();

function visiblePropNameSet(
	declaration: PropDeclaration,
	reactSrcDir: string,
): ReadonlySet<string> {
	const key = `${reactSrcDir} ${nodeKey(declaration)}`;
	const cached = visiblePropNameSetCache.get(key);
	if (cached !== undefined) return cached;

	const computed = computeVisiblePropNameSet(declaration, reactSrcDir);
	visiblePropNameSetCache.set(key, computed);
	return computed;
}
