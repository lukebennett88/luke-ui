| Configuration                | Added CSS | Added CSS, gzip |
| ---------------------------- | --------- | --------------- |
| Proposed: gated, 4 levels    | 7792 B    | 913 B           |
| Ungated: every Box publishes | 7551 B    | 879 B           |
| Gated, 2 levels              | 6214 B    | 870 B           |
| Gated, 8 levels              | 11188 B   | 965 B           |
| Gated, unregistered inputs   | 7973 B    | 872 B           |
| Style-query alternation only | 6893 B    | 902 B           |

8,000 Boxes with geometry. Mount / theme-switch restyle, ms:

| Configuration                | Engine   | Today     | Feature built, unused | Feature used on 6,000 | Context on every Box |
| ---------------------------- | -------- | --------- | --------------------- | --------------------- | -------------------- |
| Proposed: gated, 4 levels    | chromium | 25 / 5.4  | 30 / 9.1              | 31 / 13.0             | 28 / 5.4             |
| Proposed: gated, 4 levels    | firefox  | 46 / 2.0  | 48 / 2.0              | 42 / 2.0              | 50 / 2.0             |
| Proposed: gated, 4 levels    | webkit   | 69 / 30.0 | 89 / 49.0             | 146 / 102.0           | 70 / 29.0            |
| Ungated: every Box publishes | chromium | 25 / 5.4  | 25 / 6.1              | 24 / 7.1              | 28 / 5.3             |
| Ungated: every Box publishes | firefox  | 45 / 2.0  | 46 / 3.0              | 40 / 3.0              | 51 / 2.0             |
| Ungated: every Box publishes | webkit   | 69 / 29.0 | 157 / 114.0           | 154 / 111.0           | 69 / 30.0            |
