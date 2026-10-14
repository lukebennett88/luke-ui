import { Button } from '@luke-ui/react/button';
import { Form } from '@luke-ui/react/form';
import { useActionState } from 'react';

export default () => {
	const [, formAction, isPending] = useActionState(save, null);

	return (
		<Form action={formAction}>
			<Button isPending={isPending} type="submit">
				Save
			</Button>
		</Form>
	);
};

async function save(_state: null, _formData: FormData) {
	await new Promise((resolve) => {
		setTimeout(resolve, 1200);
	});

	return null;
}
