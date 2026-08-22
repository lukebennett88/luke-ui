---
'@luke-ui/react': patch
---

Responsive props on `Box` and Sprinkles resolve against the nearest ancestor size container, not the
browser viewport. The theme stylesheet establishes an unnamed inline-size container on the document
root, so a component keeps its current behaviour unless something narrower sits between it and the
root. A component placed inside a narrower container now responds to that container's width instead
of the page's. A body-level portal, such as a combobox popover or a mobile tray, crosses out of any
local container and resolves against the root container.
