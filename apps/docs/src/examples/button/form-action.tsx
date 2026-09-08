import { Button } from '@luke-ui/react/button';
import { useFormStatus } from 'react-dom';

async function save() {
	await new Promise((resolve) => {
		setTimeout(resolve, 1200);
	});
}

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button isPending={pending} type="submit">
			{pending ? 'Saving' : 'Save'}
		</Button>
	);
}

export default () => {
	return (
		<form action={save}>
			<SubmitButton />
		</form>
	);
};
