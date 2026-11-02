"""Writes <out>/N.in for Palindrome Roll Numbers. Deterministic."""
import os
import random
import string
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261122)
CHARS = string.ascii_letters + string.digits
tests = []


def add(rolls):
    tests.append(f"{len(rolls)}\n" + "\n".join(rolls) + "\n")


def mixed_case(s):
    return "".join(ch.upper() if rng.random() < 0.5 else ch.lower() for ch in s)


def palindrome(n):
    half = "".join(rng.choice(CHARS) for _ in range(n // 2))
    mid = rng.choice(CHARS) if n % 2 else ""
    return mixed_case(half + mid + half[::-1])


def roll(n):
    return palindrome(n) if rng.random() < 0.5 else "".join(rng.choice(CHARS) for _ in range(n))


add(["21CS1SC12", "abcBA", "x", "CSE2025"])  # example
add(["A"])
add(["Ab"])
add(["aA", "Aa", "AA", "aa"])
add(["12321", "1231", "0"])
add(["abcdba"])  # differs only in the middle pair
for _ in range(6):
    add([roll(rng.randint(1, 12)) for _ in range(rng.randint(1, 20))])
add([roll(200) for _ in range(10_000)])
add([palindrome(200) for _ in range(10_000)])
add([palindrome(199) for _ in range(10_000)])
add([palindrome(200)[:-1] + "Q" if rng.random() < 0.5 else palindrome(200) for _ in range(10_000)])
add([roll(rng.randint(1, 200)) for _ in range(10_000)])

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
