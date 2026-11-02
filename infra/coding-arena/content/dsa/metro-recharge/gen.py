"""Writes <out>/N.in for Metro Recharge. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261103)
MAXN, MAXQ, MAXV = 100_000, 25_000, 10**9
tests = []


def add(a, qs):
    lines = [f"{len(a)} {len(qs)}", " ".join(map(str, a))]
    lines += [f"{l} {r}" for l, r in qs]
    tests.append("\n".join(lines) + "\n")


def rand_q(n, q):
    res = []
    for _ in range(q):
        l = rng.randint(1, n)
        res.append((l, rng.randint(l, n)))
    return res


add([40, 0, 25, 60, 15], [(1, 3), (2, 5), (4, 4)])  # example
add([7], [(1, 1)])  # one day
add([0, 0, 0], [(1, 3), (2, 2)])  # all zero
add([MAXV] * 5, [(1, 5), (3, 3)])  # large values
add([5, 1, 4], [(1, 1), (3, 3), (1, 3), (2, 3)])
for _ in range(5):  # small random, brute-checked
    n = rng.randint(1, 40)
    add([rng.randint(0, 100) for _ in range(n)], rand_q(n, rng.randint(1, 30)))
n = MAXN
add([MAXV] * n, [(1, n)] * MAXQ)  # biggest total, many full-range queries
add([rng.randint(0, MAXV) for _ in range(n)], rand_q(n, MAXQ))
add([rng.randint(0, 3) for _ in range(n)], [(i, i) for i in range(1, MAXQ + 1)])
add([rng.randint(0, MAXV) for _ in range(n)], [(1, rng.randint(1, n)) for _ in range(MAXQ)])
add([rng.choice([0, MAXV]) for _ in range(n)], [(rng.randint(1, 10), n - rng.randint(0, 10)) for _ in range(MAXQ)])
add([i % 1000 for i in range(n)], rand_q(n, MAXQ // 2))

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
