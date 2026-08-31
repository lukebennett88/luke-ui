/** One exported prop type referenced by a component guide's API tables. */
export interface GuidePropAuditType {
	name: string;
	path: string;
	/**
	 * Props the guide deliberately teaches as intentional Luke UI behaviour for this type.
	 * An empty array means the guide documents the type but teaches no named Luke UI contract
	 * props beyond native DOM pass-through.
	 */
	props: ReadonlyArray<string>;
}

/** Curated audit entry for one main component guide. */
export interface GuidePropAuditEntry {
	guide: string;
	types: ReadonlyArray<GuidePropAuditType>;
}

/**
 * Props each component guide explicitly teaches as intentional Luke UI behaviour. Every entry was
 * checked against the matching generated API table. Props that are generic platform pass-through
 * and only mentioned as alternatives (for example `aria-label` on `Button` when the visible label
 * already names the control) are omitted here.
 */
export const GUIDE_PROP_AUDIT: ReadonlyArray<GuidePropAuditEntry> = [
	{
		guide: 'actions/button.mdx',
		types: [
			{
				name: 'ButtonProps',
				path: 'packages/@luke-ui/react/src/core/button/button.tsx',
				props: [
					'appearance',
					'isBlock',
					'isDisabled',
					'isPending',
					'size',
					'startIcon',
					'endIcon',
					'tone',
				],
			},
		],
	},
	{
		guide: 'actions/icon-button.mdx',
		types: [
			{
				name: 'IconButtonProps',
				path: 'packages/@luke-ui/react/src/core/icon-button/icon-button.tsx',
				props: ['appearance', 'icon', 'isDisabled', 'isPending', 'size', 'tone'],
			},
		],
	},
	{
		guide: 'actions/link.mdx',
		types: [
			{
				name: 'LinkProps',
				path: 'packages/@luke-ui/react/src/core/link/link.tsx',
				props: ['href', 'isDisabled', 'isStandalone', 'tone'],
			},
		],
	},
	{
		guide: 'feedback/loading-skeleton.mdx',
		types: [
			{
				name: 'LoadingSkeletonProps',
				path: 'packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx',
				props: ['elementType', 'isLoading', 'radius'],
			},
			{
				name: 'LoadingSkeletonProviderProps',
				path: 'packages/@luke-ui/react/src/core/loading-skeleton/loading-skeleton.tsx',
				props: ['isLoading'],
			},
		],
	},
	{
		guide: 'feedback/loading-spinner.mdx',
		types: [
			{
				name: 'LoadingSpinnerProps',
				path: 'packages/@luke-ui/react/src/core/loading-spinner/loading-spinner.tsx',
				props: ['aria-label', 'color', 'isLoading', 'size'],
			},
		],
	},
	{
		guide: 'forms/checkbox.mdx',
		types: [
			{
				name: 'CheckboxProps',
				path: 'packages/@luke-ui/react/src/core/checkbox/checkbox.tsx',
				props: [
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
			},
		],
	},
	{
		guide: 'forms/combobox-field.mdx',
		types: [
			{
				name: 'ComboboxFieldProps',
				path: 'packages/@luke-ui/react/src/core/combobox-field/combobox-field.tsx',
				props: [
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
			},
		],
	},
	{
		guide: 'forms/text-field.mdx',
		types: [
			{
				name: 'TextFieldProps',
				path: 'packages/@luke-ui/react/src/core/text-field/text-field.tsx',
				props: [
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
			},
		],
	},
	{
		guide: 'layout/box.mdx',
		types: [
			{
				name: 'BoxProps',
				path: 'packages/@luke-ui/react/src/core/box/box.tsx',
				props: ['elementType', 'ref', 'render'],
			},
		],
	},
	{
		guide: 'layout/visually-hidden.mdx',
		types: [
			{
				name: 'VisuallyHiddenProps',
				path: 'packages/@luke-ui/react/src/core/visually-hidden/visually-hidden.tsx',
				props: ['elementType'],
			},
		],
	},
	{
		guide: 'primitives/button.mdx',
		types: [
			{
				name: 'ButtonProps',
				path: 'packages/@luke-ui/react/src/core/primitives/button/button.tsx',
				props: ['appearance', 'isBlock', 'isDisabled', 'isPending', 'size', 'tone'],
			},
		],
	},
	{
		guide: 'primitives/checkbox.mdx',
		types: [
			{
				name: 'CheckboxProps',
				path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
				props: ['isInvalid'],
			},
			{
				name: 'CheckboxContentProps',
				path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
				props: [],
			},
			{
				name: 'CheckboxControlProps',
				path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
				props: [],
			},
			{
				name: 'CheckboxIndicatorProps',
				path: 'packages/@luke-ui/react/src/core/primitives/checkbox/checkbox.tsx',
				props: [],
			},
		],
	},
	{
		guide: 'primitives/combobox.mdx',
		types: [
			{
				name: 'ComboboxRootProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/root.tsx',
				props: ['aria-label', 'defaultItems', 'size'],
			},
			{
				name: 'ComboboxInputGroupProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/input-group.tsx',
				props: ['size'],
			},
			{
				name: 'ComboboxInputProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/input.tsx',
				props: ['size'],
			},
			{
				name: 'ComboboxClearButtonProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/clear-button.tsx',
				props: [],
			},
			{
				name: 'ComboboxTriggerProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/trigger.tsx',
				props: ['aria-label', 'size'],
			},
			{
				name: 'ComboboxPopoverProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/popover.tsx',
				props: [],
			},
			{
				name: 'ComboboxListBoxProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/listbox.tsx',
				props: ['items', 'loadMoreItem'],
			},
			{
				name: 'ComboboxItemProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/item.tsx',
				props: [],
			},
			{
				name: 'ComboboxLoadMoreItemProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/item.tsx',
				props: [],
			},
			{
				name: 'ComboboxSectionProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/section.tsx',
				props: ['title'],
			},
			{
				name: 'ComboboxEmptyStateProps',
				path: 'packages/@luke-ui/react/src/core/primitives/combobox/empty-state.tsx',
				props: ['children'],
			},
		],
	},
	{
		guide: 'primitives/field.mdx',
		types: [
			{
				name: 'FieldProps',
				path: 'packages/@luke-ui/react/src/core/primitives/field/field.tsx',
				props: ['description', 'errorMessage', 'label', 'necessityIndicator'],
			},
			{
				name: 'FieldLabelProps',
				path: 'packages/@luke-ui/react/src/core/primitives/field/label.tsx',
				props: ['htmlFor', 'necessityIndicator'],
			},
			{
				name: 'FieldDescriptionProps',
				path: 'packages/@luke-ui/react/src/core/primitives/field/description.tsx',
				props: ['id'],
			},
			{
				name: 'FieldErrorProps',
				path: 'packages/@luke-ui/react/src/core/primitives/field/error.tsx',
				props: [],
			},
		],
	},
	{
		guide: 'primitives/input-group.mdx',
		types: [
			{
				name: 'InputGroupProps',
				path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
				props: ['className', 'isInvalid', 'size'],
			},
			{
				name: 'InputGroupInputProps',
				path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
				props: ['aria-label', 'className', 'inputMode', 'ref', 'size'],
			},
			{
				name: 'InputGroupPrefixProps',
				path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
				props: ['size'],
			},
			{
				name: 'InputGroupSuffixProps',
				path: 'packages/@luke-ui/react/src/core/primitives/input-group/input-group.tsx',
				props: ['size'],
			},
		],
	},
	{
		guide: 'typography/blockquote.mdx',
		types: [
			{
				name: 'BlockquoteProps',
				path: 'packages/@luke-ui/react/src/core/blockquote/blockquote.tsx',
				props: ['fontWeight', 'lineClamp', 'typography'],
			},
		],
	},
	{
		guide: 'typography/code.mdx',
		types: [
			{
				name: 'CodeProps',
				path: 'packages/@luke-ui/react/src/core/code/code.tsx',
				props: [],
			},
		],
	},
	{
		guide: 'typography/em.mdx',
		types: [
			{
				name: 'EmProps',
				path: 'packages/@luke-ui/react/src/core/em/em.tsx',
				props: ['lineClamp', 'textWrap'],
			},
		],
	},
	{
		guide: 'typography/emoji.mdx',
		types: [
			{
				name: 'EmojiProps',
				path: 'packages/@luke-ui/react/src/core/emoji/emoji.tsx',
				props: ['emoji', 'label'],
			},
		],
	},
	{
		guide: 'typography/heading.mdx',
		types: [
			{
				name: 'HeadingProps',
				path: 'packages/@luke-ui/react/src/core/heading/heading.tsx',
				props: ['level', 'typography'],
			},
			{
				name: 'HeadingLevelsProps',
				path: 'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
				props: ['base'],
			},
			{
				name: 'HeadingLevelsRenderProps',
				path: 'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
				props: ['element', 'level'],
			},
		],
	},
	{
		guide: 'typography/kbd.mdx',
		types: [
			{
				name: 'KbdProps',
				path: 'packages/@luke-ui/react/src/core/kbd/kbd.tsx',
				props: [],
			},
		],
	},
	{
		guide: 'typography/numeral.mdx',
		types: [
			{
				name: 'NumeralProps',
				path: 'packages/@luke-ui/react/src/core/numeral/numeral.tsx',
				props: [
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
			},
		],
	},
	{
		guide: 'typography/prose.mdx',
		types: [
			{
				name: 'ProseProps',
				path: 'packages/@luke-ui/react/src/core/prose/prose.tsx',
				props: [],
			},
		],
	},
	{
		guide: 'typography/quote.mdx',
		types: [
			{
				name: 'QuoteProps',
				path: 'packages/@luke-ui/react/src/core/quote/quote.tsx',
				props: ['cite', 'lineClamp', 'textWrap'],
			},
		],
	},
	{
		guide: 'typography/strong.mdx',
		types: [
			{
				name: 'StrongProps',
				path: 'packages/@luke-ui/react/src/core/strong/strong.tsx',
				props: ['lineClamp', 'textWrap'],
			},
		],
	},
	{
		guide: 'typography/text.mdx',
		types: [
			{
				name: 'TextProps',
				path: 'packages/@luke-ui/react/src/core/text/text.tsx',
				props: [
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
			},
		],
	},
	{
		guide: 'visuals/icon.mdx',
		types: [
			{
				name: 'IconProps',
				path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
				props: ['title'],
			},
			{
				name: 'CreateIconOptions',
				path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
				props: ['path', 'viewBox'],
			},
			{
				name: 'CustomIconProps',
				path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
				props: ['title'],
			},
			{
				name: 'IconSpritesheetProviderProps',
				path: 'packages/@luke-ui/react/src/core/icon/icon.tsx',
				props: ['href'],
			},
		],
	},
];
