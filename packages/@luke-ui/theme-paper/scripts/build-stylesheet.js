// Compiles the built `./input` into `dist/stylesheet.css`. It imports the published JavaScript,
// not the TypeScript source, so the build exercises the same `./input` consumers install. The import
// is dynamic because `dist` does not exist until `vp pack` writes it.

import { defineTheme } from '@luke-ui/react/theme/compiler';
import { writeFile } from 'node:fs/promises';

const { theme } = await import(new URL('../dist/input.js', import.meta.url).href);

await writeFile(new URL('../dist/stylesheet.css', import.meta.url), defineTheme(theme));
