import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, s = int(data[0]), int(data[1])
    a = list(map(int, data[2:2 + n]))

    # Print the length of the longest streak.


main()
