import { Text } from '@luke-ui/react/text';

export default function Typography() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Text fontSize="h2" lineHeight="tight">
				Heading-like text
			</Text>
			<Text color="critical" fontFamily="mono" fontWeight="bold">
				Alert-like inline text
			</Text>
		</div>
	);
}
