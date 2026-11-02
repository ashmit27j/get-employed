import sys


def leaps_up_to(y):
    return y // 4 - y // 100 + y // 400


def main():
    data = sys.stdin.read().split()
    q = int(data[0])
    out = []
    for i in range(q):
        l, r = int(data[1 + 2 * i]), int(data[2 + 2 * i])
        out.append(str(leaps_up_to(r) - leaps_up_to(l - 1)))
    sys.stdout.write("\n".join(out) + "\n")


main()
