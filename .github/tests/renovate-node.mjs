import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';

// Run with RENOVATE_DIR pointing to the installed, pinned Renovate package.
const root = process.env.RENOVATE_DIR;
assert.ok(root, 'Set RENOVATE_DIR to the Renovate package directory');
const load = (path) => import(pathToFileURL(`${root}/dist/${path}.js`).href);
const require = createRequire(`${root}/package.json`);
const { GlobalConfig } = await load('config/global');
const { extractPackageFile } = await load('modules/manager/github-actions/extract');
const { extractPackageJson } = await load('modules/manager/npm/extract/common/package-file');
const { applyPackageRules } = await load('util/package-rules/index');
const { api } = await load('modules/versioning/node/index');
const { updateDependency } = await load('modules/manager/npm/update/dependency/index');
const { doAutoReplace } = await load('workers/repository/update/branch/auto-replace');
const config = require('json5').parse(await readFile('.github/renovate.json5', 'utf8'));
GlobalConfig.set({ localDir: process.cwd() });

const workflowPath = '.github/workflows/visual-regression.yml';
const workflow = await readFile(workflowPath, 'utf8');
const workflowDeps = await extractPackageFile(workflow, workflowPath);
const actionNode = workflowDeps.deps.find(
	(dep) => dep.depType === 'uses-with' && dep.depName === 'node',
);
assert.equal(actionNode.packageName, 'actions/node-versions');
assert.equal(actionNode.currentValue, '24');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
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
await Promise.all(
	[
		[actionNode, 'github-actions'],
		[npmNode, 'npm'],
	].map(async ([dep, manager]) => {
		const [minor, patch, major] = await Promise.all(
			['minor', 'patch', 'major'].map((updateType) => apply(dep, manager, updateType)),
		);
		assert.equal(minor.enabled, false, `${manager} minor`);
		assert.equal(patch.enabled, false, `${manager} patch`);
		assert.equal(major.groupName, 'node');
		assert.equal(major.automerge, false);
		assert.equal(major.rangeStrategy, 'replace');
	}),
);
const actionMajor = await apply(actionNode, 'github-actions', 'major');
const newValue = api.getNewValue({
	currentValue: actionNode.currentValue,
	currentVersion: '24.22.2',
	newVersion: '26.13.0',
	rangeStrategy: actionMajor.rangeStrategy,
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
const npmMajor = await apply(npmNode, 'npm', 'major');
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
process.stdout.write('Renovate Node extraction and update checks passed\n');
