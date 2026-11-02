import sys


def main():
    data = sys.stdin.buffer.read().split()
    r, c = int(data[0]), int(data[1])
    grid = [row.decode() for row in data[2:2 + r]]

    # Print the fewest moves from S to E, or -1.


main()
