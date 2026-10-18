import type { ButtonProps, ButtonRecipeVariants } from '@luke-ui/react/button';
import type { CheckboxFieldProps } from '@luke-ui/react/checkbox-field';
import type { ComboboxFieldProps } from '@luke-ui/react/combobox-field';
import type { FormProps } from '@luke-ui/react/form';
import type { IconButtonProps } from '@luke-ui/react/icon-button';
import type { IconLinkProps } from '@luke-ui/react/icon-link';
import type { LinkProps } from '@luke-ui/react/link';
import type { ButtonProps as PrimitiveButtonProps } from '@luke-ui/react/primitives/button';
import type { CheckboxRootProps } from '@luke-ui/react/primitives/checkbox';
import type { ComboboxControlProps } from '@luke-ui/react/primitives/combobox';
import type { SelectRootProps } from '@luke-ui/react/primitives/select';
import type { SwitchRootProps } from '@luke-ui/react/primitives/switch';
import type { TextInputProps, TextInputControlProps } from '@luke-ui/react/primitives/text-input';
import type { SelectFieldProps } from '@luke-ui/react/select-field';
import type { SwitchFieldProps } from '@luke-ui/react/switch-field';
import type { TextInputFieldProps } from '@luke-ui/react/text-input-field';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('compatible public controls and Form expose the same scalar recipe sizes', () => {
	type Size = 'small' | 'medium' | undefined;
	expectTypeOf<FormProps['controlSize']>().toEqualTypeOf<Size>();
	expectTypeOf<ButtonProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<ButtonRecipeVariants['size']>().toEqualTypeOf<Size>();
	expectTypeOf<PrimitiveButtonProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<IconButtonProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<IconLinkProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<LinkProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<CheckboxRootProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<SwitchRootProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<TextInputProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<TextInputControlProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<ComboboxControlProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<SelectRootProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<CheckboxFieldProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<SwitchFieldProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<TextInputFieldProps['size']>().toEqualTypeOf<Size>();
	expectTypeOf<ComboboxFieldProps<object>['size']>().toEqualTypeOf<Size>();
	expectTypeOf<SelectFieldProps<object>['size']>().toEqualTypeOf<Size>();
	// @ts-expect-error — responsive defaults are outside the control-size contract
	assertType<FormProps>({ controlSize: { initial: 'small' } });
	// @ts-expect-error — large indicators are unsupported
	assertType<CheckboxFieldProps>({ label: 'Example', size: 'large' });
});
