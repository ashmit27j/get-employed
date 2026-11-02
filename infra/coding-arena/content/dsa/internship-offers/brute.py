# Tries every subset of offers. Only for tiny inputs.
import sys

data = sys.stdin.read().split()
n = int(data[0])
offers = [(int(data[1 + 2 * i]), int(data[2 + 2 * i])) for i in range(n)]
best = 0
for mask in range(1 << n):
    pick = sorted(offers[i] for i in range(n) if mask >> i & 1)
    if all(d >= day for day, (d, _) in enumerate(pick, 1)):
        best = max(best, sum(p for _, p in pick))
print(best)
