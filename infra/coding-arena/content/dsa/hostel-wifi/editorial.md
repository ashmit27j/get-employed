## Brute force: try every set of rooms

Choosing k rooms out of n and checking each choice is exponential. It only works for about a dozen rooms, which is exactly what the small tests use to check the fast solution.

## Step 1: answer a yes/no question instead

Fix a distance **d** and ask: can k routers be placed so that every two are at least d apart?

Sort the positions and place greedily: a router in the first room, then in the first room at least d past the last router, and so on. Taking the earliest room that's far enough is never worse, because it leaves the most space for the rooms after it. If the greedy reaches k routers, d is possible.

```text
fits(d):
    placed = 1, last = x[0]
    for pos in x (sorted):
        if pos - last >= d: placed += 1, last = pos
    return placed >= k
```

## Step 2: binary search for the largest d

If d is possible, every smaller distance is possible too (the same placement works). So the answers look like `yes yes yes … yes no no …`, and binary search finds the last yes in about 30 steps.

The answer is at least 1 (positions are distinct) and at most (max − min)/(k − 1), because k − 1 gaps have to fit between the two ends.

## Dry run

Sorted x = [1, 2, 4, 8, 9], k = 3.

| d   | greedy picks | fits? |
| --- | ------------ | ----- |
| 4   | 1, 8         | no    |
| 2   | 1, 4, 8      | yes   |
| 3   | 1, 4, 8      | yes   |

The search starts with lo = 1 and hi = 8 / 2 = 4, and settles on **3**.

## Pitfalls

- **Forgetting to sort.** The rooms come in any order. The greedy only works on sorted positions.
- **Off-by-one in the search.** Use `mid = (lo + hi + 1) / 2` when moving `lo = mid`, or the loop can get stuck on two values.
- **Overflow.** Positions reach 10⁹; keep sums like `lo + hi` in 64 bits if you use a larger upper bound.

## Complexity

O(n log n) to sort and O(n) per check, times about 30 checks: O(n log n + n log X).
