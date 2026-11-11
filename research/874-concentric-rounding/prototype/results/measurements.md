| Configuration                                       | Added CSS | Added CSS, gzip | Fixture cases that fail                                                                                                                                                                                                                                    |
| --------------------------------------------------- | --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proposed: style query, wrappers accumulate          | 6858 B    | 897 B           | none                                                                                                                                                                                                                                                       |
| Proposed, without the `:has()` gate                 | 6813 B    | 888 B           | none                                                                                                                                                                                                                                                       |
| Proposed, in a browser without style queries        | 5516 B    | 801 B           | uniform#2, uniform#3, uniform#4, wrapper-concentric, separated#2, eight#2, eight#3, eight#4, eight#5, eight#6, eight#7, eight#8, separated-deep#5, wrapper-padded, wrapper-chain, wrapper-border, wrapper-responsive, wrapper-outside#1, wrapper-outside#2 |
| Style query over 4 selector levels                  | 18978 B   | 1051 B          | none                                                                                                                                                                                                                                                       |
| 4 selector levels, wrappers accumulate              | 16268 B   | 1001 B          | uniform#4, eight#4, eight#5, eight#6, eight#7, eight#8, separated-deep#5, wrapper-outside#1, wrapper-outside#2                                                                                                                                             |
| 12 selector levels, wrappers accumulate             | 95188 B   | 1700 B          | none                                                                                                                                                                                                                                                       |
| First round: 4 selector levels, wrappers are square | 7772 B    | 910 B           | eight#5, eight#6, eight#7, eight#8, separated-deep#5, wrapper-padded, wrapper-chain, wrapper-border, wrapper-responsive, wrapper-outside#1                                                                                                                 |

Mount, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today  | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted | First round, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ------ | ---------------- | ----------------- | --------------- | ---------------- | -------------------- |
| chromium | reference-security     | 45       | 2                       | 0.193  | 0.207            | 0.204             | 0.205           | 0.197            | 0.197                |
| chromium | reference-profile      | 78       | 8                       | 0.232  | 0.302            | 0.287             | 0.278           | 0.283            | 0.270                |
| chromium | reference-preferences  | 88       | 7                       | 0.261  | 0.323            | 0.329             | 0.310           | 0.313            | 0.294                |
| chromium | reference-email-dialog | 105      | 11                      | 0.286  | 0.371            | 0.371             | 0.350           | 0.355            | 0.350                |
| chromium | docs-home              | 102      | 17                      | 0.272  | 0.331            | 0.344             | 0.321           | 0.317            | 0.327                |
| chromium | docs-button            | 2494     | 168                     | 4.855  | 6.591            | 6.704             | 6.342           | 6.433            | 6.088                |
| chromium | stress                 | 8001     | 6000                    | 26.317 | 30.400           | 33.440            | 27.300          | 29.267           | 33.200               |
| firefox  | reference-security     | 45       | 2                       | 0.323  | 0.383            | 0.434             | 0.420           | 0.445            | 0.395                |
| firefox  | reference-profile      | 78       | 8                       | 0.475  | 0.575            | 0.688             | 0.610           | 0.680            | 0.584                |
| firefox  | reference-preferences  | 88       | 7                       | 0.521  | 0.638            | 0.718             | 0.644           | 0.688            | 0.630                |
| firefox  | reference-email-dialog | 105      | 11                      | 0.610  | 0.750            | 0.909             | 0.789           | 0.898            | 0.777                |
| firefox  | docs-home              | 102      | 17                      | 0.542  | 0.661            | 0.765             | 0.685           | 0.732            | 0.667                |
| firefox  | docs-button            | 2494     | 168                     | 9.688  | 10.200           | 10.786            | 10.267          | 10.133           | 9.813                |
| firefox  | stress                 | 8001     | 6000                    | 55.667 | 54.667           | 52.333            | 52.667          | 47.250           | 51.000               |
| webkit   | reference-security     | 45       | 2                       | 0.330  | 0.401            | 0.500             | 0.495           | 0.532            | 0.432                |
| webkit   | reference-profile      | 78       | 8                       | 0.510  | 0.644            | 0.806             | 0.882           | 0.933            | 0.683                |
| webkit   | reference-preferences  | 88       | 7                       | 0.644  | 0.708            | 0.962             | 0.932           | 1.034            | 0.829                |
| webkit   | reference-email-dialog | 105      | 11                      | 0.673  | 0.847            | 1.119             | 1.071           | 1.144            | 0.980                |
| webkit   | docs-home              | 102      | 17                      | 0.595  | 0.829            | 0.909             | 0.904           | 0.932            | 0.820                |
| webkit   | docs-button            | 2494     | 168                     | 10.467 | 14.455           | 18.000            | 15.800          | 18.333           | 14.182               |
| webkit   | stress                 | 8001     | 6000                    | 91.500 | 94.000           | 191.000           | 154.000         | 204.000          | 138.000              |

Theme switch, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today  | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted | First round, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ------ | ---------------- | ----------------- | --------------- | ---------------- | -------------------- |
| chromium | reference-security     | 45       | 2                       | 0.026  | 0.050            | 0.052             | 0.048           | 0.048            | 0.040                |
| chromium | reference-profile      | 78       | 8                       | 0.041  | 0.083            | 0.086             | 0.078           | 0.077            | 0.075                |
| chromium | reference-preferences  | 88       | 7                       | 0.046  | 0.091            | 0.098             | 0.087           | 0.088            | 0.081                |
| chromium | reference-email-dialog | 105      | 11                      | 0.053  | 0.103            | 0.109             | 0.099           | 0.100            | 0.098                |
| chromium | docs-home              | 102      | 17                      | 0.050  | 0.086            | 0.097             | 0.081           | 0.085            | 0.097                |
| chromium | docs-button            | 2494     | 168                     | 0.936  | 1.478            | 1.583             | 1.391           | 1.422            | 1.496                |
| chromium | stress                 | 8001     | 6000                    | 5.007  | 8.242            | 13.242            | 6.730           | 10.253           | 14.373               |
| firefox  | reference-security     | 45       | 2                       | 0.071  | 0.090            | 0.152             | 0.165           | 0.194            | 0.126                |
| firefox  | reference-profile      | 78       | 8                       | 0.096  | 0.124            | 0.329             | 0.245           | 0.395            | 0.186                |
| firefox  | reference-preferences  | 88       | 7                       | 0.096  | 0.125            | 0.314             | 0.240           | 0.396            | 0.178                |
| firefox  | reference-email-dialog | 105      | 11                      | 0.128  | 0.163            | 0.411             | 0.327           | 0.507            | 0.260                |
| firefox  | docs-home              | 102      | 17                      | 0.107  | 0.131            | 0.300             | 0.224           | 0.337            | 0.216                |
| firefox  | docs-button            | 2494     | 168                     | 0.893  | 0.987            | 1.987             | 1.716           | 2.273            | 1.261                |
| firefox  | stress                 | 8001     | 6000                    | 1.852  | 2.027            | 43.000            | 2.338           | 44.750           | 2.273                |
| webkit   | reference-security     | 45       | 2                       | 0.148  | 0.232            | 0.318             | 0.356           | 0.394            | 0.268                |
| webkit   | reference-profile      | 78       | 8                       | 0.235  | 0.379            | 0.558             | 0.595           | 0.682            | 0.493                |
| webkit   | reference-preferences  | 88       | 7                       | 0.257  | 0.412            | 0.602             | 0.649           | 0.746            | 0.556                |
| webkit   | reference-email-dialog | 105      | 11                      | 0.417  | 0.487            | 0.694             | 0.758           | 0.872            | 0.682                |
| webkit   | docs-home              | 102      | 17                      | 0.276  | 0.442            | 0.628             | 0.630           | 0.708            | 0.638                |
| webkit   | docs-button            | 2494     | 168                     | 5.000  | 8.158            | 12.154            | 10.733          | 13.167           | 12.750               |
| webkit   | stress                 | 8001     | 6000                    | 32.800 | 56.667           | 160.000           | 117.500         | 173.000          | 106.000              |

Insert and remove a rounded subtree, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted | First round, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ----- | ---------------- | ----------------- | --------------- | ---------------- | -------------------- |
| chromium | reference-security     | 45       | 2                       | 0.017 | 0.021            | 0.021             | 0.020           | 0.020            | 0.019                |
| chromium | reference-profile      | 78       | 8                       | 0.017 | 0.021            | 0.021             | 0.021           | 0.020            | 0.019                |
| chromium | reference-preferences  | 88       | 7                       | 0.017 | 0.021            | 0.021             | 0.020           | 0.020            | 0.020                |
| chromium | reference-email-dialog | 105      | 11                      | 0.017 | 0.021            | 0.021             | 0.021           | 0.020            | 0.020                |
| chromium | docs-home              | 102      | 17                      | 0.015 | 0.017            | 0.018             | 0.017           | 0.017            | 0.017                |
| chromium | docs-button            | 2494     | 168                     | 0.017 | 0.019            | 0.019             | 0.019           | 0.018            | 0.018                |
| chromium | stress                 | 8001     | 6000                    | 0.579 | 0.577            | 0.578             | 0.565           | 0.572            | 0.594                |
| firefox  | reference-security     | 45       | 2                       | 0.039 | 0.046            | 0.046             | 0.049           | 0.050            | 0.042                |
| firefox  | reference-profile      | 78       | 8                       | 0.040 | 0.047            | 0.046             | 0.050           | 0.050            | 0.042                |
| firefox  | reference-preferences  | 88       | 7                       | 0.039 | 0.046            | 0.046             | 0.051           | 0.050            | 0.043                |
| firefox  | reference-email-dialog | 105      | 11                      | 0.040 | 0.047            | 0.047             | 0.050           | 0.051            | 0.043                |
| firefox  | docs-home              | 102      | 17                      | 0.048 | 0.051            | 0.051             | 0.056           | 0.057            | 0.051                |
| firefox  | docs-button            | 2494     | 168                     | 0.110 | 0.114            | 0.114             | 0.119           | 0.117            | 0.109                |
| firefox  | stress                 | 8001     | 6000                    | 0.375 | 0.387            | 0.432             | 0.408           | 0.431            | 0.430                |
| webkit   | reference-security     | 45       | 2                       | 0.075 | 0.083            | 0.084             | 0.089           | 0.087            | 0.083                |
| webkit   | reference-profile      | 78       | 8                       | 0.074 | 0.085            | 0.086             | 0.093           | 0.091            | 0.080                |
| webkit   | reference-preferences  | 88       | 7                       | 0.078 | 0.085            | 0.088             | 0.085           | 0.090            | 0.084                |
| webkit   | reference-email-dialog | 105      | 11                      | 0.074 | 0.083            | 0.089             | 0.089           | 0.087            | 0.085                |
| webkit   | docs-home              | 102      | 17                      | 0.076 | 0.083            | 0.085             | 0.086           | 0.086            | 0.077                |
| webkit   | docs-button            | 2494     | 168                     | 0.081 | 0.084            | 0.087             | 0.090           | 0.093            | 0.081                |
| webkit   | stress                 | 8001     | 6000                    | 0.872 | 0.898            | 1.027             | 0.932           | 0.962            | 1.049                |

Unrelated state change on one element, ms:

| Engine   | Page                   | Elements | Concentric when adopted | Today | Proposed, unused | Proposed, adopted | Ungated, unused | Ungated, adopted | First round, adopted |
| -------- | ---------------------- | -------- | ----------------------- | ----- | ---------------- | ----------------- | --------------- | ---------------- | -------------------- |
| chromium | reference-security     | 45       | 2                       | 0.009 | 0.012            | 0.012             | 0.015           | 0.015            | 0.012                |
| chromium | reference-profile      | 78       | 8                       | 0.009 | 0.012            | 0.012             | 0.015           | 0.015            | 0.012                |
| chromium | reference-preferences  | 88       | 7                       | 0.009 | 0.012            | 0.012             | 0.015           | 0.015            | 0.012                |
| chromium | reference-email-dialog | 105      | 11                      | 0.009 | 0.012            | 0.012             | 0.015           | 0.015            | 0.012                |
| chromium | docs-home              | 102      | 17                      | 0.007 | 0.008            | 0.008             | 0.008           | 0.008            | 0.008                |
| chromium | docs-button            | 2494     | 168                     | 0.013 | 0.014            | 0.014             | 0.013           | 0.014            | 0.013                |
| chromium | stress                 | 8001     | 6000                    | 0.276 | 0.278            | 0.295             | 0.278           | 0.295            | 0.302                |
| firefox  | reference-security     | 45       | 2                       | 0.006 | 0.008            | 0.008             | 0.011           | 0.011            | 0.008                |
| firefox  | reference-profile      | 78       | 8                       | 0.006 | 0.008            | 0.008             | 0.011           | 0.011            | 0.008                |
| firefox  | reference-preferences  | 88       | 7                       | 0.006 | 0.008            | 0.008             | 0.011           | 0.011            | 0.008                |
| firefox  | reference-email-dialog | 105      | 11                      | 0.006 | 0.008            | 0.008             | 0.011           | 0.011            | 0.008                |
| firefox  | docs-home              | 102      | 17                      | 0.003 | 0.003            | 0.003             | 0.003           | 0.003            | 0.003                |
| firefox  | docs-button            | 2494     | 168                     | 0.003 | 0.003            | 0.003             | 0.003           | 0.003            | 0.003                |
| firefox  | stress                 | 8001     | 6000                    | 0.006 | 0.008            | 0.022             | 0.014           | 0.025            | 0.022                |
| webkit   | reference-security     | 45       | 2                       | 0.028 | 0.029            | 0.030             | 0.036           | 0.036            | 0.030                |
| webkit   | reference-profile      | 78       | 8                       | 0.028 | 0.030            | 0.030             | 0.036           | 0.036            | 0.029                |
| webkit   | reference-preferences  | 88       | 7                       | 0.027 | 0.030            | 0.030             | 0.037           | 0.035            | 0.029                |
| webkit   | reference-email-dialog | 105      | 11                      | 0.028 | 0.029            | 0.030             | 0.036           | 0.036            | 0.030                |
| webkit   | docs-home              | 102      | 17                      | 0.033 | 0.034            | 0.035             | 0.034           | 0.034            | 0.033                |
| webkit   | docs-button            | 2494     | 168                     | 0.037 | 0.039            | 0.039             | 0.036           | 0.036            | 0.036                |
| webkit   | stress                 | 8001     | 6000                    | 0.453 | 0.459            | 0.464             | 0.475           | 0.478            | 0.493                |
