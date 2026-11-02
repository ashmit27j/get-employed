## Brute force: every subset

Try every subset of offers and check whether it can be scheduled. That's 2ⁿ subsets, so it only works for about a dozen offers. It's what the small tests check the fast solution against.

## When is a set of offers possible?

Accept the chosen offers in order of deadline, one per day. The k-th accepted offer goes out on day k, so the set works exactly when the k-th smallest deadline is at least k, for every k. Put another way: for every day d, **at most d** of the chosen offers can have a deadline of d or earlier.

## The greedy

Process offers sorted by deadline and keep the chosen stipends in a **min-heap**:

```text
for (deadline, stipend) in offers sorted by deadline:
    push stipend
    if heap size > deadline:
        pop the smallest stipend
answer = sum of the heap
```

After handling every offer with deadline ≤ d, the heap holds at most d offers, so the set stays possible. And whenever there are too many, dropping the smallest is the best possible fix: any valid choice has to give up at least one of them, and giving up the cheapest one loses the least.

## Dry run

Example 1, sorted: (1, 10), (1, 30), (2, 20), (2, 50).

| offer   | heap after push | size > deadline? | heap after |
| ------- | --------------- | ---------------- | ---------- |
| (1, 10) | [10]            | no               | [10]       |
| (1, 30) | [10, 30]        | 2 > 1, drop 10   | [30]       |
| (2, 20) | [20, 30]        | no               | [20, 30]   |
| (2, 50) | [20, 30, 50]    | 3 > 2, drop 20   | [30, 50]   |

Answer **80**.

## Pitfalls

- **Greedy by stipend alone.** Taking the richest offers first and placing each one as late as possible also works, but needs a "latest free day" structure (a DSU). Naively scanning for a free day is O(n · d).
- **Greedy by deadline alone.** Taking offers in deadline order without ever dropping one fails example 1.
- **Overflow.** The total reaches 10⁵ · 10⁹ = 10¹⁴.

## Complexity

Sorting plus one push and at most one pop per offer: O(n log n) time, O(n) space.
