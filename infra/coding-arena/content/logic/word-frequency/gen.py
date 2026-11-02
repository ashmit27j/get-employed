"""Writes <out>/N.in for Trending Word. Deterministic."""
import os
import random
import string
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261125)
MAXN = 200_000
tests = []


def add(words):
    tests.append(f"{len(words)}\n{' '.join(words)}\n")


def word(lo, hi, letters=string.ascii_lowercase):
    return "".join(rng.choice(letters) for _ in range(rng.randint(lo, hi)))


add("placement intern offer intern placement ppo intern".split())  # example 1
add("beta alpha beta alpha".split())  # example 2
add(["solo"])
add(["b", "a"])  # tie of ones: a
add(["ab", "a", "ab", "a", "abc"])  # a prefix sorts first
add(["z"] * 3 + ["y"] * 3 + ["x"] * 2)
for _ in range(6):
    add([word(1, 2, "abc") for _ in range(rng.randint(1, 40))])
vocab = [word(1, 10) for _ in range(1000)]
add([rng.choice(vocab) for _ in range(MAXN)])
add([word(10, 10) for _ in range(MAXN)])  # almost all distinct
add(["same"] * MAXN)
pairs = ["zebra", "apple"] * (MAXN // 2)
rng.shuffle(pairs)
add(pairs)  # an exact tie at the top
add([word(1, 3, "ab") for _ in range(MAXN)])
add([rng.choice(["offer", "offers", "offe", "offered"]) for _ in range(MAXN)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
