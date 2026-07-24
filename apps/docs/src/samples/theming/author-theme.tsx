import { defineTheme } from '@luke-ui/react/theme';
import type { ThemeInput } from '@luke-ui/react/theme';
import { writeFile } from 'node:fs/promises';

export async function writeTheme(input: ThemeInput) {
	await writeFile('src/product-theme.css', defineTheme(input));
}
