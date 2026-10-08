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
		'tone',
		'prominence',
		'isBlock',
		'isDisabled',
		'isPending',
		'pressAction',
		'size',
		'startContent',
		'endContent',
	],
	'actions/icon-button.mdx::packages/@luke-ui/react/src/core/icon-button/icon-button.tsx::IconButtonProps':
		['tone', 'prominence', 'icon', 'isDisabled', 'isPending', 'pressAction', 'size'],
	'actions/icon-link.mdx::packages/@luke-ui/react/src/core/icon-link/icon-link.tsx::IconLinkProps':
		['prominence', 'icon', 'href', 'isDisabled', 'size'],
	'actions/link.mdx::packages/@luke-ui/react/src/core/link/link.tsx::LinkProps': [
		'appearance',
		'prominence',
		'href',
		'isDisabled',
	],
	'feedback/loading-skeleton.mdx::packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx::LoadingSkeletonProps':
		['elementType', 'isLoading', 'radius'],
	'feedback/loading-skeleton.mdx::packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx::LoadingSkeletonProviderProps':
		['isLoading'],
	'feedback/loading-spinner.mdx::packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx::LoadingSpinnerProps':
		['aria-label', 'color', 'isLoading', 'size'],
	'forms/checkbox-field.mdx::packages/@luke-ui/react/src/core/checkbox-field/checkbox-field.tsx::CheckboxFieldProps':
		[
			'defaultSelected',
			'description',
			'errorMessage',
			'form',
			'id',
			'inputId',
			'inputRef',
			'isDisabled',
			'isIndeterminate',
			'isReadOnly',
			'isRequired',
			'isSelected',
			'label',
			'name',
			'necessityIndicator',
			'onChange',
			'ref',
			'size',
			'validate',
			'validationBehavior',
			'value',
		],
	'forms/combobox-field.mdx::packages/@luke-ui/react/src/core/combobox-field/combobox-field.tsx::ComboboxFieldProps':
		[
			'aria-label',
			'aria-labelledby',
			'className',
			'defaultItems',
			'errorMessage',
			'id',
			'inputId',
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
			'ref',
			'size',
			'validate',
		],
	'forms/combobox-field.mdx::packages/@luke-ui/react/src/core/primitives/combobox/item.tsx::ComboboxItemProps':
		[],
	'forms/combobox-field.mdx::packages/@luke-ui/react/src/core/primitives/combobox/section.tsx::ComboboxSectionProps':
		[],
	'forms/select-field.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectItemProps':
		[],
	'forms/select-field.mdx::packages/@luke-ui/react/src/core/select-field/select-field.tsx::SelectFieldProps':
		[
			'aria-label',
			'aria-labelledby',
			'defaultValue',
			'errorMessage',
			'isDisabled',
			'isPending',
			'isRequired',
			'items',
			'label',
			'necessityIndicator',
			'onChange',
			'placeholder',
			'ref',
			'size',
			'triggerRef',
			'validate',
			'value',
		],
	'forms/switch-field.mdx::packages/@luke-ui/react/src/core/switch-field/switch-field.tsx::SwitchFieldProps':
		[
			'defaultSelected',
			'description',
			'errorMessage',
			'form',
			'id',
			'inputId',
			'inputRef',
			'isDisabled',
			'isReadOnly',
			'isRequired',
			'isSelected',
			'label',
			'name',
			'necessityIndicator',
			'onChange',
			'ref',
			'size',
			'validate',
			'validationBehavior',
			'value',
		],
	'forms/text-input-field.mdx::packages/@luke-ui/react/src/core/text-input-field/text-input-field.tsx::TextInputFieldProps':
		[
			'aria-label',
			'aria-labelledby',
			'className',
			'errorMessage',
			'id',
			'inputId',
			'inputRef',
			'isRequired',
			'label',
			'necessityIndicator',
			'pattern',
			'placeholder',
			'prefix',
			'ref',
			'size',
			'suffix',
			'type',
			'validate',
		],
	'layout/aspect-ratio.mdx::packages/@luke-ui/react/src/core/aspect-ratio/aspect-ratio.tsx::AspectRatioProps':
		['elementType', 'objectFit', 'ratio', 'renderRoot'],
	'layout/bleed.mdx::packages/@luke-ui/react/src/core/bleed/bleed.tsx::BleedProps': [
		'all',
		'block',
		'blockEnd',
		'blockStart',
		'elementType',
		'inline',
		'inlineEnd',
		'inlineStart',
		'renderRoot',
	],
	'layout/box.mdx::packages/@luke-ui/react/src/core/box/box.tsx::BoxProps': [
		'elementType',
		'ref',
		'renderRoot',
	],
	'layout/cluster.mdx::packages/@luke-ui/react/src/core/cluster/cluster.tsx::ClusterProps': [
		'alignItems',
		'elementType',
		'gap',
		'justifyContent',
		'renderRoot',
	],
	'layout/container.mdx::packages/@luke-ui/react/src/core/container/container.tsx::ContainerProps':
		['elementType', 'marginInline', 'maxInlineSize', 'paddingInline', 'renderRoot'],
	'layout/grid.mdx::packages/@luke-ui/react/src/core/grid/grid.tsx::GridProps': [
		'alignContent',
		'alignItems',
		'areas',
		'columnGap',
		'columns',
		'elementType',
		'gap',
		'justifyContent',
		'justifyItems',
		'renderRoot',
		'rowGap',
		'rows',
	],
	'layout/scroll-fade.mdx::packages/@luke-ui/react/src/core/scroll-fade/scroll-fade.tsx::ScrollFadeProps':
		['aria-label', 'aria-labelledby', 'axis'],
	'layout/stack.mdx::packages/@luke-ui/react/src/core/stack/stack.tsx::StackProps': [
		'alignItems',
		'elementType',
		'gap',
		'renderRoot',
	],
	'layout/track.mdx::packages/@luke-ui/react/src/core/track/track.tsx::TrackProps': [
		'elementType',
		'gap',
		'railAlignment',
		'railEnd',
		'railStart',
	],
	'layout/visually-hidden.mdx::packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx::VisuallyHiddenProps':
		['elementType', 'isFocusable', 'ref', 'renderRoot'],
	'primitives/button.mdx::packages/@luke-ui/react/src/core/primitives/button/button.tsx::ButtonProps':
		['appearance', 'isBlock', 'isDisabled', 'isPending', 'size', 'tone'],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxControlProps':
		[],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxIndicatorProps':
		[],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxLabelProps':
		['children', 'ref'],
	'primitives/checkbox.mdx::packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx::CheckboxRootProps':
		['aria-labelledby', 'id', 'inputId', 'inputRef', 'isInvalid', 'ref', 'size'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/clear-button.tsx::ComboboxClearButtonProps':
		[],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/empty-state.tsx::ComboboxEmptyStateProps':
		['children'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/control.tsx::ComboboxControlProps':
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
		['aria-label', 'defaultItems', 'id', 'inputId', 'ref', 'size'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/section.tsx::ComboboxSectionProps':
		['title'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/tray-trigger.tsx::ComboboxTrayTriggerProps':
		['placeholder'],
	'primitives/combobox.mdx::packages/@luke-ui/react/src/core/primitives/combobox/tray.tsx::ComboboxTrayProps':
		['children'],
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
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/field.tsx::InlineFieldProps':
		['description', 'errorMessage'],
	'primitives/field.mdx::packages/@luke-ui/react/src/core/primitives/field/label.tsx::FieldLabelProps':
		['htmlFor', 'necessityIndicator'],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectIndicatorProps':
		['children'],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectItemProps':
		[],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectListBoxProps':
		['items'],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectPopoverProps':
		[],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectRootProps':
		[
			'aria-label',
			'aria-labelledby',
			'defaultValue',
			'id',
			'isInvalid',
			'name',
			'onChange',
			'placeholder',
			'ref',
			'size',
			'triggerId',
			'value',
		],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectTriggerProps':
		['isPending', 'ref'],
	'primitives/select.mdx::packages/@luke-ui/react/src/core/primitives/select/select.tsx::SelectValueProps':
		[],
	'primitives/switch.mdx::packages/@luke-ui/react/src/core/primitives/switch/switch.tsx::SwitchControlProps':
		[],
	'primitives/switch.mdx::packages/@luke-ui/react/src/core/primitives/switch/switch.tsx::SwitchLabelProps':
		['children', 'ref'],
	'primitives/switch.mdx::packages/@luke-ui/react/src/core/primitives/switch/switch.tsx::SwitchRootProps':
		[
			'aria-describedby',
			'aria-labelledby',
			'id',
			'inputId',
			'inputRef',
			'isInvalid',
			'ref',
			'size',
		],
	'primitives/switch.mdx::packages/@luke-ui/react/src/core/primitives/switch/switch.tsx::SwitchThumbProps':
		[],
	'primitives/text-input.mdx::packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx::TextInputControlProps':
		['size'],
	'primitives/text-input.mdx::packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx::TextInputPrefixProps':
		[],
	'primitives/text-input.mdx::packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx::TextInputProps':
		[
			'aria-invalid',
			'aria-label',
			'className',
			'disabled',
			'inputMode',
			'name',
			'placeholder',
			'ref',
			'size',
			'value',
		],
	'primitives/text-input.mdx::packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx::TextInputRootProps':
		[
			'autoComplete',
			'form',
			'id',
			'inputId',
			'isInvalid',
			'name',
			'onChange',
			'ref',
			'size',
			'value',
		],
	'primitives/text-input.mdx::packages/@luke-ui/react/src/core/primitives/text-input/text-input.tsx::TextInputSuffixProps':
		[],
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
		'isVisuallyHidden',
		'lineClamp',
		'shouldDisableTrim',
		'slot',
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
};
