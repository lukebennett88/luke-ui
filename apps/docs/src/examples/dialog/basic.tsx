import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog, DialogTrigger } from '@luke-ui/react/dialog';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<DialogTrigger>
			<Button>Open dialog</Button>
			<Dialog description="Dialog description." isDismissable title="Example dialog">
				<Text elementType="p">Dialog content.</Text>
				<Cluster justifyContent="flex-end">
					<Button prominence="high" slot="close">
						Close
					</Button>
				</Cluster>
			</Dialog>
		</DialogTrigger>
	);
};
