import { createContext, use } from 'react';
import type { ControlSize } from './control-size.js';

export const ControlSizeContext = createContext<ControlSize>('medium');

export function useControlSize(size?: ControlSize): ControlSize {
	const inheritedSize = use(ControlSizeContext);
	return size ?? inheritedSize;
}
