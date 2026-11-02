# Walks with a direction and turns right at walls or visited seats.
import sys

data = sys.stdin.read().split()
r, c = int(data[0]), int(data[1])
g = [data[2 + i * c:2 + (i + 1) * c] for i in range(r)]
seen = [[False] * c for _ in range(r)]
dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
i = j = d = 0
out = []
for _ in range(r * c):
    out.append(g[i][j])
    seen[i][j] = True
    ni, nj = i + dirs[d][0], j + dirs[d][1]
    if not (0 <= ni < r and 0 <= nj < c) or seen[ni][nj]:
        d = (d + 1) % 4
        ni, nj = i + dirs[d][0], j + dirs[d][1]
    i, j = ni, nj
print(" ".join(out))
