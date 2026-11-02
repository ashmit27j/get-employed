"""Writes <out>/N.in for Screen-Time Streak. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261106)
MAXN, MAXV = 200_000, 10**9
tests = []


def add(s, a):
    tests.append(f"{len(a)} {s}\n{' '.join(map(str, a))}\n")


add(10, [2, 5, 1, 3, 8, 2])  # example 1
add(0, [0, 1, 0])  # example 2
add(4, [5, 6, 7])  # every day over budget
add(100, [1, 2, 3])  # the whole range fits
add(0, [0, 0, 0, 0])  # zeros fit a zero budget
add(5, [5])  # exactly the budget
add(3, [1, 9, 1, 1, 1, 9, 1])  # streak in the middle
for _ in range(6):  # small random, brute-checked
    n = rng.randint(1, 60)
    add(rng.randint(0, 40), [rng.randint(0, 12) for _ in range(n)])
add(10**15, [MAXV] * MAXN)  # everything fits, total 2e14
add(MAXV - 1, [MAXV] * MAXN)  # nothing fits
add(5 * 10**10, [rng.randint(0, MAXV) for _ in range(MAXN)])
add(1000, [rng.randint(0, 20) for _ in range(MAXN)])
add(0, [rng.choice([0, 0, 0, 1]) for _ in range(MAXN)])
add(10**9, [0] * (MAXN // 2) + [MAXV] + [0] * (MAXN // 2 - 1))  # a big day in the middle
add(7 * 10**11, [rng.randint(MAXV // 2, MAXV) for _ in range(MAXN)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
