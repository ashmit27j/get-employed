import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    p = list(map(int, data[1:1 + n]))

    # Print the sum of the waits.


main()
