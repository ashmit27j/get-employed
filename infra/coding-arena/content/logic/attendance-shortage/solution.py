import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, t = int(data[0]), int(data[1])
    short = [str(i + 1) for i in range(n) if 100 * int(data[2 + i]) < 75 * t]
    print(" ".join(short) if short else -1)


main()
