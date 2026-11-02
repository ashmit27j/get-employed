"""Writes <out>/N.in for Leap Year Count. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261123)
TOP = 10**18
MAXQ = 10_000
tests = []


def add(qs):
    tests.append(f"{len(qs)}\n" + "".join(f"{l} {r}\n" for l, r in qs))


def rand_range(hi):
    l = rng.randint(1, hi)
    return (l, rng.randint(l, hi))


add([(1996, 2004), (1900, 1900), (2000, 2000)])  # example
add([(1, 3)])  # no leap years
add([(1, 4)])
add([(1, 400)])  # one whole cycle: 97
add([(100, 100), (400, 400), (2100, 2100), (2024, 2024)])
add([(1, TOP)])  # the whole range
add([(TOP, TOP), (TOP - 3, TOP)])
for _ in range(6):
    add([rand_range(5000) for _ in range(rng.randint(1, 20))])
add([rand_range(TOP) for _ in range(MAXQ)])
add([(1, rng.randint(1, TOP)) for _ in range(MAXQ)])  # L = 1 needs f(0)
add([(y, y) for y in (rng.randint(1, TOP) // 100 * 100 for _ in range(MAXQ))])  # century years
add([rand_range(10**6) for _ in range(MAXQ)])
add([(rng.randint(1, 3000), rng.randint(3000, 9999)) for _ in range(MAXQ)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
