import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, s = int(data[0]), int(data[1])
    a = list(map(int, data[2:2 + n]))
    left = 0
    window = 0
    best = 0
    for right in range(n):
        window += a[right]
        while window > s:
            window -= a[left]
            left += 1
        if right - left + 1 > best:
            best = right - left + 1
    print(best)


main()
