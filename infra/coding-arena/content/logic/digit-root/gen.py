"""Writes <out>/N.in for Lucky Digit. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261121)
MAXQ = 10_000
TOP = 10**19 - 1
tests = []


def add(nums):
    tests.append(f"{len(nums)}\n" + "\n".join(map(str, nums)) + "\n")


add([9875, 7, 0])  # example
add([0])
add([9])
add([10])
add([18, 19, 99, 100])
add([TOP])  # 19 nines: needs more than a signed 64-bit integer
add([9_223_372_036_854_775_807, 9_223_372_036_854_775_808])  # around 2^63
for _ in range(6):
    add([rng.randint(0, 10**6) for _ in range(rng.randint(1, 20))])
add([rng.randint(0, TOP) for _ in range(MAXQ)])
add([TOP - rng.randint(0, 1000) for _ in range(MAXQ)])
add([9 * rng.randint(1, 10**17) for _ in range(MAXQ)])  # multiples of 9
add([10**k for k in range(19)] * 500)
add(list(range(MAXQ)))

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
