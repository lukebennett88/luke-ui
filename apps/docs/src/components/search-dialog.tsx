import { Button } from '@luke-ui/react/button';
import { Code } from '@luke-ui/react/code';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { rootClassName } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import { useRouter } from '@tanstack/react-router';
import type { NavigateOptions } from '@tanstack/react-router';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { SortedResult } from 'fumadocs-core/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import type { ReactNode } from 'react';
import { useCallback, useEffect, ViewTransition } from 'react';
import { RouterProvider } from 'react-aria-components';
import { Autocomplete } from 'react-aria-components/Autocomplete';
import { Dialog } from 'react-aria-components/Dialog';
import { Menu, MenuItem } from 'react-aria-components/Menu';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { TextContext } from 'react-aria-components/Text';
import { create } from 'zbsearch';
import type { SearchAnchorRect } from './search-anchor.js';
import { plainText } from './search-content.js';
import { searchFieldViewTransition } from './search-view-transition.js';
import * as styles from './search.css.js';

const client = staticClient({
	initDB: () => create({ language: 'english', schema: { _: 'string' } }),
});

interface DocsSearchDialogProps {
	anchor: SearchAnchorRect | null;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

const MARK_OR_CODE_PATTERN = /(<mark>.*?<\/mark>|`[^`]*`)/gi;
const MARK_PATTERN = /^<mark>(.*)<\/mark>$/i;
const CODE_SPAN_PATTERN = /^`([^`]*)`$/;
const EXTERNAL_URL_PATTERN = /^https?:\/\//;

export function DocsSearchDialog({ anchor, isOpen, onOpenChange }: DocsSearchDialogProps) {
	const { search, setSearch, query } = useDocsSearch({ client });
	const router = useRouter();
	const results: Array<SortedResult> = (() => {
		if (!search || query.isLoading || query.error || query.data === 'empty') return [];
		return query.data ?? [];
	})();
	const hasResults = results.length > 0;
	const statusMessage: string = (() => {
		if (query.error) return 'Search is unavailable.';
		if (query.isLoading) return 'Searching…';
		if (!search) return 'Type to search documentation.';
		if (!hasResults) return 'No results found.';
		return `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
	})();

	const close = useCallback(() => {
		onOpenChange(false);
		setSearch('');
	}, [onOpenChange, setSearch]);

	// A native `type="search"` input clears its own value on Escape before the dialog sees the key,
	// so a capture listener is what closes the dialog in one press.
	useEffect(() => {
		if (!isOpen) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				close();
				event.stopPropagation();
			}
		}
		document.addEventListener('keydown', onKeyDown, { capture: true });
		return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
	}, [isOpen, close]);

	const panelPositionStyle =
		anchor === null
			? undefined
			: {
					...assignInlineVars({
						[styles.searchAnchorHeightVar]: `${anchor.height}px`,
					}),
					left: `${anchor.left}px`,
					top: `${anchor.top}px`,
					width: `${anchor.width}px`,
				};

	return (
		<ModalOverlay
			className={cx(rootClassName, styles.overlay)}
			isDismissable
			isOpen={isOpen}
			onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
		>
			<Modal className={styles.modalPassThrough}>
				<div className={styles.panel} style={panelPositionStyle}>
					<Dialog aria-label="Search documentation" className={styles.dialog}>
						<RouterProvider
							navigate={(href) => void router.navigate({ href })}
							useHref={(href) => {
								if (isExternalUrl(href)) return href;
								// buildLocation accepts href at runtime but its type omits it.
								const location = router.buildLocation({ href } as NavigateOptions);
								return router.history.createHref(location.publicHref);
							}}
						>
							<ViewTransition {...searchFieldViewTransition}>
								<div className={styles.fieldMorphHost}>
									<div className={styles.panelFieldShell}>
										<div className={styles.autocomplete}>
											<Autocomplete inputValue={search} onInputChange={setSearch}>
												<Track
													className={styles.inputRow}
													gap="sp12"
													railAlignment="center"
													railEnd={
														<Button
															aria-label="Close search"
															className={styles.close}
															onPress={close}
															prominence="low"
															size="small"
														>
															<Kbd>Esc</Kbd>
														</Button>
													}
												>
													<TextField
														aria-label="Search documentation"
														autoComplete="off"
														autoFocus // oxlint-disable-line jsx-a11y/no-autofocus -- Focus the field when the modal opens.
														className={styles.field}
														inputClassName={styles.input}
														placeholder="Search documentation"
														prefix={<Icon name="search" />}
														size="small"
														type="search"
													/>
												</Track>
												<div className={styles.panelResultsRegion}>
													{/* Static empty copy: embedding the query would re-announce on every keystroke. */}
													<Text
														className={hasResults ? styles.resultSummary : styles.empty}
														color="secondary"
														elementType="p"
														role="status"
														typography="caption"
													>
														{statusMessage}
													</Text>
													<Menu
														aria-label="Search results"
														className={styles.results}
														onAction={close}
													>
														{results.map((result) => (
															<MenuItem
																className={
																	result.type === 'page'
																		? styles.result
																		: cx(styles.result, styles.nestedItem)
																}
																href={result.url}
																id={result.id}
																key={result.id}
																rel={
																	isExternalUrl(result.url) ? 'noopener noreferrer' : undefined
																}
																target={isExternalUrl(result.url) ? '_blank' : undefined}
																textValue={plainText(result.content)}
															>
																{/* Luke UI `Code` renders `Text`, which would claim MenuItem's label slot. */}
																<TextContext value={null}>
																	<ResultBody result={result} />
																</TextContext>
															</MenuItem>
														))}
													</Menu>
												</div>
											</Autocomplete>
										</div>
									</div>
								</div>
							</ViewTransition>
						</RouterProvider>
					</Dialog>
				</div>
			</Modal>
		</ModalOverlay>
	);
}

/**
 * Renders search-result content as safe React nodes. Search results are Markdown-ish strings that
 * may contain `<mark>` spans (highlighted matches) and backtick code spans, which can themselves
 * contain a `<mark>` span. Never uses `dangerouslySetInnerHTML`.
 */
function renderContent(value: string): Array<ReactNode> {
	return value.split(MARK_OR_CODE_PATTERN).flatMap((part, index): Array<ReactNode> => {
		if (part === undefined) return [];
		const markMatch = MARK_PATTERN.exec(part);
		if (markMatch) {
			return [
				<mark className={styles.highlight} key={index}>
					{plainText(markMatch[1] ?? '')}
				</mark>,
			];
		}
		const codeMatch = CODE_SPAN_PATTERN.exec(part);
		if (codeMatch) {
			return [<Code key={index}>{renderContent(codeMatch[1] ?? '')}</Code>];
		}
		const text = plainText(part);
		return text ? [text] : [];
	});
}

/** Renders one result's body, mirroring Fumadocs UI's page/heading/text layout and indentation. */
function ResultBody({ result }: { result: SortedResult }) {
	if (result.type === 'page') {
		return (
			<>
				{result.breadcrumbs?.length ? (
					<span className={styles.breadcrumbs}>
						{result.breadcrumbs.map((part, index) => (
							<span key={index}>
								{index > 0 ? (
									<Icon className={styles.breadcrumbChevron} name="chevronRight" size="xsmall" />
								) : null}
								{plainText(part)}
							</span>
						))}
					</span>
				) : null}
				<Text className={styles.pageTitle} shouldInheritFont>
					{renderContent(result.content)}
				</Text>
			</>
		);
	}

	return (
		<span className={styles.nestedResult}>
			{result.type === 'heading' ? (
				<span className={styles.headingHash} aria-hidden="true">
					#{' '}
				</span>
			) : null}
			<Text
				className={result.type === 'heading' ? styles.headingContent : styles.textContent}
				shouldInheritFont
			>
				{renderContent(result.content)}
			</Text>
		</span>
	);
}

function isExternalUrl(url: string) {
	return EXTERNAL_URL_PATTERN.test(url);
}
