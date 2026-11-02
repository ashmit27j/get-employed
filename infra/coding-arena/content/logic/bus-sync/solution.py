import sys
from math import gcd


def main():
    data = sys.stdin.read().split()
    t = int(data[0])
    pos = 1
    out = []
    for _ in range(t):
        n = int(data[pos])
        answer = 1
        for x in data[pos + 1:pos + 1 + n]:
            p = int(x)
            answer = answer // gcd(answer, p) * p
        pos += 1 + n
        out.append(str(answer))
    sys.stdout.write("\n".join(out) + "\n")


main()
