"""Writes <out>/N.in for Price Watch. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261104)
MAXN, MAXV = 200_000, 10**9
tests = []


def add(p):
    tests.append(f"{len(p)}\n{' '.join(map(str, p))}\n")


add([3, 1, 4, 1, 5, 9])  # example 1
add([5, 5, 5, 5])  # example 2
add([7])  # one day
add([1, 2, 3, 4, 5])  # rising: every wait is 1
add([5, 4, 3, 2, 1])  # falling: no waits
add([2, 2, 3])  # ties then a rise
add([4, 1, 1, 1, 5])
for _ in range(6):  # small random, brute-checked
    n = rng.randint(1, 60)
    add([rng.randint(1, 8) for _ in range(n)])
add(list(range(MAXN, 1, -1)) + [MAXV])  # one peak at the end: answer ~ n^2/2
add([rng.randint(1, MAXV) for _ in range(MAXN)])  # random
add([MAXV] * MAXN)  # all equal
add(list(range(1, MAXN + 1)))  # rising
add([rng.randint(1, 3) for _ in range(MAXN)])  # few values
add([MAXV - i if i % 2 else i + 1 for i in range(MAXN)])  # zigzag
half = MAXN // 2
add(list(range(half, 0, -1)) + list(range(half, 0, -1)) [:-1] + [MAXV])  # two falls, then a peak

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
