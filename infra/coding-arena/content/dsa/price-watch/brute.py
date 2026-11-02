import sys

data = sys.stdin.read().split()
n = int(data[0])
p = list(map(int, data[1:1 + n]))
total = 0
for i in range(n):
    for j in range(i + 1, n):
        if p[j] > p[i]:
            total += j - i
            break
print(total)
