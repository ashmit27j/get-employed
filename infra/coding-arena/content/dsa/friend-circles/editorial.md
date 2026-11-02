## Brute force: search on every question

Keep the friendships as a graph and run a BFS or DFS from a for each question. That's O(n + q) per question, about 10¹⁰ steps in the worst case.

## Union-find

A **disjoint set union** (DSU) stores every circle as a tree, with one student as its root. Two students share a circle exactly when they have the same root.

```text
find(x):  follow parent links up to the root
union(a, b):
    ra = find(a), rb = find(b)
    if ra != rb: hang the smaller tree under the larger root
```

Two tricks keep the trees flat:

- **Union by size:** attach the smaller tree to the larger one, so a node's depth only grows when its tree at least doubles. Depth stays O(log n).
- **Path compression:** while walking up in `find`, point nodes closer to the root (path halving sets `parent[x] = parent[parent[x]]`).

With both, every operation costs O(α(n)), the inverse Ackermann function, which is at most 4 for any n you'll see.

## Dry run

Example 1, n = 5:

| line    | roots after                | answer |
| ------- | -------------------------- | ------ |
| `2 1 2` | 1, 2, 3, 4, 5 all separate | N      |
| `1 1 2` | {1, 2} root 1              |        |
| `1 3 4` | {3, 4} root 3              |        |
| `2 1 2` | same root 1                | Y      |
| `2 2 3` | roots 1 and 3              | N      |
| `1 2 4` | {1, 2, 3, 4} root 1        |        |

Output: **NYN**.

## Pitfalls

- **Recursive find.** A chain of 10⁵ students blows Python's recursion limit and can overflow the C++ stack before compression kicks in. Write `find` as a loop.
- **No compression and no union by size.** The chain test then makes every `find` walk 10⁵ links.
- **Printing per line.** The expected output is one string, not one answer per line.

## Complexity

O((n + q) · α(n)) time and O(n) space.
