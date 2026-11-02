import sys

MOD = 10**9 + 7


def main():
    data = sys.stdin.buffer.read().split()
    n, x = int(data[0]), int(data[1])
    coins = list(map(int, data[2:2 + n]))
    ways = [0] * (x + 1)
    ways[0] = 1
    for c in coins:
        for amount in range(c, x + 1):
            ways[amount] = (ways[amount] + ways[amount - c]) % MOD
    print(ways[x])


main()
