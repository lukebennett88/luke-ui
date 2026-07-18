export const textInputSizeVariants = {
	medium: {
		group: { blockSize: 'controlSize.medium', fontSize: '300' },
		control: {
			blockSize: 'controlSize.medium',
			paddingInlineEnd: '300',
			paddingInlineStart: '300',
		},
		adornmentStart: {
			lineHeight: '300',
			paddingInlineEnd: '300',
			paddingInlineStart: '300',
		},
		adornmentEnd: {
			lineHeight: '300',
			paddingInlineEnd: '300',
			paddingInlineStart: '300',
		},
	},
	small: {
		group: {
			blockSize: 'controlSize.small',
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
		},
		control: {
			blockSize: 'controlSize.small',
			paddingInlineEnd: '200',
			paddingInlineStart: '200',
		},
		adornmentStart: {
			lineHeight: '200',
			paddingInlineEnd: '200',
			paddingInlineStart: '200',
		},
		adornmentEnd: {
			lineHeight: '200',
			paddingInlineEnd: '200',
			paddingInlineStart: '200',
		},
	},
};

export type TextInputSizeValue = keyof typeof textInputSizeVariants;
