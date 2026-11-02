import sys


def main():
    data = sys.stdin.read().split()
    t = int(data[0])
    pos = 1
    out = []
    for _ in range(t):
        n = int(data[pos])
        p = list(map(int, data[pos + 1:pos + 1 + n]))
        pos += 1 + n
        # Append the first minute after 0 when all buses meet.

    print("\n".join(out))


main()
