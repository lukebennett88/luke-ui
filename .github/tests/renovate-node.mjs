import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';

// Run with RENOVATE_DIR pointing to the installed, pinned Renovate package.
const root = process.env.RENOVATE_DIR;
assert.ok(root, 'Set RENOVATE_DIR to the Renovate package directory');
const load = (path) => import(pathToFileURL(`${root}/dist/${path}.js`).href);
const { GlobalConfig } = await load('config/global');
const { getConfig } = await load('config/defaults');
const { generateBranchName } = await load('workers/repository/updates/branch-name');
const { parseFileConfig } = await load('config/parse');
const { parseSingleYaml } = await load('util/yaml');
const { extractPnpmWorkspaceFile } = await load('modules/manager/npm/extract/pnpm');
const { extractPackageFile } = await load('modules/manager/github-actions/extract');
const { extractPackageJson } = await load('modules/manager/npm/extract/common/package-file');
const { applyPackageRules } = await load('util/package-rules/index');
const { api } = await load('modules/versioning/node/index');
const { updateDependency } = await load('modules/manager/npm/update/dependency/index');
const { doAutoReplace } = await load('workers/repository/update/branch/auto-replace');
const parsedConfig = parseFileConfig(
	'.github/renovate.json5',
	await readFile('.github/renovate.json5', 'utf8'),
);
assert.equal(parsedConfig.success, true);
const config = parsedConfig.parsedContents;
GlobalConfig.set({ localDir: process.cwd() });

const workflowPath = '.github/workflows/visual-regression.yml';
const workflow = `name: Node fixture
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v7
        with:
          node-version: '24'
`;

const workflowDeps = await extractPackageFile(workflow, workflowPath);
const actionNode = workflowDeps.deps.find(
	(dep) => dep.depType === 'uses-with' && dep.depName === 'node',
);
assert.equal(actionNode.packageName, 'actions/node-versions');
assert.equal(actionNode.currentValue, '24');
const manifest = {
	devEngines: { runtime: { name: 'node', version: '^24.0.0', onFail: 'download' } },
};
const npmNode = extractPackageJson(manifest, 'package.json').deps.find(
	(dep) => dep.depType === 'devEngines.runtime' && dep.depName === 'node',
);
assert.equal(npmNode.currentValue, '^24.0.0');

const apply = (dep, manager, updateType) =>
	applyPackageRules({
		...config,
		...dep,
		packageName: dep.packageName ?? dep.depName,
		manager,
		updateType,
	});
const [minor, patch] = await Promise.all(
	['minor', 'patch'].map((type) => apply(npmNode, 'npm', type)),
);
assert.equal(minor.enabled, false);
assert.equal(patch.enabled, false);
const npmMajor = await apply(npmNode, 'npm', 'major');
assert.equal(npmMajor.groupName, 'node');
assert.equal(npmMajor.automerge, false);
assert.equal(npmMajor.rangeStrategy, 'replace');
const newValue = api.getNewValue({
	currentValue: actionNode.currentValue,
	currentVersion: '24.22.2',
	newVersion: '26.13.0',
	rangeStrategy: 'replace',
});
assert.equal(newValue, '26');
const scratch = await mkdtemp(join(tmpdir(), 'renovate-node-'));
try {
	GlobalConfig.set({ localDir: scratch });
	const depIndex = workflowDeps.deps.indexOf(actionNode);
	const updated = await doAutoReplace(
		{ ...actionNode, depIndex, manager: 'github-actions', packageFile: workflowPath, newValue },
		workflow,
		false,
	);
	assert.equal(
		(await extractPackageFile(updated, workflowPath)).deps.find(
			(dep) => dep.depType === 'uses-with' && dep.depName === 'node',
		).currentValue,
		'26',
	);
} finally {
	await rm(scratch, { recursive: true, force: true });
}
const npmNewValue = api.getNewValue({
	currentValue: npmNode.currentValue,
	currentVersion: '24.22.2',
	newVersion: '26.13.0',
	rangeStrategy: npmMajor.rangeStrategy,
});
assert.equal(npmNewValue, '^26.0.0');
const updatedManifest = updateDependency({
	fileContent: JSON.stringify(manifest, null, 2),
	packageFile: 'package.json',
	upgrade: { ...npmNode, newValue: npmNewValue },
});
assert.equal(JSON.parse(updatedManifest).devEngines.runtime.version, '^26.0.0');
// Check the actual declarations without fixing the project to a particular Node major.
const actualManifest = JSON.parse(await readFile('package.json', 'utf8'));
const workspace = parseSingleYaml(await readFile('pnpm-workspace.yaml', 'utf8'));
assert.equal(actualManifest.devEngines.runtime.name, 'node');
assert.equal(actualManifest.volta?.node, undefined);
const runtimeVersion = actualManifest.devEngines.runtime.version;
const typesVersion = workspace.catalog['@types/node'];
const majorOfCaret = (value) => {
	const match = /^\^(\d+)\.\d+\.\d+$/.exec(value);
	assert.ok(match, `Expected a caret range, got ${value}`);
	return Number(match[1]);
};
const assertMatchingMajors = (runtime, typesRange) =>
	assert.equal(
		majorOfCaret(runtime),
		majorOfCaret(typesRange),
		'Node and @types/node majors must match',
	);
assertMatchingMajors(runtimeVersion, typesVersion);
assertMatchingMajors('^24.0.0', '^24.19.2');
assertMatchingMajors('^26.0.0', '^26.13.0');
assert.throws(() => assertMatchingMajors('^26.0.0', '^24.19.2'));
assert.throws(() => assertMatchingMajors('^24.0.0', '>=24'));

GlobalConfig.set({ localDir: process.cwd() });
const types = (await extractPnpmWorkspaceFile(workspace, 'pnpm-workspace.yaml')).deps.find(
	(dep) => dep.depName === '@types/node' && dep.depType === 'pnpm.catalog.default',
);
assert.ok(types);
const typesMajor = await apply(types, 'npm', 'major');
assert.equal(typesMajor.groupName, npmMajor.groupName);
assert.equal(typesMajor.automerge, false);
assert.equal(typesMajor.allowedVersions, undefined);
const nodeBranch = { ...getConfig(), ...npmMajor, updateType: 'major', newMajor: 26 };
const typesBranch = { ...getConfig(), ...typesMajor, updateType: 'major', newMajor: 26 };
generateBranchName(nodeBranch);
generateBranchName(typesBranch);
assert.equal(nodeBranch.branchName, typesBranch.branchName);
assert.equal(
	api.getNewValue({
		currentValue: '^24.19.2',
		currentVersion: '24.19.2',
		newVersion: '26.0.0',
		rangeStrategy: typesMajor.rangeStrategy,
	}),
	'^26.0.0',
);
const typesMinor = await apply(types, 'npm', 'minor');
assert.equal(typesMinor.groupName, 'type definitions');
assert.equal(typesMinor.automerge, true);

const workflows = (await readdir('.github/workflows')).filter((filename) =>
	/\.ya?ml$/.test(filename),
);
const workflowContents = await Promise.all(
	workflows.map(async (filename) => ({
		filename,
		workflow: parseSingleYaml(await readFile(`.github/workflows/${filename}`, 'utf8')),
	})),
);
let setupNodeCount = 0;
for (const { filename, workflow: workflowFile } of workflowContents) {
	for (const job of Object.values(workflowFile.jobs ?? {})) {
		for (const step of job.steps ?? []) {
			if (!(step.uses ?? '').startsWith('actions/setup-node@')) continue;
			setupNodeCount += 1;
			assert.equal(step.with?.['node-version-file'], 'package.json', filename);
			assert.equal(step.with?.['node-version'], undefined, filename);
		}
	}
}
assert.ok(setupNodeCount > 0);
process.stdout.write('Renovate Node extraction and update checks passed\n');
