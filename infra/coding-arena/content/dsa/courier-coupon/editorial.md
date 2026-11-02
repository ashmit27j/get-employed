## Brute force

Try every road as the free one, run a shortest-path search each time, and take the best (including not using the coupon). That's m + 1 searches: about 10¹⁰ steps at the limits.

## Add the coupon to the state

The trouble is that "cheapest way to reach v" isn't enough information: a route that's slightly more expensive but still has its coupon might win later. So remember that too. Split every junction into two **states**:

- **(v, 0):** at v, coupon not used yet.
- **(v, 1):** at v, coupon already used.

Each road u–v with toll w gives these moves:

| from   | to     | cost |
| ------ | ------ | ---- |
| (v, 0) | (u, 0) | w    |
| (v, 0) | (u, 1) | 0    |
| (v, 1) | (u, 1) | w    |

All costs are non-negative, so **Dijkstra** on the 2n states finds the cheapest way to every state. The answer is min(dist(n, 0), dist(n, 1)).

## Dry run

Example 1: roads 1–2 (5), 2–4 (100), 1–3 (20), 3–4 (30).

| pop    | dist | pushes                              |
| ------ | ---- | ----------------------------------- |
| (1, 0) | 0    | (2,0)=5, (2,1)=0, (3,0)=20, (3,1)=0 |
| (2, 1) | 0    | (4,1)=100                           |
| (3, 1) | 0    | (4,1)=30                            |
| (2, 0) | 5    | (4,0)=105, (4,1)=5                  |
| (4, 1) | 5    | done                                |

Answer **5**.

## Pitfalls

- **Greedy coupon.** Running Dijkstra once and freeing the most expensive road on the shortest route is wrong: example 1's shortest route (cost 50) uses roads of 20 and 30, but freeing the 100 road on a different route gives 5.
- **Overflow.** A path of 10⁵ roads at 10⁶ each costs about 10¹¹. Use 64-bit distances.
- **Stale heap entries.** Skip a popped state when its distance is larger than the best known one; otherwise Dijkstra can degrade badly.

## Complexity

2n states and about 6m moves: O((n + m) log n) time with a binary heap, O(n + m) space.
