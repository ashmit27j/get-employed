import heapq
import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, m = int(data[0]), int(data[1])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v, w = int(data[2 + 3 * i]), int(data[3 + 3 * i]), int(data[4 + 3 * i])
        adj[u].append((v, w))
        adj[v].append((u, w))
    INF = float("inf")
    # State s = 2 * v + used: junction v, with the coupon used (1) or not (0).
    dist = [INF] * (2 * n + 2)
    dist[2] = 0
    heap = [(0, 2)]
    while heap:
        d, s = heapq.heappop(heap)
        if d > dist[s]:
            continue
        v, used = s >> 1, s & 1
        for u, w in adj[v]:
            t = 2 * u + used
            if d + w < dist[t]:
                dist[t] = d + w
                heapq.heappush(heap, (d + w, t))
            if not used and d < dist[t + 1]:
                dist[t + 1] = d
                heapq.heappush(heap, (d, t + 1))
    best = min(dist[2 * n], dist[2 * n + 1])
    print(best if best < INF else -1)


main()
