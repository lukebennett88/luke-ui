import { Heading } from '@luke-ui/react/heading';

export default function Typography() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Heading color="info" level={3}>
				Informative heading
			</Heading>
			<Heading level={4} size={900}>
				Display-sized heading
			</Heading>
		</div>
	);
}
