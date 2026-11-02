"""Writes <out>/N.in for UPI Cashback. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261110)
MAXN, MAXX = 50, 50_000
tests = []


def add(x, coins):
    tests.append(f"{len(coins)} {x}\n{' '.join(map(str, coins))}\n")


add(5, [1, 2, 5])  # example 1
add(3, [2])  # example 2
add(1, [1])
add(7, [10])  # every voucher is bigger than X
add(12, [3, 4, 6])
add(100, [7, 13])
for _ in range(6):  # small random, brute-checked
    add(rng.randint(1, 60), rng.sample(range(1, 30), rng.randint(1, 6)))
add(MAXX, list(range(1, MAXN + 1)))  # answer needs the modulo many times over
add(MAXX, [1])  # exactly one way
add(MAXX, rng.sample(range(1, MAXX + 1), MAXN))
add(MAXX, rng.sample(range(2, 200, 2), MAXN))  # only even values
add(MAXX - 1, rng.sample(range(2, 200, 2), MAXN))  # odd target, even values: 0
add(MAXX, [MAXX] + rng.sample(range(1, 100), MAXN - 1))
add(49_999, [101, 103, 107, 109, 113])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
