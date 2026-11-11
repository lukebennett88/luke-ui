import { MobilePhoneIcon, MonitorIcon } from '../components/docs-icons.js';
import { IconToggleButtonGroup } from '../components/icon-toggle-button-group';

const VIEWPORTS = [
	{ icon: MonitorIcon, label: 'Desktop', value: '100%' },
	{ icon: MobilePhoneIcon, label: 'Mobile', value: '375px' },
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
