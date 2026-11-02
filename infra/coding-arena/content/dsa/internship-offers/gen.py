"""Writes <out>/N.in for Internship Offers. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261109)
MAXN, MAXD, MAXP = 100_000, 100_000, 10**9
tests = []


def add(offers):
    tests.append(f"{len(offers)}\n" + "\n".join(f"{d} {p}" for d, p in offers) + "\n")


add([(2, 50), (1, 10), (2, 20), (1, 30)])  # example 1
add([(3, 5), (3, 6), (3, 7)])  # example 2
add([(1, 9)])  # one offer
add([(1, 4), (1, 9), (1, 2)])  # same deadline, keep the best
add([(5, 1), (1, 100)])  # a late, small offer and an urgent, big one
add([(2, 3), (2, 3), (1, 3), (3, 3)])  # equal stipends
for _ in range(7):  # tiny random, brute-checked (the brute force tries every subset)
    n = rng.randint(1, 12)
    add([(rng.randint(1, 5), rng.randint(1, 30)) for _ in range(n)])
add([(1, rng.randint(1, MAXP)) for _ in range(MAXN)])  # one slot
add([(MAXD, MAXP) for _ in range(MAXN)])  # everything fits: answer 1e14
add([(rng.randint(1, MAXD), rng.randint(1, MAXP)) for _ in range(MAXN)])
add([(rng.randint(1, 100), rng.randint(1, MAXP)) for _ in range(MAXN)])  # heavy competition
add([(i // 2 + 1, MAXP - i) for i in range(MAXN)])  # two offers per deadline
add([(rng.randint(1, 1000), rng.randint(1, 10)) for _ in range(MAXN)])  # many ties

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
