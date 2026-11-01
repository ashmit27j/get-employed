"""Writes <out>/N.in for Drone Pairs. Deterministic: the same seed always gives the same files."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261102)
MAXN, MAXV = 200_000, 10**9
tests = []


def add(k, a):
    tests.append(f"{len(a)} {k}\n{' '.join(map(str, a))}\n")


add(6, [1, 5, 3, 3, 7])  # example 1
add(10, [5, 5, 5, 5])  # example 2
add(2, [1])  # a single parcel
add(0, [0, 0])  # a zero pair
add(0, [-3, 3, 3, -3, 0])  # negatives
add(4, [2])  # 2x = K but only one parcel
add(2 * MAXV, [MAXV, MAXV, MAXV])  # the sum overflows 32 bits
add(-2 * MAXV, [-MAXV, -MAXV])  # the negative extreme
add(7, [1, 2, 3])  # no pairs
for _ in range(5):  # small random, brute-checked
    n = rng.randint(2, 60)
    add(rng.randint(-15, 15), [rng.randint(-10, 10) for _ in range(n)])
add(2, [1] * MAXN)  # answer ~2e10: needs 64 bits, and kills O(n^2)
add(10**9, [rng.randint(0, 10**9) for _ in range(MAXN)])  # max random
add(0, [rng.randint(-50, 50) for _ in range(MAXN)])  # many duplicates
half = [rng.randint(1, MAXV) for _ in range(MAXN // 2)]  # every value has a partner
a = half + [MAXV - x for x in half]
rng.shuffle(a)
add(MAXV, a)
add(2**31, [(i * (1 << 16)) % MAXV for i in range(MAXN)])  # structured values
add(0, [rng.choice([-7, 7]) for _ in range(MAXN)])  # two values only

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
