import { Button } from '@luke-ui/react/button';

export default function ToneAndAppearance() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
			<Button>Neutral solid</Button>
			<Button appearance="subtle" tone="neutral">
				Neutral subtle
			</Button>
			<Button tone="danger">Danger solid</Button>
			<Button appearance="ghost" tone="accent">
				Accent ghost
			</Button>
		</div>
	);
}
