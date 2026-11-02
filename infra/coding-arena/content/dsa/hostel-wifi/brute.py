# Tries every set of k rooms. Only for tiny inputs.
import sys
from itertools import combinations

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
x = sorted(map(int, data[2:2 + n]))
best = 0
for c in combinations(x, k):
    best = max(best, min(c[i + 1] - c[i] for i in range(k - 1)))
print(best)
