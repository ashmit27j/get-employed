import sys


def main():
    data = sys.stdin.read().split()
    r, c = int(data[0]), int(data[1])
    grid = [list(map(int, data[2 + i * c:2 + (i + 1) * c])) for i in range(r)]

    # Print the roll numbers in clockwise spiral order.


main()
