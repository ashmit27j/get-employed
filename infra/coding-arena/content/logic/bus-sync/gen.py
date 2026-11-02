"""Writes <out>/N.in for Campus Bus Sync. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261126)
tests = []


def add(cases):
    lines = [str(len(cases))]
    for c in cases:
        lines += [str(len(c)), " ".join(map(str, c))]
    tests.append("\n".join(lines) + "\n")


def rand_case():
    return [rng.randint(1, 40) for _ in range(rng.randint(1, 20))]


add([[4, 6, 10], [7, 7]])  # example
add([[1]])
add([[40]])
add([[2, 3, 5, 7, 11, 13, 17, 19]])  # primes multiply
add([[8, 4, 2, 16]])  # one divides the next
add([[37, 38, 39, 40, 36, 35, 34, 33, 32, 31, 29, 27, 25, 23]])
add([list(range(21, 41))])  # the 20 largest periods: the largest possible answer
for _ in range(5):
    add([rand_case() for _ in range(rng.randint(1, 10))])
add([rand_case() for _ in range(1000)])
add([list(range(21, 41)) for _ in range(1000)])
add([[1] * 20 for _ in range(1000)])
add([rng.sample(range(1, 41), 20) for _ in range(1000)])
add([[rng.choice([16, 27, 25, 7, 11, 13]) for _ in range(rng.randint(1, 20))] for _ in range(1000)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
