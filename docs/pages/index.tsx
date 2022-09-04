import { typedEntries } from 'emery/utils';
import { Fragment } from 'react';

import * as docs from '../docs';

export default function Docs() {
	return (
		<div>
			<h1>Docs</h1>
			{typedEntries(docs).map(([key, value]) => {
				return (
					<Fragment key={key}>
						<h2>{value.meta.name}</h2>
						<p>Category: {value.meta.category}</p>
						{value.description ?? null}
						{value.examples?.map((example) => (
							<>
								<h3>{example.name}</h3>
								{example.description}
							</>
						))}
					</Fragment>
				);
			})}
		</div>
	);
}
