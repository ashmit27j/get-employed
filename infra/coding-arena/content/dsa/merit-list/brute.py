# Bubble sort, counting swaps. Only for small inputs.
import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
swaps = 0
changed = True
while changed:
    changed = False
    for i in range(n - 1):
        if a[i] > a[i + 1]:
            a[i], a[i + 1] = a[i + 1], a[i]
            swaps += 1
            changed = True
print(swaps)
