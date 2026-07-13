import { Button } from '@luke-ui/react/button';

export default function Tones() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
			<Button>Accent solid</Button>
			<Button tone="neutral" variant="subtle">
				Neutral subtle
			</Button>
			<Button tone="danger">Danger solid</Button>
			<Button variant="ghost">Accent ghost</Button>
		</div>
	);
}
