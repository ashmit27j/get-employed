# Highest power of every prime, independent of the gcd fold.
import sys

data = sys.stdin.read().split()
t = int(data[0])
pos = 1
for _ in range(t):
    n = int(data[pos])
    best = {}
    for x in data[pos + 1:pos + 1 + n]:
        v = int(x)
        d = 2
        while d * d <= v:
            e = 0
            while v % d == 0:
                v //= d
                e += 1
            if e:
                best[d] = max(best.get(d, 0), e)
            d += 1
        if v > 1:
            best[v] = max(best.get(v, 0), 1)
    pos += 1 + n
    answer = 1
    for prime, e in best.items():
        answer *= prime**e
    print(answer)
