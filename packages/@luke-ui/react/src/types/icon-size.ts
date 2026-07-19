import type { SizeToken } from '../../styled-system/tokens/index.mjs';

type IconSizeOf<Token> = Token extends `iconSize.${infer Size}` ? Size : never;

/** Semantic icon-size steps shared by icon-sized components, derived from the size tokens. */
export type IconSize = IconSizeOf<SizeToken>;
