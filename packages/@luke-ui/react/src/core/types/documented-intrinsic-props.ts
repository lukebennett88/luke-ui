import type { ComponentProps } from 'react';

export interface DocumentedSpanElementProps {
	children?: ComponentProps<'span'>['children'];
	className?: ComponentProps<'span'>['className'];
	id?: ComponentProps<'span'>['id'];
	style?: ComponentProps<'span'>['style'];
}

export interface DocumentedCodeElementProps {
	children?: ComponentProps<'code'>['children'];
	className?: ComponentProps<'code'>['className'];
	id?: ComponentProps<'code'>['id'];
	style?: ComponentProps<'code'>['style'];
}

export interface DocumentedKbdElementProps {
	children?: ComponentProps<'kbd'>['children'];
	className?: ComponentProps<'kbd'>['className'];
	id?: ComponentProps<'kbd'>['id'];
	style?: ComponentProps<'kbd'>['style'];
}
