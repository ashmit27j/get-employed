# Exact fractions instead of integer cross-multiplication.
import sys
from fractions import Fraction

data = sys.stdin.read().split()
n, t = int(data[0]), int(data[1])
short = [str(i + 1) for i in range(n) if Fraction(int(data[2 + i]), t) < Fraction(3, 4)]
print(" ".join(short) if short else -1)
