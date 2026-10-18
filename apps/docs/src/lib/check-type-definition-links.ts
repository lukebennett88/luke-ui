import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { TYPE_TOKEN_KINDS } from './type-tokens.js';

/** One ComponentPropsTable in a built page module and the asset it fetches. */
export interface BuiltTypeDefinitionTable {
	/** Built asset filename under `assets/`, such as `d2c3244b0048d66c-BJbW00LW.json`. */
	assetFile: string;
	/** Names the table registers for popovers. */
	definitionNames: Array<string>;
	/** Page module that owns the table, relative to the assets directory. */
	pageModule: string;
}

/**
 * Asset URLs Vite emits for `?url` imports. Accepts a configured base path such as `/luke-ui/`
 * before `/assets/`.
 */
const ASSET_URL_IN_TEMPLATE_PATTERN = /`((?:\/[^`]*)?\/assets\/([0-9a-f]{16}-[^`]+\.json))`/g;
const DIRECT_HREF_PATTERN =
	/([A-Za-z_$][\w$]*)=`((?:\/[^`]*)?\/assets\/[0-9a-f]{16}-[^`]+\.json)`/g;
const URL_MODULE_IMPORT_PATTERN =
	/import\s*\{\s*(?:t as ([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*) as t|(t))\s*\}\s*from\s*"(\.\/[^"]+)"/g;
const DEFINITION_NAMES_ARRAY_PATTERN = /definitionNames:\[/g;
const TYPE_DEFINITION_ASSET_PATTERN = /^[0-9a-f]{16}-.+\.json$/;
const TYPE_TOKEN_KIND_SET = new Set<string>(TYPE_TOKEN_KINDS);

/**
 * Reads every generated props table in the built client assets and reports broken type-definition
 * links: missing assets, missing definition keys, empty or malformed tokens, and tables that load
 * another table's definitions.
 */
export function findTypeDefinitionLinkIssues(clientAssetsDir: string): Array<string> {
	const { expectedTableCount, tables } = findBuiltTypeDefinitionTables(clientAssetsDir);
	const issues: Array<string> = [];
	const referencedAssets = new Set<string>();

	if (expectedTableCount === 0) {
		return ['no generated ComponentPropsTable with definitionsHref found in client assets'];
	}

	if (tables.length !== expectedTableCount) {
		issues.push(
			`discovered ${String(tables.length)} API table(s) but found ${String(expectedTableCount)} definitionNames array(s)`,
		);
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

		let asset: unknown;
		try {
			asset = JSON.parse(raw);
		} catch {
			issues.push(`${table.pageModule}: ${table.assetFile} is not valid JSON`);
			continue;
		}

		if (!isRecord(asset)) {
			issues.push(`${table.pageModule}: ${table.assetFile} is not a definitions object`);
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
			const entryIssues = findDefinitionEntryIssues(entry, name, table.assetFile);
			issues.push(...entryIssues.map((issue) => `${table.pageModule}: ${issue}`));
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
export function findBuiltTypeDefinitionTables(clientAssetsDir: string): {
	expectedTableCount: number;
	tables: Array<BuiltTypeDefinitionTable>;
} {
	const tables: Array<BuiltTypeDefinitionTable> = [];
	let expectedTableCount = 0;

	for (const file of readdirSync(clientAssetsDir)) {
		if (!file.endsWith('.js')) continue;
		const source = readFileSync(join(clientAssetsDir, file), 'utf8');
		if (!source.includes('definitionNames:[')) continue;

		const hrefByVar = resolveDefinitionsHrefs(clientAssetsDir, source);
		const pageTables = findTablesInModule(source, hrefByVar, file);
		expectedTableCount += pageTables.expectedTableCount;
		tables.push(...pageTables.tables);
	}

	return { expectedTableCount, tables };
}

/**
 * Finds each `definitionNames:[…]` array in a page module. Props may appear in any order inside the
 * surrounding object, including with other keys between them.
 */
function findTablesInModule(
	source: string,
	hrefByVar: Map<string, string>,
	pageModule: string,
): { expectedTableCount: number; tables: Array<BuiltTypeDefinitionTable> } {
	const tables: Array<BuiltTypeDefinitionTable> = [];
	let expectedTableCount = 0;

	for (const match of source.matchAll(DEFINITION_NAMES_ARRAY_PATTERN)) {
		expectedTableCount += 1;
		const arrayStart = match.index + 'definitionNames:'.length;
		const names = parseStringArrayLiteral(source, arrayStart);
		if (names === undefined) continue;

		const objectSource = enclosingObjectSource(source, match.index);
		const hrefVar =
			objectSource === undefined
				? undefined
				: objectSource.match(/definitionsHref:([A-Za-z_$][\w$]*)/)?.[1];
		const href = hrefVar === undefined ? undefined : hrefByVar.get(hrefVar);
		tables.push({
			assetFile: href === undefined ? '' : assetFileName(href),
			definitionNames: names,
			pageModule,
		});
	}

	return { expectedTableCount, tables };
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
		for (const urlMatch of moduleSource.matchAll(ASSET_URL_IN_TEMPLATE_PATTERN)) {
			hrefByVar.set(localName, urlMatch[1]!);
		}
	}

	return hrefByVar;
}

/** Filename of a definitions asset URL, ignoring any Vite base path prefix. */
function assetFileName(href: string): string {
	const match = href.match(/\/assets\/([0-9a-f]{16}-[^/]+\.json)$/);
	return match?.[1] ?? basename(href);
}

/**
 * Returns the object-literal text that contains `index`, or undefined when braces are unbalanced.
 * Walks outward from the nearest `{` before the index.
 */
function enclosingObjectSource(source: string, index: number): string | undefined {
	let depth = 0;
	let start = -1;
	for (let cursor = index; cursor >= 0; cursor -= 1) {
		const character = source[cursor];
		if (character === '}') depth += 1;
		else if (character === '{') {
			if (depth === 0) {
				start = cursor;
				break;
			}
			depth -= 1;
		}
	}
	if (start === -1) return undefined;

	depth = 0;
	for (let cursor = start; cursor < source.length; cursor += 1) {
		const character = source[cursor];
		if (character === '{') depth += 1;
		else if (character === '}') {
			depth -= 1;
			if (depth === 0) return source.slice(start, cursor + 1);
		}
	}
	return undefined;
}

/**
 * Parses a JS array of string literals starting at `[`. Supports backtick and quote delimiters so
 * names such as `SprinklesProps['gap']` stay intact.
 */
function parseStringArrayLiteral(source: string, arrayStart: number): Array<string> | undefined {
	if (source[arrayStart] !== '[') return undefined;
	const names: Array<string> = [];
	let cursor = arrayStart + 1;

	while (cursor < source.length) {
		const character = source.at(cursor);
		if (character === undefined) return undefined;
		if (character === ']') return names;
		if (character === ',' || /\s/.test(character)) {
			cursor += 1;
			continue;
		}
		if (character === '`' || character === '"' || character === "'") {
			const closing = source.indexOf(character, cursor + 1);
			if (closing === -1) return undefined;
			names.push(source.slice(cursor + 1, closing));
			cursor = closing + 1;
			continue;
		}
		return undefined;
	}
	return undefined;
}

function findDefinitionEntryIssues(entry: unknown, name: string, assetFile: string): Array<string> {
	if (!isRecord(entry)) {
		return [`"${name}" in ${assetFile} is not a definition entry`];
	}

	const { definition, resolved } = entry;
	if (definition === undefined && resolved === undefined) {
		return [`"${name}" in ${assetFile} has no definition or resolved tokens`];
	}

	const issues: Array<string> = [];
	if (definition !== undefined && !isUsableTypeTokens(definition)) {
		issues.push(`"${name}" in ${assetFile} has empty or malformed definition tokens`);
	}
	if (resolved !== undefined && !isUsableTypeTokens(resolved)) {
		issues.push(`"${name}" in ${assetFile} has empty or malformed resolved tokens`);
	}
	return issues;
}

/** Tokens a popover can render: a non-empty array of the build's type-token shapes. */
function isUsableTypeTokens(value: unknown): boolean {
	if (!Array.isArray(value) || value.length === 0) return false;
	return value.every(isTypeToken);
}

function isTypeToken(value: unknown): boolean {
	if (typeof value === 'number') return Number.isInteger(value) && value >= 0;
	if (typeof value === 'string') return true;
	if (!Array.isArray(value) || value.length < 2 || value.length > 3) return false;
	const [kind, text, typeName] = value;
	if (typeof kind !== 'string' || !TYPE_TOKEN_KIND_SET.has(kind)) return false;
	if (typeof text !== 'string') return false;
	if (value.length === 3 && typeof typeName !== 'string') return false;
	return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
