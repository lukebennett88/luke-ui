import { MonitorIcon, SmartphoneIcon } from 'lucide-react';
import { IconToggleButtonGroup } from './icon-toggle-button-group';

const VIEWPORTS = [
	{ Icon: MonitorIcon, label: 'Desktop', value: '100%' },
	{ Icon: SmartphoneIcon, label: 'Mobile', value: '375px' },
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
