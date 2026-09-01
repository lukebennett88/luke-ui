/** Matches `component-props-table` formatting in hosted component guides — inline under 100 characters, tab-indented otherwise. */
export function renderComponentPropsTable(entry: { name: string; path: string }): string {
	const inline = `<component-props-table path="${entry.path}" name="${entry.name}" />`;
	if (inline.length <= 100) return inline;

	return `<component-props-table\n\tpath="${entry.path}"\n\tname="${entry.name}"\n/>`;
}
