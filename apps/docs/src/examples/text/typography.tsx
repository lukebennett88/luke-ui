import { Text } from '@luke-ui/react/text';

export default function Typography() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Text fontWeight="heading" size={700}>
				Large heading treatment
			</Text>
			<Text color="danger" fontWeight="emphasis">
				Important danger text
			</Text>
		</div>
	);
}
