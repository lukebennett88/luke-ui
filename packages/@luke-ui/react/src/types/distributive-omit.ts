export type DistributiveOmit<T, K extends PropertyKey> = T extends any
	? Omit<T, Extract<K, keyof T>>
	: never;
