# Emoji

> Text wrapper for accessible emoji output.

## Import

```ts
import { Emoji } from '@luke-ui/react/emoji';
```

## Usage

```tsx
<Emoji emoji="🎉" label="Celebration" />
```

`label` is required and announced by screen readers in place of the raw emoji
character. Both props are required.

## Props

| Prop    | Type     | Default | Description                                   |
| ------- | -------- | ------- | --------------------------------------------- |
| `emoji` | `string` | —       | Emoji character to render.                    |
| `label` | `string` | —       | Accessible label announced by screen readers. |
