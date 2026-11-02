import sys


def main():
    data = sys.stdin.read().split()
    q = int(data[0])
    out = []
    for token in data[1:1 + q]:
        n = sum(int(ch) for ch in token)
        while n >= 10:
            n = sum(int(ch) for ch in str(n))
        out.append(str(n))
    sys.stdout.write("\n".join(out) + "\n")


main()
