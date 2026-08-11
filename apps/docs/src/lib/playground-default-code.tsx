import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		window.alert(JSON.stringify(Object.fromEntries(formData), null, 2));
	};
	return (
		<Box
			display="flex"
			flexDirection="column"
			gap="400"
			inlineSize="400px"
			padding="800"
			render={(props) => <form {...props} onSubmit={handleSubmit} />}
		>
			<Heading>Sign in</Heading>
			<TextField label="Email" name="email" placeholder="Enter your email address" type="email" />
			<TextField
				label="Password"
				name="password"
				placeholder="Enter your password"
				type="password"
			/>
			<Box display="flex" gap="300" justifyContent="flex-end">
				<Button appearance="subtle" type="button">
					Create an account
				</Button>
				<Button type="submit">Sign in</Button>
			</Box>
		</Box>
	);
};
