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
		importPath: '@luke-ui/rainbow-sprinkles/create-runtime-fn',
	}) as SprinklesFn<Configs>;
}
