import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import type { SprinklesFn } from './create-runtime-fn.js';
import { createRuntimeFn } from './create-runtime-fn.js';
import type { DefinePropertiesReturn } from './types.js';

export function defineSprinkles<Configs extends ReadonlyArray<DefinePropertiesReturn>>(
	...configs: Configs
): SprinklesFn<Configs> {
	const sprinkles = createRuntimeFn(...configs);
	return addFunctionSerializer(sprinkles, {
		args: configs,
		importName: 'createRuntimeFn',
		// Private alias: `@luke-ui/react` pack/Vitest/docs resolve this to a bundled runtime chunk
		// so the React tarball never requires installing unpublished rainbow-sprinkles.
		importPath: '#rainbow-sprinkles-runtime',
	}) as SprinklesFn<Configs>;
}
