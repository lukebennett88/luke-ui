import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import {
	findBuiltTypeDefinitionTables,
	findTypeDefinitionLinkIssues,
} from './check-type-definition-links.js';

const roots: Array<string> = [];

afterEach(() => {
	for (const root of roots) rmSync(root, { force: true, recursive: true });
	roots.length = 0;
});

describe('findTypeDefinitionLinkIssues', () => {
	it('accepts every table whose definitionNames resolve in its content-hashed asset', () => {
		const root = createAssetsRoot();
		const componentAsset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
			Prominence: { definition: [['k', 'type'], ' ', ['t', 'Prominence'], ';'] },
		});
		const primitiveAsset = writeAsset(root, {
			Prominence: { definition: [['k', 'type'], ' ', ['t', 'Prominence'], ';'] },
		});

		writePageModule(root, 'button-component.js', {
			definitionNames: ['Prominence', 'PressAction'],
			href: `/assets/${componentAsset}`,
			hrefVar: 'r',
		});
		writePageModule(root, 'button-primitive.js', {
			definitionNames: ['Prominence'],
			href: `/assets/${primitiveAsset}`,
			hrefVar: 'n',
			viaUrlModule: true,
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([]);
		expect(findBuiltTypeDefinitionTables(root).tables).toHaveLength(2);
	});

	it('resolves definitions URLs that include a Vite base path', () => {
		const root = createAssetsRoot();
		const asset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
		});
		writePageModule(root, 'base-path.js', {
			definitionNames: ['PressAction'],
			href: `/luke-ui/assets/${asset}`,
			hrefVar: 'r',
		});
		writePageModule(root, 'base-path-imported.js', {
			definitionNames: ['PressAction'],
			href: `/luke-ui/assets/${asset}`,
			hrefVar: 'n',
			viaUrlModule: true,
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([]);
		expect(findBuiltTypeDefinitionTables(root).tables.map((table) => table.assetFile)).toEqual([
			asset,
			asset,
		]);
	});

	it('discovers tables when other props sit between definitionsHref and definitionNames', () => {
		const root = createAssetsRoot();
		const asset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
			Prominence: { definition: [['k', 'type'], ' ', ['t', 'Prominence'], ';'] },
		});
		writeFileSync(
			join(root, 'reordered.js'),
			[
				`var r=\`/assets/${asset}\`;`,
				'function render(){',
				`return {definitionsHref:r,id:"button-props",definitionNames:[\`Prominence\`,\`PressAction\`]}`,
				'}',
				'',
			].join('\n'),
		);

		expect(findTypeDefinitionLinkIssues(root)).toEqual([]);
		expect(findBuiltTypeDefinitionTables(root).tables).toEqual([
			{
				assetFile: asset,
				definitionNames: ['Prominence', 'PressAction'],
				pageModule: 'reordered.js',
			},
		]);
	});

	it('fails when a definitionNames array is present but cannot be paired with a table', () => {
		const root = createAssetsRoot();
		const asset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
		});
		// One table is fully wired. A second definitionNames array is emitted without a parseable
		// string list, so discovery discovers fewer tables than definitionNames markers — the shared
		// asset would otherwise hide the gap.
		writeFileSync(
			join(root, 'partial.js'),
			[
				`var r=\`/assets/${asset}\`;`,
				`function ok(){return {definitionsHref:r,definitionNames:[\`PressAction\`]}}`,
				'function broken(){return {definitionsHref:r,id:"other",definitionNames:[PressAction]}}',
				'',
			].join('\n'),
		);

		expect(findTypeDefinitionLinkIssues(root)).toEqual([
			'discovered 1 API table(s) but found 2 definitionNames array(s)',
		]);
	});

	it('fails when a page registers a name absent from its definitions asset', () => {
		const root = createAssetsRoot();
		const prominenceOnlyAsset = writeAsset(root, {
			Prominence: { definition: [['k', 'type'], ' ', ['t', 'Prominence'], ';'] },
		});
		writePageModule(root, 'button-component.js', {
			definitionNames: ['Prominence', 'PressAction'],
			href: `/assets/${prominenceOnlyAsset}`,
			hrefVar: 'r',
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([
			`button-component.js: definitionNames includes "PressAction" absent from ${prominenceOnlyAsset}`,
		]);
	});

	it('fails when the definitions asset is missing', () => {
		const root = createAssetsRoot();
		writePageModule(root, 'missing-asset.js', {
			definitionNames: ['PressAction'],
			href: '/assets/aaaaaaaaaaaaaaaa-missing.json',
			hrefVar: 'r',
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([
			'missing-asset.js: definitionsHref points at missing asset aaaaaaaaaaaaaaaa-missing.json',
		]);
	});

	it('fails when a content-hashed asset is renamed without rewriting its contents', () => {
		const root = createAssetsRoot();
		const asset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
		});
		const collidingName = 'bbbbbbbbbbbbbbbb-stolen.json';
		writeFileSync(join(root, collidingName), readAsset(root, asset));
		rmSync(join(root, asset));
		writePageModule(root, 'stolen-hash.js', {
			definitionNames: ['PressAction'],
			href: `/assets/${collidingName}`,
			hrefVar: 'r',
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([
			`stolen-hash.js: asset ${collidingName} content hash does not match its name`,
		]);
	});

	it('fails when a registered definition has empty or malformed tokens', () => {
		const root = createAssetsRoot();
		const emptyAsset = writeAsset(root, {
			PressAction: { definition: [] },
		});
		const malformedAsset = writeAsset(root, {
			PressAction: { definition: [['x', 'PressAction']] },
		});
		writePageModule(root, 'empty-tokens.js', {
			definitionNames: ['PressAction'],
			href: `/assets/${emptyAsset}`,
			hrefVar: 'r',
		});
		writePageModule(root, 'malformed-tokens.js', {
			definitionNames: ['PressAction'],
			href: `/assets/${malformedAsset}`,
			hrefVar: 'r',
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([
			`empty-tokens.js: "PressAction" in ${emptyAsset} has empty or malformed definition tokens`,
			`malformed-tokens.js: "PressAction" in ${malformedAsset} has empty or malformed definition tokens`,
		]);
	});

	it('only requires definitions for names listed in definitionNames', () => {
		const root = createAssetsRoot();
		const asset = writeAsset(root, {
			PressAction: { definition: [['k', 'type'], ' ', ['t', 'PressAction'], ';'] },
		});
		writePageModule(root, 'registered-only.js', {
			definitionNames: ['PressAction'],
			href: `/assets/${asset}`,
			hrefVar: 'r',
		});

		expect(findTypeDefinitionLinkIssues(root)).toEqual([]);
	});
});

function createAssetsRoot(): string {
	const root = mkdtempSync(join(tmpdir(), 'type-definition-links-'));
	roots.push(root);
	return root;
}

function writeAsset(
	root: string,
	definitions: Record<string, { definition?: unknown; resolved?: unknown }>,
): string {
	const json = `${JSON.stringify(definitions)}\n`;
	const hash = createHash('sha256').update(json).digest('hex').slice(0, 16);
	const fileName = `${hash}-fixture.json`;
	writeFileSync(join(root, fileName), json);
	return fileName;
}

function readAsset(root: string, fileName: string): string {
	return readFileSync(join(root, fileName), 'utf8');
}

function writePageModule(
	root: string,
	fileName: string,
	options: {
		definitionNames: Array<string>;
		href: string;
		hrefVar: string;
		viaUrlModule?: boolean;
	},
): void {
	const names = options.definitionNames.map((name) => `\`${name}\``).join(',');
	if (options.viaUrlModule) {
		const urlModule = `${assetStem(options.href)}-url.js`;
		writeFileSync(join(root, urlModule), `var e=\`${options.href}\`;export{e as t};\n`);
		writeFileSync(
			join(root, fileName),
			[
				`import{t as ${options.hrefVar}}from"./${urlModule}";`,
				`function render(){return {definitionsHref:${options.hrefVar},definitionNames:[${names}]}}`,
				'',
			].join('\n'),
		);
		return;
	}

	writeFileSync(
		join(root, fileName),
		[
			`var ${options.hrefVar}=\`${options.href}\`;`,
			`function render(){return {definitionsHref:${options.hrefVar},definitionNames:[${names}]}}`,
			'',
		].join('\n'),
	);
}

function assetStem(href: string): string {
	const file = href.match(/\/assets\/([0-9a-f]{16}-[^/]+\.json)$/)?.[1] ?? href;
	return file.slice(0, 16);
}
