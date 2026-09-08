import { Button } from '@luke-ui/react/button';

async function save() {
	await new Promise((resolve) => {
		setTimeout(resolve, 1200);
	});
}

export default () => {
	return (
		<Button pressAction={save}>
			{({ isPending }) => (isPending ? 'Saving changes' : 'Save changes')}
		</Button>
	);
};
