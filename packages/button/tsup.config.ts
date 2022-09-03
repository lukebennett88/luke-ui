import { getPackageInfo, getTsupConfig } from '@luke-ui-internal/dev/tsup.js';
import type { defineConfig } from 'tsup';

type TsupConfig = ReturnType<typeof defineConfig>;

const packageInfo = getPackageInfo(__dirname);

const tsupConfig: TsupConfig = getTsupConfig('src/index.ts', {
	packageName: packageInfo.name,
	packageVersion: packageInfo.version,
});

export default tsupConfig;
