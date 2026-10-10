# @luke-ui/theme-paper

Paper theme for [Luke UI](https://github.com/lukebennett88/luke-ui). It ships a precompiled
stylesheet, its identity class, the `defineTheme` input it was compiled from, and the Inter font it
uses.

## Install

```sh
npm install @luke-ui/theme-paper @luke-ui/react
```

## Use

Import the Luke UI stylesheet, then the theme stylesheet. Import `fonts.css` to load the bundled
Inter font, or load Inter another way.

```ts
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-paper/stylesheet.css';
import '@luke-ui/theme-paper/fonts.css';
```

Set the identity class on `<html>`. It is `luke-ui-theme-paper`, and the root entry exports it. No
other class is needed.

```ts
import { themeClassName } from '@luke-ui/theme-paper';
```

## Extend

`@luke-ui/theme-paper/input` exports `theme`, the input the stylesheet was compiled from. Set it as
`extends` on your own input and compile that with `defineTheme` from
`@luke-ui/react/theme/compiler`. Your compiled stylesheet replaces this package's `stylesheet.css`,
but it still names Inter, so keep importing `fonts.css`.

## Exports

| Export             | Contents                                      |
| ------------------ | --------------------------------------------- |
| `.`                | `themeClassName`                              |
| `./input`          | `theme`, the `defineTheme` input              |
| `./stylesheet.css` | The compiled theme stylesheet                 |
| `./fonts.css`      | `@font-face` rules for the bundled Inter font |

## Font

`fonts.css` declares Inter 4.1 (version 4.001), the Latin subset of the variable `wght` axis from
100 to 900. The file is `inter-latin-wght-normal.woff2` from
[`@fontsource-variable/inter` 5.3.0](https://www.npmjs.com/package/@fontsource-variable/inter/v/5.3.0),
which distributes the Google Fonts build of [Inter](https://github.com/rsms/inter) by The Inter
Project Authors. It is licensed under the SIL Open Font License 1.1, included as
`dist/fonts/OFL.txt`.
