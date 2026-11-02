"""Writes <out>/N.in for Friend Circles. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261108)
MAXN, MAXQ = 100_000, 150_000
tests = []


def add(n, ops):
    assert any(t == 2 for t, _, _ in ops)
    tests.append(f"{n} {len(ops)}\n" + "\n".join(f"{t} {a} {b}" for t, a, b in ops) + "\n")


def mixed(n, q, p_union):
    ops = [(1 if rng.random() < p_union else 2, rng.randint(1, n), rng.randint(1, n)) for _ in range(q - 1)]
    return ops + [(2, rng.randint(1, n), rng.randint(1, n))]


add(5, [(2, 1, 2), (1, 1, 2), (1, 3, 4), (2, 1, 2), (2, 2, 3), (1, 2, 4)])  # example 1
add(3, [(1, 1, 2), (1, 2, 3), (2, 3, 1)])  # example 2
add(1, [(2, 1, 1)])  # a student is in their own circle
add(2, [(1, 1, 1), (2, 1, 2)])  # a self-friendship changes nothing
add(4, [(1, 1, 2), (1, 2, 1), (1, 3, 4), (2, 1, 4), (1, 1, 4), (2, 2, 3)])
for _ in range(6):  # small random, brute-checked
    n = rng.randint(1, 15)
    add(n, mixed(n, rng.randint(1, 40), 0.5))
n = MAXN
chain = [(1, i, i + 1) for i in range(1, n)]  # one long chain: punishes no compression
add(n, chain + [(2, 1, n)] * (MAXQ - len(chain)))
add(n, mixed(n, MAXQ, 0.5))
add(n, mixed(n, MAXQ, 0.9))
add(n, mixed(n, MAXQ, 0.1))
star = [(1, 1, i) for i in range(2, n + 1)]  # everyone joins student 1
add(n, star + [(2, rng.randint(1, n), rng.randint(1, n)) for _ in range(MAXQ - len(star))])
pairs = [(1, i, i + 1) for i in range(1, n, 2)]  # many circles of two
add(n, pairs + [(2, rng.randint(1, n), rng.randint(1, n)) for _ in range(MAXQ - len(pairs))])
add(n, [(2, rng.randint(1, n), rng.randint(1, n)) for _ in range(MAXQ)])  # questions only

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
