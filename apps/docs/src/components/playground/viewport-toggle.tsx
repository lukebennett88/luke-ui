import { IconToggleButtonGroup } from './icon-toggle-button-group';

const VIEWPORTS = [
	{ icon: 'monitor', label: 'Desktop', value: '100%' },
	{ icon: 'mobilePhone', label: 'Mobile', value: '375px' },
] as const;

export type ViewportWidth = (typeof VIEWPORTS)[number]['value'];

type ViewportToggleProps = {
	onChange: (width: ViewportWidth) => void;
	value: ViewportWidth;
};

export function ViewportToggle({ onChange, value }: ViewportToggleProps) {
	return (
		<IconToggleButtonGroup
			label="Preview viewport"
			onChange={onChange}
			options={VIEWPORTS}
			value={value}
		/>
	);
}
