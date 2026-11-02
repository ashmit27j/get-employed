import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, q = int(data[0]), int(data[1])
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + int(data[2 + i])
    pos = 2 + n
    out = []
    for _ in range(q):
        l, r = int(data[pos]), int(data[pos + 1])
        pos += 2
        out.append(str(prefix[r] - prefix[l - 1]))
    sys.stdout.write("\n".join(out) + "\n")


main()
