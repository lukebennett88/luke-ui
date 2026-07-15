import { buildTheme } from '@luke-ui/react/theme';
import type { ThemeFoundation } from '@luke-ui/react/theme';
import { writeFile } from 'node:fs/promises';

export async function writeTheme(foundation: ThemeFoundation) {
	await writeFile('src/product-theme.css', buildTheme(foundation));
}
