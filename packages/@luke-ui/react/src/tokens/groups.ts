import type { DesignTokenGroup, TokenName } from './index.js';

export function toTokenGroup<TType extends string, TValues extends Record<string, unknown>>(
	type: TType,
	values: TValues,
): DesignTokenGroup<TType, TValues> {
	const group = { $type: type } as DesignTokenGroup<TType, TValues>;

	for (const key in values) {
		(group as Record<string, unknown>)[key] = {
			$value: values[key],
		};
	}

	return group;
}

export function tokenKeys<TGroup extends { $type: string }>(
	group: TGroup,
): Array<TokenName<TGroup>> {
	return (Object.keys(group) as Array<keyof TGroup>).filter(
		(key): key is TokenName<TGroup> => key !== '$type',
	);
}
