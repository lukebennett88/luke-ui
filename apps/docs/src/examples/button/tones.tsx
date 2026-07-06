import { Button } from '@luke-ui/react/button';

export default function Tones() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
			<Button tone="primary">Primary</Button>
			<Button tone="critical">Critical</Button>
			<Button tone="ghost">Ghost</Button>
			<Button tone="neutral">Neutral</Button>
		</div>
	);
}
