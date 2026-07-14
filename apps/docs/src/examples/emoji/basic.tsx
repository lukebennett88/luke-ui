import { Emoji } from '@luke-ui/react/emoji';

export default function Basic() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Emoji emoji="🎉" label="Celebration" />
			<Emoji emoji="🚀" label="Rocket" size={500} />
		</div>
	);
}
