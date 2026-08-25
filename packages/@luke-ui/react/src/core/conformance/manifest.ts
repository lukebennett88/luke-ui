type ConformanceContract = 'dom' | 'field';
type IntegrationTripwire = 'required' | 'none';
type VisualApplicability = 'applicable' | 'none';

export type ComponentTestManifestEntry = {
	name: string;
	path: string;
	conformance: ReadonlyArray<ConformanceContract>;
	integrationTripwire: IntegrationTripwire;
	visualApplicability: VisualApplicability;
};

// Keep this list explicit. An empty `conformance` list is a deliberate exception, not an omission.
export const componentTestManifest = [
	['Blockquote', 'blockquote', ['dom'], 'none', 'none'],
	['Box', 'box', ['dom'], 'none', 'applicable'],
	['Button', 'button', ['dom'], 'required', 'applicable'],
	['Button primitive', 'primitives/button', ['dom'], 'none', 'none'],
	// Fields take `inputRef` and RAC moves `id` onto the control, so they cannot satisfy `dom`.
	['Checkbox', 'checkbox', ['field'], 'required', 'applicable'],
	// Multi-part field root. RAC moves `id` onto the control.
	['Checkbox primitive', 'primitives/checkbox', [], 'none', 'none'],
	['Code', 'code', ['dom'], 'none', 'none'],
	// Fields take `inputRef` and RAC moves `id` onto the control, so they cannot satisfy `dom`.
	['ComboboxField', 'combobox-field', ['field'], 'required', 'applicable'],
	// Multi-part collection. No single root receives the public DOM props.
	['Combobox primitive', 'primitives/combobox', [], 'none', 'none'],
	['Em', 'em', ['dom'], 'none', 'none'],
	['Emoji', 'emoji', ['dom'], 'none', 'applicable'],
	// Multi-part composition. No single root is the documented element.
	['Field primitive', 'primitives/field', [], 'none', 'none'],
	['Heading', 'heading', ['dom'], 'none', 'applicable'],
	// Public props are a closed set. `ref` and `data-*` are not forwarded.
	['Icon', 'icon', [], 'none', 'applicable'],
	['IconButton', 'icon-button', ['dom'], 'required', 'applicable'],
	// Multi-part composition. No single root is the documented element.
	['Input group primitive', 'primitives/input-group', [], 'none', 'none'],
	['Kbd', 'kbd', ['dom'], 'none', 'none'],
	['Link', 'link', ['dom'], 'required', 'applicable'],
	['LoadingSkeleton', 'loading-skeleton', ['dom'], 'none', 'applicable'],
	['LoadingSpinner', 'loading-spinner', ['dom'], 'none', 'applicable'],
	['Numeral', 'numeral', ['dom'], 'none', 'applicable'],
	['Prose', 'prose', ['dom'], 'none', 'applicable'],
	['Quote', 'quote', ['dom'], 'none', 'none'],
	['Strong', 'strong', ['dom'], 'none', 'none'],
	['Text', 'text', ['dom'], 'none', 'applicable'],
	// Fields take `inputRef` and RAC moves `id` onto the control, so they cannot satisfy `dom`.
	['TextField', 'text-field', ['field'], 'required', 'applicable'],
	// Theme utilities, not a component with a rendered root.
	['Theme', 'theme', [], 'none', 'none'],
	['VisuallyHidden', 'visually-hidden', ['dom'], 'none', 'none'],
].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({
	conformance,
	integrationTripwire,
	name,
	path,
	visualApplicability,
})) as ReadonlyArray<ComponentTestManifestEntry>;
