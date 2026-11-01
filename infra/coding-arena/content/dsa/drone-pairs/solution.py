import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, k = int(data[0]), int(data[1])
    seen = {}
    answer = 0
    for tok in data[2:2 + n]:
        x = int(tok)
        answer += seen.get(k - x, 0)
        seen[x] = seen.get(x, 0) + 1
    print(answer)


main()
