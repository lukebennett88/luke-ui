import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import {
	buildComponentGuideInventory,
	findComponentGuideFiles,
} from './component-guide-inventory.js';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
} from './component-prop-analysis.js';
import type { PropProject } from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { GUIDE_TAUGHT_PROPS, guideTableKey } from './guide-prop-audit-data.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
const componentsDir = resolve(repoRoot, 'apps/docs/content/docs/components');
const inventory = buildComponentGuideInventory({
	componentsDir,
	guides: findComponentGuideFiles(componentsDir),
	reactPackageJsonPath: resolve(repoRoot, 'packages/@luke-ui/react/package.json'),
});
const authoredTables = inventory.guides.flatMap((guide) =>
	guide.props.map((table) => ({
		guide: guide.relativePath,
		...table,
	})),
);
const generator = createComponentPropsGenerator({
	cache: createFileSystemGeneratorCache(resolve(repoRoot, 'apps/docs/.source/fumadocs-typescript')),
});
const TS_MORPH_TEST_TIMEOUT = 30_000;

async function visiblePropNames(path: string, name: string): Promise<Array<string>> {
	const [doc] = await generator.generateTypeTable({ path, name }, { basePath: repoRoot });
	const project = await getSharedPropProject(repoRoot);
	const declaration = loadExportedPropDeclaration(project as PropProject, repoRoot, path, name);
	if (doc === undefined || declaration === undefined) {
		throw new Error(`Missing documentation for ${name} in ${path}`);
	}
	return filterGeneratedDoc(doc, declaration, reactSrcDir).entries.map((entry) => entry.name);
}

test('every component guide declares at least one API table', () => {
	expect(
		inventory.guides.flatMap((guide) => {
			if (guide.props.length > 0) return [];

			return [guide.relativePath];
		}),
	).toEqual([]);
});

test('every authored guide/table pair has curated taught-prop metadata', () => {
	const authoredKeys = new Set(
		authoredTables.map((table) => guideTableKey(table.guide, table.path, table.name)),
	);
	const auditKeys = new Set(Object.keys(GUIDE_TAUGHT_PROPS));

	expect({
		missing: [...authoredKeys].filter((key) => !auditKeys.has(key)),
		stale: [...auditKeys].filter((key) => !authoredKeys.has(key)),
	}).toEqual({ missing: [], stale: [] });
});

test.each(
	authoredTables.flatMap((table) => {
		const props = GUIDE_TAUGHT_PROPS[guideTableKey(table.guide, table.path, table.name)];
		if (props === undefined || props.length === 0) return [];
		return [{ ...table, props }];
	}),
)(
	'$guide teaches documented props on $name',
	async ({ guide, name, path, props }) => {
		const names = await visiblePropNames(path, name);
		for (const prop of props) {
			expect(names, `${guide} teaches ${prop} on ${name}`).toContain(prop);
		}
	},
	TS_MORPH_TEST_TIMEOUT,
);
