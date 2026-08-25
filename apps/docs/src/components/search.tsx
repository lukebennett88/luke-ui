'use client';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import {
	SearchDialog,
	SearchDialogClose,
	SearchDialogContent,
	SearchDialogHeader,
	SearchDialogIcon,
	SearchDialogInput,
	SearchDialogList,
	SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import { create } from 'zbsearch';

function initDB() {
	return create({
		language: 'english',
		schema: { _: 'string' },
	});
}

export default function DefaultSearchDialog(props: SharedProps) {
	const { search, setSearch, query } = useDocsSearch({
		client: staticClient({ initDB }),
	});

	return (
		<SearchDialog isLoading={query.isLoading} onSearchChange={setSearch} search={search} {...props}>
			<SearchDialogOverlay />
			<SearchDialogContent>
				<SearchDialogHeader>
					<SearchDialogIcon />
					<SearchDialogInput />
					<SearchDialogClose />
				</SearchDialogHeader>
				<SearchDialogList items={query.data !== 'empty' ? query.data : null} />
			</SearchDialogContent>
		</SearchDialog>
	);
}
