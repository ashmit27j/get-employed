# Relaxes every cell until nothing changes (Bellman-Ford style). Only for small grids.
import sys

data = sys.stdin.read().split()
r, c = int(data[0]), int(data[1])
g = data[2:2 + r]
INF = 10**9
d = [[INF] * c for _ in range(r)]
for i in range(r):
    for j in range(c):
        if g[i][j] == "S":
            d[i][j] = 0
changed = True
while changed:
    changed = False
    for i in range(r):
        for j in range(c):
            if g[i][j] == "#":
                continue
            for a, b in ((i - 1, j), (i + 1, j), (i, j - 1), (i, j + 1)):
                if 0 <= a < r and 0 <= b < c and d[a][b] + 1 < d[i][j]:
                    d[i][j] = d[a][b] + 1
                    changed = True
ans = next(d[i][j] for i in range(r) for j in range(c) if g[i][j] == "E")
print(ans if ans < INF else -1)
