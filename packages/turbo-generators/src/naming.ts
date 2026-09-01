const COMPONENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9-]*$/;
const CAMEL_BOUNDARY_PATTERN = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUM_PATTERN = /[^A-Za-z0-9-]/g;

export function validateScaffoldName(value: unknown): true | string {
	if (typeof value !== 'string') {
		return 'Component name required.';
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return 'Component name required.';
	}
	if (!COMPONENT_NAME_PATTERN.test(trimmed)) {
		return 'Use letters/numbers/hyphens. Start with a letter.';
	}
	return true;
}

export function toKebabCase(value: string): string {
	return value
		.trim()
		.replaceAll(CAMEL_BOUNDARY_PATTERN, '$1-$2')
		.replaceAll(NON_ALPHANUM_PATTERN, '-')
		.toLowerCase();
}

export function toDisplayName(value: string): string {
	return toKebabCase(value)
		.split('-')
		.flatMap((part) => {
			if (!part) return [];

			return [`${part.charAt(0).toUpperCase()}${part.slice(1)}`];
		})
		.join(' ');
}

export function toCamelCase(value: string): string {
	const [first = '', ...rest] = toKebabCase(value).split('-').filter(Boolean);
	return `${first}${rest.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('')}`;
}
