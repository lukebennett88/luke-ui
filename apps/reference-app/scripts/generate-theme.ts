import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTheme } from '@luke-ui/react/theme';
import { mkdir, writeFile } from 'node:fs/promises';
import { referenceThemeInput } from '../src/theme/input.js';

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/generated/theme.css');

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, defineTheme(referenceThemeInput));
