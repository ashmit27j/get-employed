# Full table ways[i][x] over the first i vouchers (independent of the 1-D reference).
import sys

data = sys.stdin.read().split()
n, x = int(data[0]), int(data[1])
coins = list(map(int, data[2:2 + n]))
MOD = 10**9 + 7
prev = [1] + [0] * x
for c in coins:
    cur = prev[:]
    for amount in range(c, x + 1):
        cur[amount] = (prev[amount] + cur[amount - c]) % MOD
    prev = cur
print(prev[x])
