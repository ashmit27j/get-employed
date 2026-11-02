# The full (|A| + 1) x (|B| + 1) table, independent of the bit-parallel reference.
import sys

a, b = sys.stdin.read().split()
table = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
for i in range(1, len(a) + 1):
    row, up = table[i], table[i - 1]
    ai = a[i - 1]
    for j in range(1, len(b) + 1):
        row[j] = up[j - 1] + 1 if ai == b[j - 1] else max(up[j], row[j - 1])
print(table[len(a)][len(b)])
