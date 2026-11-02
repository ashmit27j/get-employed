import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    counts = {}
    for w in data[1:1 + n]:
        counts[w] = counts.get(w, 0) + 1
    best = min(counts, key=lambda w: (-counts[w], w))
    print(best, counts[best])


main()
