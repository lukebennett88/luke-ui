import { Icon } from '@luke-ui/react/icon';

export default function Basic() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Icon name="add" size="xsmall" title="Add" />
			<Icon aria-hidden name="close" size="medium" />
		</div>
	);
}
