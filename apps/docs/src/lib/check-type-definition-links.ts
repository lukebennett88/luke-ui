import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

/** One ComponentPropsTable in a built page module and the asset it fetches. */
export interface BuiltTypeDefinitionTable {
	/** Built asset filename under `assets/`, such as `d2c3244b0048d66c-BJbW00LW.json`. */
	assetFile: string;
	/** Names the table registers for popovers. */
	definitionNames: Array<string>;
	/** Page module that owns the table, relative to the assets directory. */
	pageModule: string;
}

const TABLE_PATTERN = /definitionsHref:([A-Za-z_$][\w$]*),definitionNames:\[((?:`[^`]*`,?)*)\]/g;
const DIRECT_HREF_PATTERN = /([A-Za-z_$][\w$]*)=`(\/assets\/[0-9a-f]{16}-[^`]+\.json)`/g;
const URL_MODULE_IMPORT_PATTERN =
	/import\s*\{\s*(?:t as ([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*) as t|(t))\s*\}\s*from\s*"(\.\/[^"]+)"/g;
const URL_MODULE_EXPORT_PATTERN = /=`(\/assets\/[0-9a-f]{16}-[^`]+\.json)`/;
const TYPE_DEFINITION_ASSET_PATTERN = /^[0-9a-f]{16}-.+\.json$/;

/**
 * Reads every generated props table in the built client assets and reports broken type-definition
 * links: missing assets, missing definition keys, and tables that load another table's definitions.
 */
export function findTypeDefinitionLinkIssues(clientAssetsDir: string): Array<string> {
	const tables = findBuiltTypeDefinitionTables(clientAssetsDir);
	const issues: Array<string> = [];
	const referencedAssets = new Set<string>();

	if (tables.length === 0) {
		return ['no generated ComponentPropsTable with definitionsHref found in client assets'];
	}

	for (const table of tables) {
		if (table.assetFile === '') {
			issues.push(
				`${table.pageModule}: could not resolve definitionsHref for names [${table.definitionNames.join(', ')}]`,
			);
			continue;
		}

		const assetPath = join(clientAssetsDir, table.assetFile);
		referencedAssets.add(table.assetFile);

		if (!existsSync(assetPath)) {
			issues.push(
				`${table.pageModule}: definitionsHref points at missing asset ${table.assetFile}`,
			);
			continue;
		}

		const raw = readFileSync(assetPath, 'utf8');
		const sourceHash = table.assetFile.slice(0, 16);
		const contentHash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
		// Content-hash names prevent two different definition payloads from sharing a file. A
		// mismatch means the shipped filename no longer identifies its contents.
		if (sourceHash !== contentHash) {
			issues.push(
				`${table.pageModule}: asset ${table.assetFile} content hash does not match its name`,
			);
		}

		let asset: Record<string, { definition?: unknown; resolved?: unknown }>;
		try {
			asset = JSON.parse(raw) as typeof asset;
		} catch {
			issues.push(`${table.pageModule}: ${table.assetFile} is not valid JSON`);
			continue;
		}

		for (const name of table.definitionNames) {
			const entry = asset[name];
			if (entry === undefined) {
				issues.push(
					`${table.pageModule}: definitionNames includes "${name}" absent from ${table.assetFile}`,
				);
				continue;
			}
			if (entry.definition === undefined && entry.resolved === undefined) {
				issues.push(
					`${table.pageModule}: "${name}" in ${table.assetFile} has no definition or resolved tokens`,
				);
			}
		}
	}

	for (const file of readdirSync(clientAssetsDir)) {
		if (!TYPE_DEFINITION_ASSET_PATTERN.test(file)) continue;
		if (!referencedAssets.has(file)) {
			issues.push(`${file}: type-definition asset is not referenced by any page module`);
		}
	}

	return issues;
}

/** Collects every built table that defers its type definitions to a JSON asset. */
export function findBuiltTypeDefinitionTables(
	clientAssetsDir: string,
): Array<BuiltTypeDefinitionTable> {
	const tables: Array<BuiltTypeDefinitionTable> = [];

	for (const file of readdirSync(clientAssetsDir)) {
		if (!file.endsWith('.js')) continue;
		const source = readFileSync(join(clientAssetsDir, file), 'utf8');
		if (!source.includes('definitionNames:')) continue;

		const hrefByVar = resolveDefinitionsHrefs(clientAssetsDir, source);

		for (const match of source.matchAll(TABLE_PATTERN)) {
			const hrefVar = match[1]!;
			const definitionNames = parseBacktickArray(match[2]!);
			const href = hrefByVar.get(hrefVar);
			tables.push({
				assetFile: href === undefined ? '' : basename(href),
				definitionNames,
				pageModule: file,
			});
		}
	}

	return tables;
}

/**
 * Maps each local binding that holds a definitions URL, whether the page inlines the URL or imports
 * a small module that re-exports it.
 */
function resolveDefinitionsHrefs(clientAssetsDir: string, source: string): Map<string, string> {
	const hrefByVar = new Map<string, string>();

	for (const match of source.matchAll(DIRECT_HREF_PATTERN)) {
		hrefByVar.set(match[1]!, match[2]!);
	}

	for (const match of source.matchAll(URL_MODULE_IMPORT_PATTERN)) {
		const localName = match[1] ?? match[2] ?? match[3];
		const specifier = match[4];
		if (localName === undefined || specifier === undefined) continue;
		const modulePath = join(clientAssetsDir, basename(specifier));
		if (!existsSync(modulePath)) continue;
		const moduleSource = readFileSync(modulePath, 'utf8');
		const href = moduleSource.match(URL_MODULE_EXPORT_PATTERN)?.[1];
		if (href !== undefined) hrefByVar.set(localName, href);
	}

	return hrefByVar;
}

function parseBacktickArray(inner: string): Array<string> {
	return [...inner.matchAll(/`([^`]*)`/g)].map((match) => match[1]!);
}
