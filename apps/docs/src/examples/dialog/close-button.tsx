import { Button } from '@luke-ui/react/button';
import { Dialog, DialogTrigger } from '@luke-ui/react/dialog';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<DialogTrigger>
			<Button>Open dialog</Button>
			<Dialog description="Dialog description." showCloseButton title="Example dialog">
				<Text elementType="p">Dialog content.</Text>
			</Dialog>
		</DialogTrigger>
	);
};
