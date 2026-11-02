# Whole 400-year cycles hold 97 leap years; the rest is checked year by year.
import sys


def is_leap(y):
    return y % 400 == 0 or (y % 4 == 0 and y % 100 != 0)


data = sys.stdin.read().split()
q = int(data[0])
for i in range(q):
    l, r = int(data[1 + 2 * i]), int(data[2 + 2 * i])
    cycles = (r - l + 1) // 400
    count = cycles * 97
    for y in range(l + cycles * 400, r + 1):
        count += is_leap(y)
    print(count)
