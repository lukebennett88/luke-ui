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

interface TextFileInsertEdit {
	kind: 'text-insert';
	lines: Array<string>;
	marker: string;
	path: string;
}

interface SortedImportEdit {
	kind: 'sorted-import';
	line: string;
	path: string;
}

export interface CreationWork {
	files: Array<PlanFile>;
	jsonEdits: Array<JsonArrayAddSortedEdit>;
	sortedImportEdits: Array<SortedImportEdit>;
	textFileInserts: Array<TextFileInsertEdit>;
}
