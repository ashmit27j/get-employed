import sys


def main():
    data = sys.stdin.read().split()
    q = int(data[0])
    out = []
    for i in range(q):
        l, r = int(data[1 + 2 * i]), int(data[2 + 2 * i])
        # Append the number of leap years in [l, r] to out.

    print("\n".join(out))


main()
