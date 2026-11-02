"""Writes <out>/N.in for Merit List Swaps. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261113)
MAXN, MAXV = 100_000, 10**9
tests = []


def add(a):
    tests.append(f"{len(a)}\n{' '.join(map(str, a))}\n")


add([3, 1, 2, 5, 4])  # example 1
add([7, 7, 7])  # example 2
add([1])
add([2, 1])
add([1, 2, 3, 4])  # already sorted
add([4, 3, 2, 1])  # reversed: n(n - 1)/2
add([2, 2, 1, 1])  # ties
for _ in range(7):  # small random, brute-checked
    n = rng.randint(1, 50)
    add([rng.randint(1, 10) for _ in range(n)])
add(list(range(MAXN, 0, -1)))  # ~5e9 inversions: needs 64 bits
add([rng.randint(1, MAXV) for _ in range(MAXN)])
add([MAXV] * MAXN)  # all equal: 0
add([rng.randint(1, 5) for _ in range(MAXN)])  # many ties
a = list(range(1, MAXN + 1))
for _ in range(100):  # nearly sorted
    i = rng.randrange(MAXN - 1)
    a[i], a[i + 1] = a[i + 1], a[i]
add(a)
add([MAXV - (i % 2) * i for i in range(MAXN)])  # zigzag

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
