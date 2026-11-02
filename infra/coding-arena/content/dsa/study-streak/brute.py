import sys

data = sys.stdin.read().split()
n, s = int(data[0]), int(data[1])
a = list(map(int, data[2:2 + n]))
best = 0
for i in range(n):
    total = 0
    for j in range(i, n):
        total += a[j]
        if total <= s:
            best = max(best, j - i + 1)
print(best)
