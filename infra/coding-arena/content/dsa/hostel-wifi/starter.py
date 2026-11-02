import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, k = int(data[0]), int(data[1])
    x = list(map(int, data[2:2 + n]))

    # Print the largest possible minimum distance.


main()
