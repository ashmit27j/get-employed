# Makes each road free in turn (and none), runs Bellman-Ford each time. Only for small inputs.
import sys

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
roads = [(int(data[2 + 3 * i]), int(data[3 + 3 * i]), int(data[4 + 3 * i])) for i in range(m)]
INF = float("inf")


def cheapest(free):
    d = [INF] * (n + 1)
    d[1] = 0
    for _ in range(n):
        for i, (u, v, w) in enumerate(roads):
            cost = 0 if i == free else w
            if d[u] + cost < d[v]:
                d[v] = d[u] + cost
            if d[v] + cost < d[u]:
                d[u] = d[v] + cost
    return d[n]


best = min([cheapest(-1)] + [cheapest(i) for i in range(m)])
print(best if best < INF else -1)
