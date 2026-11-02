"""Writes <out>/N.in for Campus Maze. Deterministic."""
import os
import random
import sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = random.Random(20261107)
M = 800
tests = []


def add(rows):
    tests.append(f"{len(rows)} {len(rows[0])}\n" + "\n".join(rows) + "\n")


def place(grid, s, e):
    grid[s[0]][s[1]] = "S"
    grid[e[0]][e[1]] = "E"
    return ["".join(row) for row in grid]


def random_grid(r, c, wall_p):
    g = [["#" if rng.random() < wall_p else "." for _ in range(c)] for _ in range(r)]
    cells = rng.sample(range(r * c), 2)
    return place(g, divmod(cells[0], c), divmod(cells[1], c))


def serpentine(r, c):
    """Walls on every odd row with one gap, alternating sides: a single long path."""
    g = [["."] * c for _ in range(r)]
    for i in range(1, r, 2):
        for j in range(c):
            g[i][j] = "#"
        g[i][c - 1 if (i // 2) % 2 == 0 else 0] = "."
    return g


add(["S...#", ".##.#", "...#.", "#.#.E"])  # example 1
add(["S.#.", ".#..", "...E"])  # example 2
add(["SE"])  # adjacent
add(["S", "#", "E"])  # blocked column
add(["S#E"])  # blocked row
add(["E....", ".###.", ".#S#.", ".#.#.", "....."])  # S boxed in on three sides
for _ in range(6):  # small random, brute-checked
    add(random_grid(rng.randint(1, 9), rng.randint(2, 9), 0.3))
add(place([["."] * M for _ in range(M)], (0, 0), (M - 1, M - 1)))  # open field
add(place(serpentine(M, M), (0, 0), (M - 1, M - 1)))  # longest path
add(random_grid(M, M, 0.3))
add(random_grid(M, M, 0.45))  # near the percolation threshold
g = [["."] * M for _ in range(M)]
for j in range(M):
    g[M // 2][j] = "#"
add(place(g, (0, 0), (M - 1, M - 1)))  # a full wall: -1 after exploring half the grid
add(place([["."] * M], (0, 0), (0, M - 1)))  # one long row
add(place([["."] for _ in range(M)], (M - 1, 0), (0, 0)))  # one long column

for i, t in enumerate(tests, 1):
    with open(os.path.join(out, f"{i}.in"), "w", newline="\n") as f:
        f.write(t)
print(len(tests))
