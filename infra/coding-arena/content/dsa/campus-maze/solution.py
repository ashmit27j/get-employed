import sys
from collections import deque


def main():
    data = sys.stdin.buffer.read().split()
    r, c = int(data[0]), int(data[1])
    cells = b"".join(data[2:2 + r])  # row-major, one byte per cell
    start = cells.index(b"S")
    goal = cells.index(b"E")
    dist = [-1] * (r * c)
    dist[start] = 0
    queue = deque([start])
    wall = ord("#")
    while queue:
        v = queue.popleft()
        if v == goal:
            break
        d = dist[v] + 1
        row, col = divmod(v, c)
        if row > 0 and cells[v - c] != wall and dist[v - c] < 0:
            dist[v - c] = d
            queue.append(v - c)
        if row < r - 1 and cells[v + c] != wall and dist[v + c] < 0:
            dist[v + c] = d
            queue.append(v + c)
        if col > 0 and cells[v - 1] != wall and dist[v - 1] < 0:
            dist[v - 1] = d
            queue.append(v - 1)
        if col < c - 1 and cells[v + 1] != wall and dist[v + 1] < 0:
            dist[v + 1] = d
            queue.append(v + 1)
    print(dist[goal])


main()
