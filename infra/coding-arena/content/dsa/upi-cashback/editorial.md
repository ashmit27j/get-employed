## Why the obvious recurrence overcounts

A first try is `ways[x] = sum of ways[x − c] over every value c`. That counts **ordered** sequences: 1 + 2 + 2, 2 + 1 + 2 and 2 + 2 + 1 all get counted separately. For example 1 it gives 9, not 4.

## Decide one value at a time

To count each combination once, fix the order of the values and decide them in that order: first how many vouchers of c₁, then of c₂, and so on. Let **ways[x]** be the number of ways to make x using only the values processed so far.

```text
ways = [1, 0, 0, …, 0]       # one way to make 0: use nothing
for c in values:
    for x in c..X (upwards):
        ways[x] += ways[x - c]
```

When x goes **upwards**, `ways[x − c]` already includes combinations that use c, so c can be used any number of times. That's the unbounded knapsack. Going downwards would allow each value at most once.

## Dry run

Values 1, 2, 5 and X = 5:

| after value | ways[0..5]           |
| ----------- | -------------------- |
| (start)     | 1, 0, 0, 0, 0, 0     |
| 1           | 1, 1, 1, 1, 1, 1     |
| 2           | 1, 1, 2, 2, 3, 3     |
| 5           | 1, 1, 2, 2, 3, **4** |

## Pitfalls

- **Loop order.** Values in the outer loop, amounts in the inner loop. Swapping them counts ordered sequences.
- **The modulo.** The counts grow exponentially. Reduce after every addition; in C++ two values below 10⁹ + 7 add up to less than 2³¹, so `int` is safe if you subtract MOD when needed.
- **Python speed.** Keep the inner loop simple: one list read, one add, one modulo.

## Complexity

O(n · X) time, about 2.5 · 10⁶ steps, and O(X) space.
