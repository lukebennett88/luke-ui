| Configuration                                          | Added CSS | Added CSS, gzip | Fixture cases that fail                                                                                                                                                                                                                    |
| ------------------------------------------------------ | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Decided design                                         | 9139 B    | 1002 B          | none                                                                                                                                                                                                                                       |
| Without the `:has()` gate                              | 9064 B    | 994 B           | none                                                                                                                                                                                                                                       |
| What a browser without container style queries applies | 5461 B    | 802 B           | uniform#2, uniform#3, uniform#4, wrapper-concentric, separated#2, eight#2, eight#3, eight#4, eight#5, eight#6, eight#7, eight#8, separated-deep#5, wrapper-padded, wrapper-chain, border-zero-width, wrapper-responsive, wrapper-outside#1 |
| With unregistered inputs                               | 9310 B    | 960 B           | none                                                                                                                                                                                                                                       |

Mount, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today  | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ------ | ---------------- | ----------------- | --------------- | ---------------- |
| chromium | reference-security     | 45       | 2                       | 0.190  | 0.216            | 0.220             | 0.213           | 0.212            |
| chromium | reference-profile      | 78       | 8                       | 0.235  | 0.308            | 0.321             | 0.316           | 0.312            |
| chromium | reference-preferences  | 88       | 7                       | 0.264  | 0.350            | 0.357             | 0.348           | 0.341            |
| chromium | reference-email-dialog | 105      | 11                      | 0.294  | 0.398            | 0.412             | 0.401           | 0.391            |
| chromium | docs-home              | 102      | 17                      | 0.263  | 0.366            | 0.385             | 0.363           | 0.356            |
| chromium | docs-button            | 2494     | 168                     | 5.027  | 7.257            | 7.690             | 7.176           | 7.095            |
| chromium | stress                 | 8001     | 6000                    | 27.733 | 32.760           | 38.750            | 35.220          | 29.883           |
| firefox  | reference-security     | 45       | 2                       | 0.325  | 0.396            | 0.450             | 0.498           | 3.925            |
| firefox  | reference-profile      | 78       | 8                       | 0.490  | 0.572            | 0.750             | 2.603           | 0.773            |
| firefox  | reference-preferences  | 88       | 7                       | 0.512  | 0.649            | 0.758             | 0.746           | 0.765            |
| firefox  | reference-email-dialog | 105      | 11                      | 0.610  | 0.754            | 0.987             | 0.867           | 1.027            |
| firefox  | docs-home              | 102      | 17                      | 0.534  | 0.673            | 0.794             | 0.758           | 0.873            |
| firefox  | docs-button            | 2494     | 168                     | 9.813  | 10.200           | 11.143            | 11.000          | 10.857           |
| firefox  | stress                 | 8001     | 6000                    | 53.000 | 59.333           | 56.333            | 54.667          | 50.667           |
| webkit   | reference-security     | 45       | 2                       | 0.329  | 0.420            | 0.547             | 0.610           | 0.694            |
| webkit   | reference-profile      | 78       | 8                       | 0.524  | 0.682            | 0.926             | 1.034           | 1.095            |
| webkit   | reference-preferences  | 88       | 7                       | 0.575  | 0.746            | 0.968             | 1.172           | 1.210            |
| webkit   | reference-email-dialog | 105      | 11                      | 0.673  | 0.867            | 1.190             | 1.282           | 1.364            |
| webkit   | docs-home              | 102      | 17                      | 0.602  | 0.820            | 1.190             | 1.064           | 1.063            |
| webkit   | docs-button            | 2494     | 168                     | 11.357 | 14.182           | 20.000            | 18.667          | 21.429           |
| webkit   | stress                 | 8001     | 6000                    | 71.333 | 94.000           | 200.000           | 177.000         | 208.000          |

Theme switch, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today  | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ------ | ---------------- | ----------------- | --------------- | ---------------- |
| chromium | reference-security     | 45       | 2                       | 0.027  | 0.059            | 0.065             | 0.062           | 0.062            |
| chromium | reference-profile      | 78       | 8                       | 0.042  | 0.097            | 0.108             | 0.102           | 0.099            |
| chromium | reference-preferences  | 88       | 7                       | 0.047  | 0.109            | 0.117             | 0.111           | 0.107            |
| chromium | reference-email-dialog | 105      | 11                      | 0.053  | 0.122            | 0.138             | 0.130           | 0.127            |
| chromium | docs-home              | 102      | 17                      | 0.049  | 0.103            | 0.124             | 0.107           | 0.104            |
| chromium | docs-button            | 2494     | 168                     | 0.947  | 1.676            | 1.910             | 1.750           | 1.718            |
| chromium | stress                 | 8001     | 6000                    | 5.143  | 10.440           | 18.344            | 12.783          | 11.631           |
| firefox  | reference-security     | 45       | 2                       | 0.070  | 0.093            | 0.189             | 0.272           | 1.226            |
| firefox  | reference-profile      | 78       | 8                       | 0.097  | 0.120            | 0.421             | 0.993           | 0.528            |
| firefox  | reference-preferences  | 88       | 7                       | 0.098  | 0.122            | 0.405             | 0.393           | 0.514            |
| firefox  | reference-email-dialog | 105      | 11                      | 0.135  | 0.168            | 0.558             | 0.472           | 0.688            |
| firefox  | docs-home              | 102      | 17                      | 0.107  | 0.134            | 0.386             | 0.326           | 0.444            |
| firefox  | docs-button            | 2494     | 168                     | 0.926  | 1.103            | 3.512             | 3.102           | 3.020            |
| firefox  | stress                 | 8001     | 6000                    | 1.887  | 2.055            | 6.333             | 3.000           | 2.885            |
| webkit   | reference-security     | 45       | 2                       | 0.147  | 0.237            | 0.360             | 0.469           | 0.562            |
| webkit   | reference-profile      | 78       | 8                       | 0.247  | 0.400            | 0.679             | 0.802           | 0.882            |
| webkit   | reference-preferences  | 88       | 7                       | 0.255  | 0.426            | 0.701             | 0.893           | 1.014            |
| webkit   | reference-email-dialog | 105      | 11                      | 0.298  | 0.514            | 0.862             | 1.042           | 1.111            |
| webkit   | docs-home              | 102      | 17                      | 0.277  | 0.560            | 0.820             | 0.781           | 0.862            |
| webkit   | docs-button            | 2494     | 168                     | 5.241  | 9.438            | 16.667            | 14.182          | 17.000           |
| webkit   | stress                 | 8001     | 6000                    | 34.800 | 60.333           | 168.000           | 139.500         | 178.000          |

Insert and remove a rounded subtree, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ----- | ---------------- | ----------------- | --------------- | ---------------- |
| chromium | reference-security     | 45       | 2                       | 0.017 | 0.023            | 0.022             | 0.021           | 0.022            |
| chromium | reference-profile      | 78       | 8                       | 0.017 | 0.023            | 0.023             | 0.022           | 0.022            |
| chromium | reference-preferences  | 88       | 7                       | 0.017 | 0.023            | 0.022             | 0.022           | 0.022            |
| chromium | reference-email-dialog | 105      | 11                      | 0.017 | 0.023            | 0.023             | 0.022           | 0.022            |
| chromium | docs-home              | 102      | 17                      | 0.015 | 0.019            | 0.019             | 0.018           | 0.018            |
| chromium | docs-button            | 2494     | 168                     | 0.017 | 0.020            | 0.020             | 0.019           | 0.019            |
| chromium | stress                 | 8001     | 6000                    | 0.573 | 0.575            | 0.603             | 0.625           | 0.612            |
| firefox  | reference-security     | 45       | 2                       | 0.039 | 0.054            | 0.045             | 0.066           | 0.134            |
| firefox  | reference-profile      | 78       | 8                       | 0.040 | 0.045            | 0.045             | 0.056           | 0.051            |
| firefox  | reference-preferences  | 88       | 7                       | 0.039 | 0.045            | 0.045             | 0.053           | 0.053            |
| firefox  | reference-email-dialog | 105      | 11                      | 0.043 | 0.046            | 0.047             | 0.052           | 0.053            |
| firefox  | docs-home              | 102      | 17                      | 0.047 | 0.052            | 0.052             | 0.058           | 0.058            |
| firefox  | docs-button            | 2494     | 168                     | 0.109 | 0.113            | 0.125             | 0.119           | 0.137            |
| firefox  | stress                 | 8001     | 6000                    | 0.375 | 0.388            | 0.481             | 0.410           | 0.439            |
| webkit   | reference-security     | 45       | 2                       | 0.075 | 0.085            | 0.084             | 0.094           | 0.092            |
| webkit   | reference-profile      | 78       | 8                       | 0.074 | 0.084            | 0.084             | 0.094           | 0.094            |
| webkit   | reference-preferences  | 88       | 7                       | 0.073 | 0.086            | 0.085             | 0.096           | 0.096            |
| webkit   | reference-email-dialog | 105      | 11                      | 0.075 | 0.087            | 0.087             | 0.096           | 0.098            |
| webkit   | docs-home              | 102      | 17                      | 0.079 | 0.095            | 0.123             | 0.091           | 0.090            |
| webkit   | docs-button            | 2494     | 168                     | 0.079 | 0.084            | 0.085             | 0.093           | 0.093            |
| webkit   | stress                 | 8001     | 6000                    | 0.893 | 0.920            | 1.056             | 0.962           | 0.968            |

Unrelated state change on one element, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ----- | ---------------- | ----------------- | --------------- | ---------------- |
| chromium | reference-security     | 45       | 2                       | 0.009 | 0.012            | 0.012             | 0.017           | 0.017            |
| chromium | reference-profile      | 78       | 8                       | 0.009 | 0.012            | 0.012             | 0.017           | 0.017            |
| chromium | reference-preferences  | 88       | 7                       | 0.009 | 0.012            | 0.012             | 0.017           | 0.017            |
| chromium | reference-email-dialog | 105      | 11                      | 0.009 | 0.012            | 0.012             | 0.017           | 0.017            |
| chromium | docs-home              | 102      | 17                      | 0.007 | 0.008            | 0.008             | 0.008           | 0.008            |
| chromium | docs-button            | 2494     | 168                     | 0.013 | 0.014            | 0.014             | 0.014           | 0.014            |
| chromium | stress                 | 8001     | 6000                    | 0.281 | 0.281            | 0.304             | 0.313           | 0.311            |
| firefox  | reference-security     | 45       | 2                       | 0.007 | 0.009            | 0.008             | 0.037           | 0.045            |
| firefox  | reference-profile      | 78       | 8                       | 0.006 | 0.008            | 0.008             | 0.015           | 0.016            |
| firefox  | reference-preferences  | 88       | 7                       | 0.006 | 0.008            | 0.008             | 0.015           | 0.014            |
| firefox  | reference-email-dialog | 105      | 11                      | 0.006 | 0.008            | 0.008             | 0.014           | 0.014            |
| firefox  | docs-home              | 102      | 17                      | 0.003 | 0.003            | 0.003             | 0.003           | 0.003            |
| firefox  | docs-button            | 2494     | 168                     | 0.003 | 0.003            | 0.003             | 0.003           | 0.003            |
| firefox  | stress                 | 8001     | 6000                    | 0.006 | 0.008            | 0.022             | 0.014           | 0.026            |
| webkit   | reference-security     | 45       | 2                       | 0.028 | 0.030            | 0.030             | 0.039           | 0.040            |
| webkit   | reference-profile      | 78       | 8                       | 0.026 | 0.030            | 0.030             | 0.039           | 0.040            |
| webkit   | reference-preferences  | 88       | 7                       | 0.027 | 0.030            | 0.029             | 0.041           | 0.041            |
| webkit   | reference-email-dialog | 105      | 11                      | 0.028 | 0.030            | 0.031             | 0.040           | 0.040            |
| webkit   | docs-home              | 102      | 17                      | 0.032 | 0.037            | 0.051             | 0.034           | 0.034            |
| webkit   | docs-button            | 2494     | 168                     | 0.035 | 0.036            | 0.037             | 0.037           | 0.036            |
| webkit   | stress                 | 8001     | 6000                    | 0.464 | 0.473            | 0.478             | 0.489           | 0.482            |
