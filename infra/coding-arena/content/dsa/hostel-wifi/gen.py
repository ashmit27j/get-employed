"""Writes <out>/N.in for Hostel Wi-Fi. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261105)
MAXN, MAXV = 100_000, 10**9
tests = []


def add(k, x):
    tests.append(f"{len(x)} {k}\n{' '.join(map(str, x))}\n")


def distinct(n, hi):
    return rng.sample(range(0, hi + 1), n)


add(3, [1, 2, 8, 4, 9])  # example 1
add(2, [10, 3])  # example 2
add(2, [0, MAXV])  # widest gap
add(3, [0, 1, 2])  # every room used
add(4, [0, 1, 2, 3, 100])  # k = n - 1
add(2, [5, 6, 7, 8])  # k = 2: the two ends
for _ in range(7):  # tiny random, brute-checked (the brute force tries every subset)
    n = rng.randint(2, 11)
    add(rng.randint(2, n), distinct(n, 60))
add(2, distinct(MAXN, MAXV))
add(MAXN, distinct(MAXN, MAXV))  # every room gets a router
add(50_000, distinct(MAXN, MAXV))
add(1000, list(range(MAXN)))  # evenly spaced
add(3, list(range(MAXN - 2)) + [MAXV // 2, MAXV])  # a dense block and two far rooms
add(777, distinct(MAXN, MAXV))
add(10, [i * i for i in range(MAXN // 4)])  # gaps that keep growing

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
