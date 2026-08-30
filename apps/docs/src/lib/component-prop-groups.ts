export const PROP_GROUP_ORDER = [
	'Component props',
	'Events',
	'Styling',
	'Forms',
	'Accessibility',
	'Advanced',
] as const;

export type PropGroupName = (typeof PROP_GROUP_ORDER)[number];

/**
 * Synthetic entry name the component props generator adds to a `type` record to carry whether the
 * type forwards native DOM props, since the record otherwise holds only documented prop entries.
 */
export const NATIVE_PROPS_FORWARDING_KEY = '__nativePropsForwarding';

/** Sentence shown above a type's prop groups when it forwards native DOM and ARIA props. */
export function renderNativePropsNote(typeName: string): string {
	return `\`${typeName}\` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.`;
}

const EVENT_PROP = /^on[A-Z]/;
const ARIA_PROP = /^aria(-|[A-Z])/;

const FORM_PROPS = new Set([
	'autoComplete',
	'autoFocus',
	'defaultValue',
	'enterKeyHint',
	'form',
	'formAction',
	'formEncType',
	'formMethod',
	'formNoValidate',
	'formTarget',
	'inputMode',
	'isDisabled',
	'isReadOnly',
	'isRequired',
	'max',
	'maxLength',
	'min',
	'minLength',
	'name',
	'pattern',
	'step',
	'type',
	'validationBehavior',
	'value',
]);

const STYLING_PROPS = new Set(['className', 'style', 'UNSAFE_className', 'UNSAFE_style']);

const ADVANCED_PROPS = new Set([
	'children',
	'dangerouslySetInnerHTML',
	'elementType',
	'id',
	'inert',
	'key',
	'popover',
	'ref',
	'render',
	'slot',
	'suppressHydrationWarning',
]);

/** Groups visible prop names in the shared documentation order, omitting empty groups and the native-props marker. */
export function groupPropNames(names: ReadonlyArray<string>): ReadonlyArray<{
	defaultOpen: boolean;
	name: PropGroupName;
	props: ReadonlyArray<string>;
}> {
	const buckets = new Map<PropGroupName, Array<string>>();

	for (const name of names) {
		if (name === NATIVE_PROPS_FORWARDING_KEY) continue;
		const group = classifyPropGroup(name);
		const bucket = buckets.get(group) ?? [];
		bucket.push(name);
		buckets.set(group, bucket);
	}

	return PROP_GROUP_ORDER.flatMap((name) => {
		const props = buckets.get(name);
		if (props === undefined || props.length === 0) return [];
		return [
			{
				defaultOpen: name === 'Component props',
				name,
				props: [...props].sort((left, right) => left.localeCompare(right)),
			},
		];
	});
}

/** Classifies a visible prop name into one shared documentation group. */
export function classifyPropGroup(name: string): PropGroupName {
	if (EVENT_PROP.test(name)) return 'Events';
	if (STYLING_PROPS.has(name)) return 'Styling';
	if (FORM_PROPS.has(name)) return 'Forms';
	if (ARIA_PROP.test(name) || name === 'role') return 'Accessibility';
	if (ADVANCED_PROPS.has(name)) return 'Advanced';
	return 'Component props';
}
