import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<h2>Build the project</h2>
			<p>
				Follow the <a href="https://pnpm.io/installation">pnpm installation guide</a>, then run{' '}
				<code>pnpm run build</code>. Press <kbd>⌘</kbd> <kbd>K</kbd> to open search.
			</p>
			<blockquote>
				<p>Keep build commands in the project README so everyone runs the same steps.</p>
			</blockquote>
		</Prose>
	);
};
