type ConformanceTier = 'universal' | 'field-shaped' | 'none';
type IntegrationTripwire = 'required' | 'none';
type VisualApplicability = 'applicable' | 'none';

export type ComponentTestManifestEntry = {
	name: string;
	path: string;
	conformanceTier: ConformanceTier;
	integrationTripwire: IntegrationTripwire;
	visualApplicability: VisualApplicability;
};

// Keep this list explicit. `none` is a deliberate exception, not an omission.
export const componentTestManifest = [
	['Blockquote', 'blockquote', 'none', 'none', 'none'],
	['Box', 'box', 'universal', 'none', 'applicable'],
	['Button', 'button', 'universal', 'required', 'applicable'],
	['Button primitive', 'primitives/button', 'none', 'none', 'none'],
	['Checkbox', 'checkbox', 'field-shaped', 'required', 'applicable'],
	['Checkbox primitive', 'primitives/checkbox', 'none', 'none', 'none'],
	['Code', 'code', 'none', 'none', 'none'],
	['ComboboxField', 'combobox-field', 'field-shaped', 'required', 'applicable'],
	['Combobox primitive', 'primitives/combobox', 'none', 'none', 'none'],
	['Em', 'em', 'none', 'none', 'none'],
	['Emoji', 'emoji', 'none', 'none', 'applicable'],
	['Field primitive', 'primitives/field', 'none', 'none', 'none'],
	['Heading', 'heading', 'none', 'none', 'applicable'],
	['Icon', 'icon', 'none', 'none', 'applicable'],
	['IconButton', 'icon-button', 'universal', 'required', 'applicable'],
	['Input group primitive', 'primitives/input-group', 'none', 'none', 'none'],
	['Kbd', 'kbd', 'none', 'none', 'none'],
	['Link', 'link', 'universal', 'required', 'applicable'],
	['LoadingSkeleton', 'loading-skeleton', 'none', 'none', 'applicable'],
	['LoadingSpinner', 'loading-spinner', 'none', 'none', 'applicable'],
	['Numeral', 'numeral', 'none', 'none', 'applicable'],
	['Quote', 'quote', 'none', 'none', 'none'],
	['Strong', 'strong', 'none', 'none', 'none'],
	['Text', 'text', 'none', 'none', 'applicable'],
	['TextField', 'text-field', 'field-shaped', 'required', 'applicable'],
	['Theme', 'theme', 'none', 'none', 'none'],
	['VisuallyHidden', 'visually-hidden', 'none', 'none', 'none'],
].map(([name, path, conformanceTier, integrationTripwire, visualApplicability]) => ({
	conformanceTier,
	integrationTripwire,
	name,
	path,
	visualApplicability,
})) as ReadonlyArray<ComponentTestManifestEntry>;

export function getComponentTestManifestEntry(path: string): ComponentTestManifestEntry {
	const entry = componentTestManifest.find((item) => item.path === path);
	if (entry == null) throw new Error(`Unknown component test path: ${path}`);
	return entry;
}
