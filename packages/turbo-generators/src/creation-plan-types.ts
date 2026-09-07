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

interface JsonArrayAppendUniqueEdit {
	key: 'pages';
	kind: 'array-add-append-unique';
	path: string;
	title: string;
	value: string;
}

type JsonEdit = JsonArrayAddSortedEdit | JsonArrayAppendUniqueEdit;

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
