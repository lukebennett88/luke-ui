import { Button } from '@luke-ui/react/button';

export default function Sizes() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Button size="small">Small</Button>
			<Button size="medium">Medium</Button>
		</div>
	);
}
