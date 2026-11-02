import sys

MOD = 10**9 + 7


def main():
    data = sys.stdin.buffer.read().split()
    n, x = int(data[0]), int(data[1])
    c = list(map(int, data[2:2 + n]))

    # Print the number of ways to make x, modulo MOD.


main()
