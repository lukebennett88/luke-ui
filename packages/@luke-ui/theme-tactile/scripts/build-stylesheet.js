// Compiles the built `./input` into `dist/stylesheet.css`. It imports the published JavaScript,
// not the TypeScript source, so the build exercises the same `./input` consumers install.

import { defineTheme } from '@luke-ui/react/theme/compiler';
import { writeFile } from 'node:fs/promises';
import { theme } from '../dist/input.js';

await writeFile(new URL('../dist/stylesheet.css', import.meta.url), defineTheme(theme));
