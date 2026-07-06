import { Button } from '@luke-ui/react/button';

export default function Pending() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Button isPending>Saving</Button>
		</div>
	);
}
