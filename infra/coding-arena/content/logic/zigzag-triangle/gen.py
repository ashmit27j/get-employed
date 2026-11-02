"""Writes <out>/N.in for Zigzag Triangle. Deterministic."""
import os
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
values = [4, 1, 2, 3, 5, 6, 7, 10, 11, 25, 50, 99, 100, 137, 150, 199, 200]
for i, n in enumerate(values, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(f"{n}\n")
print(len(values))
