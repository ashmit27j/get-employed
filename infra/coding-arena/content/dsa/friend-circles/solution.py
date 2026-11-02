import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, q = int(data[0]), int(data[1])
    parent = list(range(n + 1))
    size = [1] * (n + 1)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    answer = []
    pos = 2
    for _ in range(q):
        t, a, b = data[pos], int(data[pos + 1]), int(data[pos + 2])
        pos += 3
        ra, rb = find(a), find(b)
        if t == b"1":
            if ra != rb:
                if size[ra] < size[rb]:
                    ra, rb = rb, ra
                parent[rb] = ra
                size[ra] += size[rb]
        else:
            answer.append("Y" if ra == rb else "N")
    print("".join(answer))


main()
