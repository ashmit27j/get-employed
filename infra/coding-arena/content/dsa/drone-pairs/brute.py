# O(n^2) oracle. build-content runs it on the small tests to cross-check the reference.
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
a = list(map(int, data[2:2 + n]))
print(sum(1 for i in range(n) for j in range(i + 1, n) if a[i] + a[j] == k))
