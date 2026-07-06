import { Heading } from '@luke-ui/react/heading';

export default function Typography() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Heading color="informative" level={3}>
				Informative heading
			</Heading>
			<Heading fontWeight="regular" level={4}>
				Light-weight heading
			</Heading>
		</div>
	);
}
