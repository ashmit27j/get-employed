import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, k = int(data[0]), int(data[1])
    x = sorted(map(int, data[2:2 + n]))

    def fits(d):
        placed = 1
        last = x[0]
        for pos in x:
            if pos - last >= d:
                placed += 1
                last = pos
                if placed == k:
                    return True
        return False

    lo, hi = 1, (x[-1] - x[0]) // (k - 1)  # the answer is in [lo, hi]
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fits(mid):
            lo = mid
        else:
            hi = mid - 1
    print(lo)


main()
