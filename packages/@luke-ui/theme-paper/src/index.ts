import { getThemeClassName } from '@luke-ui/react/theme';
import { THEME_NAME } from './name.js';

/** Paper's identity class. Set it on `<html>`. */
export const themeClassName: string = getThemeClassName(THEME_NAME);
