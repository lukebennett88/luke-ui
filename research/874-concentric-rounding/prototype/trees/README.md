# Captured DOM skeletons

Captured at commit `b6817d75` by `capture.mjs` (viewport 1280x900, Chromium). Schema:
`{p?:[t,r,b,l], r?:radius, b?:border, bg?:1, k?:children}`.

"Padded between radius" = elements with padding and no radius that have a radius ancestor and a
radius descendant.

| File                        | Route                         | How reached                                                              | Elements | Padded | Radius | Nested radius | Padded between radius | Max depth |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------ | -------: | -----: | -----: | ------------: | --------------------: | --------: |
| reference-preferences.json  | `/settings/preferences`       | direct load, wait for settings to render                                 |       88 |     27 |     13 |             7 |                     0 |        16 |
| reference-profile.json      | `/settings/profile`           | direct load, wait for profile form                                       |       78 |     19 |     14 |             8 |                     0 |        15 |
| reference-email-dialog.json | `/settings/profile`           | profile page, clicked the "Change email" button to open the modal dialog |      105 |     25 |     18 |            11 |                     0 |        15 |
| reference-security.json     | `/settings/security`          | direct load, wait for heading                                            |       45 |     13 |      8 |             2 |                     0 |        15 |
| docs-home.json              | `/`                           | prerendered docs home page                                               |      102 |     20 |     21 |            17 |                     0 |        14 |
| docs-button.json            | `/components/actions/button/` | prerendered Button component page (many examples)                        |     2494 |    293 |    224 |           168 |                     7 |        24 |
