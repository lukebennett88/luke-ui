# Reference app

Internal product-shaped settings app for [#713](https://github.com/lukebennett88/luke-ui/issues/713)
/ [#709](https://github.com/lukebennett88/luke-ui/issues/709).

Routes: Profile, Preferences, Interface, Account. Uses public `@luke-ui/react` APIs, React Router
Data Mode, TanStack Form, Zod, and a localStorage-backed fake API. Friction notes live in
[`FRICTION.md`](./FRICTION.md).

```bash
pnpm --filter=reference-app run dev
```

Dev server: http://localhost:5174
