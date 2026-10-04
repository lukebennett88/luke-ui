/**
 * Tokenises and validates `grid-template-areas` rows for `Grid`.
 *
 * Follows CSS Grid string tokenisation: whitespace separates cells, runs of `.` are empty cells,
 * runs of ident code points are named cells, and any other character invalidates the row. Named
 * areas must form one filled rectangle each.
 *
 * Only space and tab count as authored whitespace. LF, CR, and FF cannot appear literally inside
 * the quoted CSS string that `formatAreas` emits.
 */

function isAreaWhitespace(codePoint: number): boolean {
	return codePoint === 0x20 || codePoint === 0x09;
}

function isIdentCodePoint(codePoint: number): boolean {
	return (
		(codePoint >= 0x41 && codePoint <= 0x5a) || // A-Z
		(codePoint >= 0x61 && codePoint <= 0x7a) || // a-z
		(codePoint >= 0x30 && codePoint <= 0x39) || // 0-9
		codePoint === 0x5f || // _
		codePoint === 0x2d || // -
		codePoint >= 0x80 // non-ASCII
	);
}

function tokenizeAreaRow(row: string): Array<string | null> | undefined {
	const cells: Array<string | null> = [];
	let index = 0;

	while (index < row.length) {
		const codePoint = row.codePointAt(index);
		if (codePoint === undefined) break;

		if (isAreaWhitespace(codePoint)) {
			index += 1;
			continue;
		}

		if (codePoint === 0x2e) {
			while (index < row.length && row.codePointAt(index) === 0x2e) {
				index += 1;
			}
			cells.push(null);
			continue;
		}

		if (isIdentCodePoint(codePoint)) {
			const start = index;
			index += codePoint > 0xffff ? 2 : 1;
			while (index < row.length) {
				const next = row.codePointAt(index);
				if (next === undefined || !isIdentCodePoint(next)) break;
				index += next > 0xffff ? 2 : 1;
			}
			cells.push(row.slice(start, index));
			continue;
		}

		return undefined;
	}

	return cells.length > 0 ? cells : undefined;
}

function namedAreasAreRectangles(grid: ReadonlyArray<ReadonlyArray<string | null>>): boolean {
	const positionsByName = new Map<string, Array<{ column: number; row: number }>>();

	for (const [rowIndex, row] of grid.entries()) {
		for (const [columnIndex, cell] of row.entries()) {
			if (cell == null) continue;
			const positions = positionsByName.get(cell);
			if (positions) {
				positions.push({ column: columnIndex, row: rowIndex });
			} else {
				positionsByName.set(cell, [{ column: columnIndex, row: rowIndex }]);
			}
		}
	}

	for (const positions of positionsByName.values()) {
		let minRow = Infinity;
		let maxRow = -Infinity;
		let minColumn = Infinity;
		let maxColumn = -Infinity;
		for (const { column, row } of positions) {
			minRow = Math.min(minRow, row);
			maxRow = Math.max(maxRow, row);
			minColumn = Math.min(minColumn, column);
			maxColumn = Math.max(maxColumn, column);
		}
		const boundingBoxArea = (maxRow - minRow + 1) * (maxColumn - minColumn + 1);
		if (positions.length !== boundingBoxArea) return false;
	}

	return true;
}

export function isValidAreas(rows: ReadonlyArray<string>): boolean {
	if (rows.length === 0) return false;

	const grid: Array<ReadonlyArray<string | null>> = [];
	let columnCount: number | undefined;

	for (const row of rows) {
		const cells = tokenizeAreaRow(row);
		if (cells == null) return false;
		if (columnCount === undefined) {
			columnCount = cells.length;
		} else if (cells.length !== columnCount) {
			return false;
		}
		grid.push(cells);
	}

	return namedAreasAreRectangles(grid);
}

export function formatAreas(rows: ReadonlyArray<string>): string {
	return rows.map((row) => `"${row}"`).join(' ');
}
