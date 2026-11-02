import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext } from 'react';

export type CheckboxGroupErrorMessages = Map<string, ReactNode>;

export const CheckboxGroupErrorMessagesContext = createContext<Dispatch<
	SetStateAction<CheckboxGroupErrorMessages>
> | null>(null);
