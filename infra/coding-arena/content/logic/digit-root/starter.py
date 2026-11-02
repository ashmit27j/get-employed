import sys


def main():
    data = sys.stdin.read().split()
    q = int(data[0])
    out = []
    for token in data[1:1 + q]:
        # token is the number as text. Append its lucky digit to out.
        pass
    print("\n".join(out))


main()
