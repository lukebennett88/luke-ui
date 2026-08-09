type ConformanceTier = 'universal' | 'field-shaped' | 'none';
type IntegrationTripwire = 'required' | 'none';
type VisualApplicability = 'applicable' | 'none';
type ComponentTier = 'atom' | 'composed' | 'primitive';

export type ComponentTestManifestEntry = {
	name: string;
	path: string;
	tier: ComponentTier;
	conformanceTier: ConformanceTier;
	integrationTripwire: IntegrationTripwire;
	visualApplicability: VisualApplicability;
};

// Keep this list explicit. `none` is a deliberate exception, not an omission.
export const componentTestManifest = [
	['Blockquote', 'blockquote', 'atom', 'none', 'none', 'none'],
	['Box', 'box', 'atom', 'universal', 'none', 'applicable'],
	['Button', 'button', 'composed', 'universal', 'required', 'applicable'],
	['Button primitive', 'button/primitive', 'primitive', 'none', 'none', 'none'],
	['Checkbox', 'checkbox', 'composed', 'field-shaped', 'required', 'applicable'],
	['Checkbox primitive', 'checkbox/primitive', 'primitive', 'none', 'none', 'none'],
	['Code', 'code', 'atom', 'none', 'none', 'none'],
	['ComboboxField', 'combobox-field', 'composed', 'field-shaped', 'required', 'applicable'],
	['ComboboxField primitive', 'combobox-field/primitive', 'primitive', 'none', 'none', 'none'],
	['Em', 'em', 'atom', 'none', 'none', 'none'],
	['Emoji', 'emoji', 'atom', 'none', 'none', 'applicable'],
	['Field primitive', 'field/primitive', 'primitive', 'none', 'none', 'none'],
	['Heading', 'heading', 'atom', 'none', 'none', 'applicable'],
	['Icon', 'icon', 'atom', 'none', 'none', 'applicable'],
	['IconButton', 'icon-button', 'composed', 'universal', 'required', 'applicable'],
	['Kbd', 'kbd', 'atom', 'none', 'none', 'none'],
	['Link', 'link', 'atom', 'universal', 'required', 'applicable'],
	['LoadingSkeleton', 'loading-skeleton', 'atom', 'none', 'none', 'applicable'],
	['LoadingSpinner', 'loading-spinner', 'atom', 'none', 'none', 'applicable'],
	['Numeral', 'numeral', 'atom', 'none', 'none', 'applicable'],
	['Quote', 'quote', 'atom', 'none', 'none', 'none'],
	['Strong', 'strong', 'atom', 'none', 'none', 'none'],
	['Text', 'text', 'atom', 'none', 'none', 'applicable'],
	['TextField', 'text-field', 'composed', 'field-shaped', 'required', 'applicable'],
	['TextField primitive', 'text-field/primitive', 'primitive', 'none', 'none', 'none'],
	['VisuallyHidden', 'visually-hidden', 'atom', 'none', 'none', 'none'],
].map(([name, path, tier, conformanceTier, integrationTripwire, visualApplicability]) => ({
	name,
	path,
	tier,
	conformanceTier,
	integrationTripwire,
	visualApplicability,
})) as ReadonlyArray<ComponentTestManifestEntry>;
