import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = list(map(int, data[1:1 + n]))
    rank = {v: i + 1 for i, v in enumerate(sorted(set(a)))}
    size = len(rank)
    tree = [0] * (size + 1)
    inversions = 0
    for x in reversed(a):  # count values already seen (to the right) that are smaller
        r = rank[x] - 1
        while r > 0:
            inversions += tree[r]
            r -= r & -r
        r = rank[x]
        while r <= size:
            tree[r] += 1
            r += r & -r
    print(inversions)


main()
