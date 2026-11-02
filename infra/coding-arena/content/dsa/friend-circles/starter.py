import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, q = int(data[0]), int(data[1])
    answer = []
    pos = 2
    for _ in range(q):
        t, a, b = int(data[pos]), int(data[pos + 1]), int(data[pos + 2])
        pos += 3
        # t == 1: a and b become friends. t == 2: append "Y" or "N" to answer.

    print("".join(answer))


main()
