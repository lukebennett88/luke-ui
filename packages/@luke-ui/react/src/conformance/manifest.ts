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
	['Blockquote', 'blockquote', [], 'none', 'none'],
	['Box', 'box', ['dom'], 'none', 'applicable'],
	['Button', 'button', ['dom'], 'required', 'applicable'],
	['Button primitive', 'primitives/button', [], 'none', 'none'],
	['Checkbox', 'checkbox', ['dom', 'field'], 'required', 'applicable'],
	['Checkbox primitive', 'primitives/checkbox', [], 'none', 'none'],
	['Code', 'code', [], 'none', 'none'],
	['ComboboxField', 'combobox-field', ['dom', 'field'], 'required', 'applicable'],
	['Combobox primitive', 'primitives/combobox', [], 'none', 'none'],
	['Em', 'em', [], 'none', 'none'],
	['Emoji', 'emoji', [], 'none', 'applicable'],
	['Field primitive', 'primitives/field', [], 'none', 'none'],
	['Heading', 'heading', [], 'none', 'applicable'],
	['Icon', 'icon', [], 'none', 'applicable'],
	['IconButton', 'icon-button', ['dom'], 'required', 'applicable'],
	['Input group primitive', 'primitives/input-group', [], 'none', 'none'],
	['Kbd', 'kbd', [], 'none', 'none'],
	['Link', 'link', ['dom'], 'required', 'applicable'],
	['LoadingSkeleton', 'loading-skeleton', [], 'none', 'applicable'],
	['LoadingSpinner', 'loading-spinner', [], 'none', 'applicable'],
	['Numeral', 'numeral', [], 'none', 'applicable'],
	['Quote', 'quote', [], 'none', 'none'],
	['Strong', 'strong', [], 'none', 'none'],
	['Text', 'text', [], 'none', 'applicable'],
	['TextField', 'text-field', ['dom', 'field'], 'required', 'applicable'],
	['Theme', 'theme', [], 'none', 'none'],
	['VisuallyHidden', 'visually-hidden', [], 'none', 'none'],
].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({
	conformance,
	integrationTripwire,
	name,
	path,
	visualApplicability,
})) as ReadonlyArray<ComponentTestManifestEntry>;
