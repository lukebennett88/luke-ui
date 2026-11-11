| Case               | Check      | Parent corners      | Inset t r b l | Expected              | Actual                | Result |
| ------------------ | ---------- | ------------------- | ------------- | --------------------- | --------------------- | ------ |
| uniform#1          | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| uniform#2          | geometry   | 12 12 12 12         | 4 4 4 4       | 8 8 8 8               | 8 8 8 8               | pass   |
| uniform#3          | geometry   | 8 8 8 8             | 4 4 4 4       | 4 4 4 4               | 4 4 4 4               | pass   |
| uniform#4          | geometry   | 4 4 4 4             | 4 4 4 4       | 0 0 0 0               | 0 0 0 0               | pass   |
| axes               | geometry   | 16 16 16 16         | 4 12 4 12     | 4/12 4/12 4/12 4/12   | 4/12 4/12 4/12 4/12   | pass   |
| sides              | geometry   | 16 16 16 16         | 4 24 8 12     | 4/12 0/12 0/8 4/8     | 4/12 0/12 0/8 4/8     | pass   |
| sides-rtl          | geometry   | 16 16 16 16         | 4 12 8 24     | 0/12 4/12 4/8 0/8     | 0/12 4/12 4/8 0/8     | pass   |
| border             | geometry   | 16 16 16 16         | 10 10 10 10   | 6 6 6 6               | 6 6 6 6               | pass   |
| border-undrawn     | geometry   | 16 16 16 16         | 8 8 8 8       | 8 8 8 8               | 8 8 8 8               | pass   |
| border-responsive  | geometry   | 16 16 16 16         | 10 10 10 10   | 6 6 6 6               | 6 6 6 6               | pass   |
| border-sides       | geometry   | 20 20 20 20         | 10 6 5 14     | 6/10 14/10 14/15 6/15 | 6/10 14/10 14/15 6/15 | pass   |
| responsive         | geometry   | 16 16 16 16         | 12 12 12 12   | 4 4 4 4               | 4 4 4 4               | pass   |
| precedence-axis    | geometry   | 16 16 16 16         | 24 4 24 4     | 12/0 12/0 12/0 12/0   | 12/0 12/0 12/0 12/0   | pass   |
| precedence-side    | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| precedence-mixed   | geometry   | 16 16 16 16         | 4 4 0 4       | 12 12 12/16 12/16     | 12 12 12/16 12/16     | pass   |
| clamp              | geometry   | 8 8 8 8             | 24 24 24 24   | 0 0 0 0               | 0 0 0 0               | pass   |
| full               | geometry   | 9999 9999 9999 9999 | 8 8 8 8       | 9991 9991 9991 9991   | 9991 9991 9991 9991   | pass   |
| no-radius          | geometry   | 0 0 0 0             | 8 8 8 8       | 0 0 0 0               | 0 0 0 0               | pass   |
| flush              | geometry   | 16 16 16 16         | 0 0 0 0       | 16 16 16 16           | 16 16 16 16           | pass   |
| override           | geometry   | 8 8 8 8             | 4 4 4 4       | 4 4 4 4               | 4 4 4 4               | pass   |
| wrapper-box        | geometry   | 16 16 16 16         | 8 8 8 8       | 8 8 8 8               | 8 8 8 8               | pass   |
| wrapper-div        | geometry   | 16 16 16 16         | 8 8 8 8       | 8 8 8 8               | 8 8 8 8               | pass   |
| wrapper-concentric | geometry   | 16 16 16 16         | 8 8 8 8       | 8 8 8 8               | 8 8 8 8               | pass   |
| separated          | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated#1        | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated#2        | geometry   | 12 12 12 12         | 4 4 4 4       | 8 8 8 8               | 8 8 8 8               | pass   |
| query#1            | geometry   | 9999 9999 9999 9999 | 4 4 4 4       | 9995 9995 9995 9995   | 9995 9995 9995 9995   | pass   |
| query#2            | geometry   | 9995 9995 9995 9995 | 4 4 4 4       | 9991 9991 9991 9991   | 9991 9991 9991 9991   | pass   |
| query#3            | geometry   | 9991 9991 9991 9991 | 4 4 4 4       | 9987 9987 9987 9987   | 9987 9987 9987 9987   | pass   |
| query#4            | geometry   | 9987 9987 9987 9987 | 4 4 4 4       | 9983 9983 9983 9983   | 9983 9983 9983 9983   | pass   |
| query#5            | geometry   | 9983 9983 9983 9983 | 4 4 4 4       | 9979 9979 9979 9979   | 9979 9979 9979 9979   | pass   |
| query#6            | geometry   | 9979 9979 9979 9979 | 4 4 4 4       | 9975 9975 9975 9975   | 9975 9975 9975 9975   | pass   |
| query#7            | geometry   | 9975 9975 9975 9975 | 4 4 4 4       | 9971 9971 9971 9971   | 9971 9971 9971 9971   | pass   |
| query#8            | geometry   | 9971 9971 9971 9971 | 4 4 4 4       | 9967 9967 9967 9967   | 9967 9967 9967 9967   | pass   |
| deep#1             | geometry   | 9999 9999 9999 9999 | 4 4 4 4       | 9995 9995 9995 9995   | 9995 9995 9995 9995   | pass   |
| deep#2             | geometry   | 9995 9995 9995 9995 | 4 4 4 4       | 9991 9991 9991 9991   | 9991 9991 9991 9991   | pass   |
| deep#3             | geometry   | 9991 9991 9991 9991 | 4 4 4 4       | 9987 9987 9987 9987   | 9987 9987 9987 9987   | pass   |
| deep#4             | geometry   | 9987 9987 9987 9987 | 4 4 4 4       | 9983 9983 9983 9983   | 9983 9983 9983 9983   | pass   |
| deep#5             | geometry   | 9983 9983 9983 9983 | 4 4 4 4       | 9979 9979 9979 9979   | 9983 9983 9983 9983   | FAIL   |
| deep#6             | geometry   | 9983 9983 9983 9983 | 4 4 4 4       | 9979 9979 9979 9979   | 9983 9983 9983 9983   | FAIL   |
| separated-deep     | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated-deep     | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated-deep     | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated-deep#4   | geometry   | 16 16 16 16         | 4 4 4 4       | 12 12 12 12           | 12 12 12 12           | pass   |
| separated-deep#5   | geometry   | 12 12 12 12         | 4 4 4 4       | 8 8 8 8               | 12 12 12 12           | FAIL   |
| wrapper-padded     | documented |                     |               | 0                     | 0 0 0 0               | pass   |
| style-padding      | documented |                     |               | 12                    | 12 12 12 12           | pass   |
| div-padding        | documented |                     |               | 12                    | 12 12 12 12           | pass   |
| margin             | documented |                     |               | 12                    | 12 12 12 12           | pass   |
| orphan             | documented |                     |               | 0                     | 0 0 0 0               | pass   |
| portal             | documented |                     |               | 0                     | 0 0 0 0               | pass   |
