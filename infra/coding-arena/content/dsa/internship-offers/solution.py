import heapq
import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    offers = sorted((int(data[1 + 2 * i]), int(data[2 + 2 * i])) for i in range(n))
    chosen = []  # min-heap of accepted stipends
    for deadline, stipend in offers:
        heapq.heappush(chosen, stipend)
        if len(chosen) > deadline:
            heapq.heappop(chosen)  # too many for the days available: drop the smallest
    print(sum(chosen))


main()
