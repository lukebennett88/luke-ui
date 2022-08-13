import { getPackageInfo, getTsupConfig } from '@luke-ui-internal/dev/tsup.js';
import type { defineConfig } from 'tsup';

type TsupConfig = ReturnType<typeof defineConfig>;

const { name: packageName, version: packageVersion } =
	getPackageInfo(__dirname);
const tsupConfig: TsupConfig = getTsupConfig('src/index.ts', {
	packageName,
	packageVersion,
});
export default tsupConfig;
