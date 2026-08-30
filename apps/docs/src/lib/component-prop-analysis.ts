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
}

interface PropSymbol {
	getDeclarations(): ReadonlyArray<{
		getSourceFile(): { getFilePath(): string };
	}>;
	getName(): string;
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

/** True when a flattened prop is declared in Luke UI source rather than inherited from a DOM type. */
function isLukeUiDeclaredProp(prop: PropSymbol, reactSrcDir: string): boolean {
	return prop
		.getDeclarations()
		.some((declaration) => declaration.getSourceFile().getFilePath().startsWith(reactSrcDir));
}
