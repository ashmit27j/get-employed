import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, q = int(data[0]), int(data[1])
    a = list(map(int, data[2:2 + n]))
    pos = 2 + n
    out = []
    for _ in range(q):
        l, r = int(data[pos]), int(data[pos + 1])
        pos += 2
        # Append the total of days l..r to out.

    print("\n".join(out))


main()
