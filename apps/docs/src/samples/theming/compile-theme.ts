import { defineTheme } from '@luke-ui/react/theme/compiler';
import { writeFile } from 'node:fs/promises';
import { theme } from './theme.ts';

await writeFile('src/theme.css', defineTheme(theme));
