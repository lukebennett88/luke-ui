# Adaptive Button state captures (#925)

Each image shows the same low and standard Buttons in hover and pressed states over an app-painted
overlay. `before` was captured from `origin/main` at `4518fa32`; `after` was captured from this
implementation. Captures use the same Chromium visual test harness and 1024 × 800 viewport.

| Theme   | Mode  | Before                                                        | After                                                       |
| ------- | ----- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| Paper   | Light | ![Paper light before](screenshots/before-paper-light.png)     | ![Paper light after](screenshots/after-paper-light.png)     |
| Paper   | Dark  | ![Paper dark before](screenshots/before-paper-dark.png)       | ![Paper dark after](screenshots/after-paper-dark.png)       |
| Tactile | Light | ![Tactile light before](screenshots/before-tactile-light.png) | ![Tactile light after](screenshots/after-tactile-light.png) |
| Tactile | Dark  | ![Tactile dark before](screenshots/before-tactile-dark.png)   | ![Tactile dark after](screenshots/after-tactile-dark.png)   |
