"""Writes <out>/N.in for Commit Diff. Deterministic."""
import os
import random
import string
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261111)
M = 2000
tests = []


def add(a, b):
    tests.append(f"{a}\n{b}\n")


def word(n, letters):
    return "".join(rng.choice(letters) for _ in range(n))


add("abcbdab", "bdcaba")  # example 1
add("git", "hub")  # example 2
add("a", "a")
add("a", "b")
add("abc", "abc")  # identical
add("abc", "cba")  # reversed
add("aaaa", "aa")
for _ in range(6):  # small random, brute-checked
    add(word(rng.randint(1, 40), "abc"), word(rng.randint(1, 40), "abc"))
add("a" * M, "a" * M)  # answer = 2000
add(word(M, "ab"), word(M, "ab"))
add(word(M, string.ascii_lowercase), word(M, string.ascii_lowercase))
base = word(M, "abcdefgh")
edited = list(base)
for _ in range(200):  # a "commit": 200 random edits
    edited[rng.randrange(M)] = rng.choice("abcdefgh")
add(base, "".join(edited))
add("ab" * (M // 2), "ba" * (M // 2))
add(word(M, "xyz"), word(10, "xyz"))  # very different lengths
add("z" * M, word(M, "abcdefghijklmnopqrstuvwxy"))  # nothing in common

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
