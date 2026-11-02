import sys

data = sys.stdin.read().split()
print(sum(1 for s in data[1:1 + int(data[0])] if s.lower() == s.lower()[::-1]))
