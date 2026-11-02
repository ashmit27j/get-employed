# The closed form 1 + (N - 1) mod 9, independent of the digit loop.
import sys

data = sys.stdin.read().split()
for token in data[1:1 + int(data[0])]:
    n = int(token)
    print(0 if n == 0 else 1 + (n - 1) % 9)
