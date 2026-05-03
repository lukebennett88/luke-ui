type KeysOfUnion<T> = T extends T ? keyof T : never;

export type DistributiveOmit<T, K extends KeysOfUnion<T>> = T extends any
	? Omit<T, Extract<K, keyof T>>
	: never;
