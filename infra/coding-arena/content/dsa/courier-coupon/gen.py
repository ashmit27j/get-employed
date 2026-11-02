"""Writes <out>/N.in for Courier Coupon. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261112)
MAXN, MAXM, MAXW = 100_000, 100_000, 10**6
tests = []


def add(n, roads):
    tests.append(f"{n} {len(roads)}\n" + "".join(f"{u} {v} {w}\n" for u, v, w in roads))


def random_roads(n, m, maxw):
    return [(rng.randint(1, n), rng.randint(1, n), rng.randint(1, maxw)) for _ in range(m)]


add(4, [(1, 2, 5), (2, 4, 100), (1, 3, 20), (3, 4, 30)])  # example 1
add(3, [(1, 2, 7)])  # example 2
add(2, [(1, 2, 9)])  # one road, made free
add(2, [])  # no roads
add(3, [(1, 2, 4), (2, 3, 4), (1, 3, 100)])  # free the direct road
add(4, [(1, 1, 5), (1, 2, 3), (2, 2, 1), (2, 3, 8), (3, 4, 2), (3, 4, 9)])  # loops and repeats
for _ in range(7):  # small random, brute-checked
    n = rng.randint(2, 9)
    add(n, random_roads(n, rng.randint(0, 14), 30))
n = MAXN
add(n, [(i, i + 1, MAXW) for i in range(1, n)])  # one long path: answer ~1e11, needs 64 bits
add(n, random_roads(n, MAXM, MAXW))
add(n, [(1, i, MAXW) for i in range(2, n + 1)])  # a star: free the road to n
grid_w = 220  # a grid of junctions, many equal-length routes
roads = []
for i in range(grid_w * grid_w):
    r, c = divmod(i, grid_w)
    if c + 1 < grid_w and len(roads) < MAXM:
        roads.append((i + 1, i + 2, rng.randint(1, 10)))
    if r + 1 < grid_w and len(roads) < MAXM:
        roads.append((i + 1, i + 1 + grid_w, rng.randint(1, 10)))
add(grid_w * grid_w, roads)
add(n, random_roads(n // 2, MAXM, MAXW))  # junctions above n/2 are cut off: -1
path = [(i, i + 1, 1) for i in range(1, n)]
path[n // 2] = (n // 2 + 1, n // 2 + 2, MAXW)  # one expensive bridge
add(n, path)

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
