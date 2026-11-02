# Runs a fresh graph search for every question. Only for small inputs.
import sys

data = sys.stdin.read().split()
n, q = int(data[0]), int(data[1])
adj = [[] for _ in range(n + 1)]
out = []
pos = 2
for _ in range(q):
    t, a, b = data[pos], int(data[pos + 1]), int(data[pos + 2])
    pos += 3
    if t == "1":
        adj[a].append(b)
        adj[b].append(a)
        continue
    seen = {a}
    stack = [a]
    while stack:
        v = stack.pop()
        for u in adj[v]:
            if u not in seen:
                seen.add(u)
                stack.append(u)
    out.append("Y" if b in seen else "N")
print("".join(out))
