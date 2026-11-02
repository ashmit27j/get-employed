## Model the grid as a graph

Every open cell is a node, and two side-by-side open cells are joined by an edge. Every move costs 1, so the question is the length of the **shortest path** from S to E in an unweighted graph.

## Breadth-first search

BFS explores the graph in layers: first S, then every cell 1 move away, then every cell 2 moves away, and so on. The first time it reaches a cell, it has found the shortest distance to it.

```text
dist = -1 everywhere; dist[S] = 0
queue = [S]
while queue not empty:
    v = pop front
    for each open neighbour u of v with dist[u] == -1:
        dist[u] = dist[v] + 1
        push u
answer = dist[E]   # still -1 if E was never reached
```

## Dry run

Example 2:

```text
S . # .
. # . .
. . . E
```

| layer | cells reached (row, col) |
| ----- | ------------------------ |
| 0     | (0,0)                    |
| 1     | (0,1), (1,0)             |
| 2     | (2,0)                    |
| 3     | (2,1)                    |
| 4     | (2,2)                    |
| 5     | (1,2), (2,3) = E         |

E is in layer **5**.

## Pitfalls

- **Marking too late.** Set `dist[u]` when you push u. If you only mark cells when you pop them, a cell can be pushed by several neighbours and the queue grows far beyond R · C.
- **DFS isn't shortest.** A depth-first search finds _a_ path, not the shortest one.
- **Recursion.** An 800 × 800 maze can have a path of 320,000 cells. Keep BFS iterative with a queue.
- **Speed in Python.** Flatten the grid to one index per cell and use `collections.deque`; a 640,000-cell grid is fine that way.

## Complexity

Every cell is pushed and popped at most once, and has 4 neighbours: O(R · C) time and space.
