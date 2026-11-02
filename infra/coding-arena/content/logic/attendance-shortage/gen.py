"""Writes <out>/N.in for Attendance Shortage. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261120)
MAXN, MAXT = 50_000, 10**9
tests = []


def add(t, a):
    tests.append(f"{len(a)} {t}\n{' '.join(map(str, a))}\n")


add(40, [30, 29, 40, 0])  # example 1
add(3, [3, 3])  # example 2
add(1, [0])  # one class, missed
add(1, [1])
add(4, [3, 2, 4])  # exactly 75% is enough
add(3, [2, 3, 1])  # 2/3 = 66.7% is short
add(7, [5, 6, 4])  # 5/7 = 71.4% short, 6/7 = 85.7% fine
for _ in range(6):  # small random
    t = rng.randint(1, 50)
    add(t, [rng.randint(0, t) for _ in range(rng.randint(1, 30))])
add(MAXT, [rng.randint(0, MAXT) for _ in range(MAXN)])
add(MAXT, [750_000_000 - rng.randint(0, 1) for _ in range(MAXN)])  # right at the boundary
add(MAXT, [MAXT] * MAXN)  # nobody short
add(MAXT, [0] * MAXN)  # everybody short
add(999_999_999, [749_999_999, 750_000_000, 749_999_998] * (MAXN // 3))  # 0.75 * T isn't whole
add(4, [rng.randint(0, 4) for _ in range(MAXN)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
