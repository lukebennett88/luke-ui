import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
} from './component-prop-analysis.js';
import type { PropProject } from './component-prop-analysis.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { GUIDE_PROP_AUDIT } from './guide-prop-audit-data.js';
import {
	discoverComponentGuides,
	findGuideCoverageMismatches,
	findGuideTableMismatches,
	flattenAuditedTypes,
	readGuideComponentPropsTables,
} from './guide-prop-audit.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const reactSrcDir = lukeUiReactSrcDir(repoRoot);
const docsComponentsDir = resolve(repoRoot, 'apps/docs/content/docs/components');
const discoveredGuides = discoverComponentGuides(docsComponentsDir);
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

test('every main component guide is represented exactly once in the prop audit', () => {
	const { duplicateAuditGuides, missingAuditGuides, staleAuditGuides } =
		findGuideCoverageMismatches(discoveredGuides, GUIDE_PROP_AUDIT);

	expect(
		{
			discoveredGuides,
			duplicateAuditGuides,
			missingAuditGuides,
			staleAuditGuides,
		},
		'guide coverage must match the on-disk component guides',
	).toEqual({
		discoveredGuides,
		duplicateAuditGuides: [],
		missingAuditGuides: [],
		staleAuditGuides: [],
	});
});

test('every audited API table matches an authored component-props-table tag', () => {
	const missingAuditedTables: Array<string> = [];
	const staleAuditedTables: Array<string> = [];

	for (const entry of GUIDE_PROP_AUDIT) {
		const authoredTables = readGuideComponentPropsTables(docsComponentsDir, entry.guide);
		const mismatches = findGuideTableMismatches(entry.guide, authoredTables, entry.types);
		missingAuditedTables.push(...mismatches.missingAuditedTables);
		staleAuditedTables.push(...mismatches.staleAuditedTables);
	}

	expect(
		{ missingAuditedTables, staleAuditedTables },
		'audit metadata must mirror each guide’s authored API tables',
	).toEqual({
		missingAuditedTables: [],
		staleAuditedTables: [],
	});
});

test.each(flattenAuditedTypes(GUIDE_PROP_AUDIT).filter(({ props }) => props.length > 0))(
	'$guide teaches documented props on $name',
	async ({ guide, name, path, props }) => {
		const names = await visiblePropNames(path, name);
		for (const prop of props) {
			expect(names, `${guide} teaches ${prop} on ${name}`).toContain(prop);
		}
	},
	TS_MORPH_TEST_TIMEOUT,
);

test('guide prop audit completeness fails when a guide entry is removed', () => {
	const incompleteAudit = GUIDE_PROP_AUDIT.slice(1);
	const { missingAuditGuides } = findGuideCoverageMismatches(discoveredGuides, incompleteAudit);
	expect(missingAuditGuides.length).toBeGreaterThan(0);
});

test('guide prop audit metadata fails when an audited API table no longer exists in a guide', () => {
	const comboboxEntry = GUIDE_PROP_AUDIT.find((entry) => entry.guide === 'primitives/combobox.mdx');
	if (comboboxEntry === undefined) {
		throw new Error('Expected combobox guide audit entry');
	}

	const staleAuditTypes = [
		...comboboxEntry.types,
		{
			name: 'RemovedComboboxProps',
			path: 'packages/@luke-ui/react/src/core/primitives/combobox/trigger.tsx',
			props: [],
		},
	];

	const { staleAuditedTables } = findGuideTableMismatches(
		comboboxEntry.guide,
		readGuideComponentPropsTables(docsComponentsDir, comboboxEntry.guide),
		staleAuditTypes,
	);
	expect(staleAuditedTables.length).toBeGreaterThan(0);
});

test('guide prop audit metadata fails when a guide API table is missing from the audit', () => {
	const comboboxEntry = GUIDE_PROP_AUDIT.find((entry) => entry.guide === 'primitives/combobox.mdx');
	if (comboboxEntry === undefined) {
		throw new Error('Expected combobox guide audit entry');
	}

	const incompleteAuditTypes = comboboxEntry.types.filter(
		(type) => type.name !== 'ComboboxTriggerProps',
	);

	const { missingAuditedTables } = findGuideTableMismatches(
		comboboxEntry.guide,
		readGuideComponentPropsTables(docsComponentsDir, comboboxEntry.guide),
		incompleteAuditTypes,
	);
	expect(missingAuditedTables.length).toBeGreaterThan(0);
});

test('prop visibility check fails when a taught prop disappears from generated output', () => {
	const taught = ['cite', 'lineClamp', 'textWrap'];
	const visibleWithoutCite = ['lineClamp', 'textWrap'];
	const missing = taught.filter((prop) => !visibleWithoutCite.includes(prop));
	expect(missing).toEqual(['cite']);
});

/** Every main component guide (not legacy `/props` pages) declares at least one API table. */
test('every main component guide declares a component-props-table', () => {
	const missing = discoveredGuides.filter((guide) => {
		const tables = readGuideComponentPropsTables(docsComponentsDir, guide);
		return tables.length === 0;
	});
	expect(missing).toEqual([]);
});
