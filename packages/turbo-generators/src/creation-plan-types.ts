export interface PlanFile {
	contents: string;
	path: string;
}

interface JsonArrayAddSortedEdit {
	key: 'pages';
	kind: 'array-add-sorted';
	path: string;
	title: string;
	value: string;
}

/**
 * Inserts among entries that share `value`'s `group/` prefix. When none exist, inserts after
 * `sectionHeader`. Throws when that header is absent so the page is never left under another
 * section.
 */
interface JsonArrayAddPrefixSortedEdit {
	key: 'pages';
	kind: 'array-add-prefix-sorted';
	path: string;
	sectionHeader: string;
	title: string;
	value: string;
}

interface JsonArrayAppendUniqueEdit {
	key: 'pages';
	kind: 'array-add-append-unique';
	path: string;
	title: string;
	value: string;
}

type JsonEdit = JsonArrayAddSortedEdit | JsonArrayAddPrefixSortedEdit | JsonArrayAppendUniqueEdit;

interface TextFileInsertEdit {
	kind: 'text-insert';
	lines: Array<string>;
	marker: string;
	path: string;
}

interface ImportEdit {
	kind: 'import';
	line: string;
	path: string;
}

export interface CreationWork {
	files: Array<PlanFile>;
	importEdits: Array<ImportEdit>;
	jsonEdits: Array<JsonEdit>;
	textFileInserts: Array<TextFileInsertEdit>;
}
