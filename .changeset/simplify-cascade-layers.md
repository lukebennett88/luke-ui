---
'@luke-ui/react': minor
---

Remove the dedicated `theme` cascade layer. Root base colour and body typography now live in
`reset`. Update any consumer `@layer` order from
`reset, theme, base, recipes, structural, utilities` to
`reset, base, recipes, structural, utilities`.
