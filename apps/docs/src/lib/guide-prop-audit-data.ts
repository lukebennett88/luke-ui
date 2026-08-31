/** Stable key for curated taught-prop metadata: `guide::path::name`. */
export function guideTableKey(guide: string, path: string, name: string): string {
	return `${guide}::${path}::${name}`;
}

/**
 * Props each guide's API table explicitly teaches as intentional Luke UI behaviour. Keys match
 * authored `<component-props-table>` tags in a specific guide. An empty array means the table
 * documents a type that teaches no named Luke UI contract props beyond native DOM pass-through.
 */
export const GUIDE_TAUGHT_PROPS: Readonly<Record<string, ReadonlyArray<string>>> = {
	'actions/button.mdx::packages/@luke-ui/react/src/core/button/button.tsx::ButtonProps': [
		'appearance',
		'isBlock',
		'isDisabled',
		'isPending',
		'size',
		'startIcon',
		'endIcon',
		'tone',
	],
	'actions/icon-button.mdx::packages/@luke-ui/react/src/core/icon-button/icon-button.tsx::IconButtonProps':
		['appearance', 'icon', 'isDisabled', 'isPending', 'size', 'tone'],
	'actions/link.mdx::packages/@luke-ui/react/src/core/link/link.tsx::LinkProps': [
		'href',
		'isDisabled',
		'isStandalone',
		'tone',
	],
	'feedback/loading-skeleton.mdx::packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx::LoadingSkeletonProps':
		['elementType', 'isLoading', 'radius'],
	'feedback/loading-skeleton.mdx::packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx::LoadingSkeletonProviderProps':
		['isLoading'],
	'feedback/loading-spinner.mdx::packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx::LoadingSpinnerProps':
		['aria-label', 'color', 'isLoading', 'size'],
	'forms/checkbox.mdx::packages/@luke-ui/react/src/core/checkbox/checkbox.tsx::CheckboxProps': [
		'defaultSelected',
		'description',
		'errorMessage',
		'inputRef',
		'isDisabled',
		'isIndeterminate',
		'isReadOnly',
		'isRequired',
		'isSelected',
		'onChange',
		'size',
	],
	'forms/combobox-field.mdx::packages/@luke-ui/react/src/core/combobox-field/combobox-field.tsx::ComboboxFieldProps':
		[
			'defaultItems',
			'errorMessage',
			'inputRef',
			'isRequired',
			'items',
			'label',
			'listBoxProps',
			'loadMoreItem',
			'loadingState',
			'menuWidth',
			'name',
			'necessityIndicator',
			'onLoadMore',
			'placeholder',
			'popoverProps',
			'size',
			'validate',
		],
	'forms/text-field.mdx::packages/@luke-ui/react/src/core/text-field/text-field.tsx::TextFieldProps':
		[
			'aria-label',
			'errorMessage',
			'isRequired',
			'label',
			'necessityIndicator',
			'pattern',
			'placeholder',
			'prefix',
			'size',
			'suffix',
			'type',
			'validate',
		],
	'layout/box.mdx::packages/@luke-ui/react/src/core/box/box.tsx::BoxProps': [
		'elementType',
		'ref',
		'render',
	],
	'layout/visually-hidden.mdx::packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx::VisuallyHiddenProps':
		['elementType'],
	'primitives/button.mdx::packages/@luke-ui/react/src/core/primitives/button/button.tsx::ButtonProps':
		['appearance', 'isBlock', 'isDisabled', 'isPending', 'size', 'tone'],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxContentProps':
		[],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxControlProps':
		[],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxIndicatorProps':
		[],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxProps':
		['isInvalid'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/clear-button.tsx::ComboboxClearButtonProps':
		[],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/empty-state.tsx::ComboboxEmptyStateProps':
		['children'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/input-group.tsx::ComboboxInputGroupProps':
		['size'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/input.tsx::ComboboxInputProps':
		['size'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/item.tsx::ComboboxItemProps':
		[],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/item.tsx::ComboboxLoadMoreItemProps':
		[],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/listbox.tsx::ComboboxListBoxProps':
		['items', 'loadMoreItem'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/popover.tsx::ComboboxPopoverProps':
		[],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/root.tsx::ComboboxRootProps':
		['aria-label', 'defaultItems', 'size'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/section.tsx::ComboboxSectionProps':
		['title'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/trigger.tsx::ComboboxTriggerProps':
		['aria-label', 'size'],
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/description.tsx::FieldDescriptionProps':
		['id'],
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/error.tsx::FieldErrorProps':
		[],
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/field.tsx::FieldProps': [
		'description',
		'errorMessage',
		'label',
		'necessityIndicator',
	],
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/label.tsx::FieldLabelProps':
		['htmlFor', 'necessityIndicator'],
	'primitives/input-group.mdx::packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx::InputGroupInputProps':
		['aria-label', 'className', 'inputMode', 'ref', 'size'],
	'primitives/input-group.mdx::packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx::InputGroupPrefixProps':
		['size'],
	'primitives/input-group.mdx::packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx::InputGroupProps':
		['className', 'isInvalid', 'size'],
	'primitives/input-group.mdx::packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx::InputGroupSuffixProps':
		['size'],
	'typography/blockquote.mdx::packages/@luke-ui/react/src/core/blockquote/blockquote.tsx::BlockquoteProps':
		['fontWeight', 'lineClamp', 'typography'],
	'typography/code.mdx::packages/@luke-ui/react/src/core/code/code.tsx::CodeProps': [],
	'typography/em.mdx::packages/@luke-ui/react/src/core/em/em.tsx::EmProps': [
		'lineClamp',
		'textWrap',
	],
	'typography/emoji.mdx::packages/@luke-ui/react/src/core/emoji/emoji.tsx::EmojiProps': [
		'emoji',
		'label',
	],
	'typography/heading.mdx::packages/@luke-ui/react/src/core/heading/heading-context.tsx::HeadingLevelsProps':
		['base'],
	'typography/heading.mdx::packages/@luke-ui/react/src/core/heading/heading-context.tsx::HeadingLevelsRenderProps':
		['element', 'level'],
	'typography/heading.mdx::packages/@luke-ui/react/src/core/heading/heading.tsx::HeadingProps': [
		'level',
		'typography',
	],
	'typography/kbd.mdx::packages/@luke-ui/react/src/core/kbd/kbd.tsx::KbdProps': [],
	'typography/numeral.mdx::packages/@luke-ui/react/src/core/numeral/numeral.tsx::NumeralProps': [
		'abbreviate',
		'currency',
		'format',
		'formatOptions',
		'fontVariantNumeric',
		'precision',
		'textAlign',
		'unit',
		'value',
	],
	'typography/prose.mdx::packages/@luke-ui/react/src/core/prose/prose.tsx::ProseProps': [],
	'typography/quote.mdx::packages/@luke-ui/react/src/core/quote/quote.tsx::QuoteProps': [
		'cite',
		'lineClamp',
		'textWrap',
	],
	'typography/strong.mdx::packages/@luke-ui/react/src/core/strong/strong.tsx::StrongProps': [
		'lineClamp',
		'textWrap',
	],
	'typography/text.mdx::packages/@luke-ui/react/src/core/text/text.tsx::TextProps': [
		'elementType',
		'fontVariantNumeric',
		'fontWeight',
		'lineClamp',
		'shouldDisableTrim',
		'textAlign',
		'textDecoration',
		'textTransform',
		'textWrap',
		'typography',
	],
	'visuals/icon.mdx::packages/@luke-ui/react/src/core/icon/icon.tsx::CreateIconOptions': [
		'path',
		'viewBox',
	],
	'visuals/icon.mdx::packages/@luke-ui/react/src/core/icon/icon.tsx::CustomIconProps': ['title'],
	'visuals/icon.mdx::packages/@luke-ui/react/src/core/icon/icon.tsx::IconProps': ['title'],
	'visuals/icon.mdx::packages/@luke-ui/react/src/core/icon/icon.tsx::IconSpritesheetProviderProps':
		['href'],
};
