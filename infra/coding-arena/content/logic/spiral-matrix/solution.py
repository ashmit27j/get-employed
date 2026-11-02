import sys


def main():
    data = sys.stdin.read().split()
    r, c = int(data[0]), int(data[1])
    g = [data[2 + i * c:2 + (i + 1) * c] for i in range(r)]
    top, bottom, left, right = 0, r - 1, 0, c - 1
    order = []
    while top <= bottom and left <= right:
        order.extend(g[top][j] for j in range(left, right + 1))
        top += 1
        order.extend(g[i][right] for i in range(top, bottom + 1))
        right -= 1
        if top <= bottom:
            order.extend(g[bottom][j] for j in range(right, left - 1, -1))
            bottom -= 1
        if left <= right:
            order.extend(g[i][left] for i in range(bottom, top - 1, -1))
            left += 1
    print(" ".join(order))


main()
