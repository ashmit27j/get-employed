"""Writes <out>/N.in for Seating Spiral. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261124)
M = 200
tests = []


def add(rows):
    tests.append(f"{len(rows)} {len(rows[0])}\n" + "\n".join(" ".join(map(str, r)) for r in rows) + "\n")


def counting(r, c):
    return [[i * c + j + 1 for j in range(c)] for i in range(r)]


def rand(r, c):
    return [[rng.randint(0, 9999) for _ in range(c)] for _ in range(r)]


add(counting(3, 4))  # example
add([[7]])  # one seat
add(counting(1, 5))  # one row
add(counting(5, 1))  # one column
add(counting(2, 2))
add(counting(3, 3))  # odd square: a single centre seat
add(counting(4, 2))
add(counting(2, 5))
for _ in range(5):
    add(rand(rng.randint(1, 8), rng.randint(1, 8)))
add(rand(M, M))
add(rand(1, M))
add(rand(M, 1))
add(rand(M, M - 1))
add(rand(M - 1, M))
add([[0] * M for _ in range(M)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
