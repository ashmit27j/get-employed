## From swaps to inversions

Call a pair i < j an **inversion** when aᵢ > aⱼ. Swapping two neighbours changes the order of exactly one pair, so each swap removes at most one inversion. Bubble sort only swaps neighbours that form an inversion, so it removes exactly one each time. The answer is therefore the **number of inversions**.

Counting them pair by pair is O(n²): about 5 · 10⁹ checks for n = 10⁵. Too slow.

## Method 1: count while merge sorting

Sort each half recursively, then merge. When the next smallest element comes from the **right** half, it's smaller than every element still waiting in the left half, and all of those came before it in the original order. So it closes `mid − i` inversions at once.

```text
merge(left, right):
    while both have elements:
        if right[j] < left[i]: count += len(left) - i; take right[j]
        else: take left[i]
```

Use `<`, not `<=`, so equal scores don't count.

## Method 2: Fenwick tree

Compress the scores to ranks 1..k. Scan from right to left; for each aᵢ, ask a Fenwick tree how many already-seen values (all to the right of i) have a smaller rank, then add aᵢ to the tree. Both operations are O(log n).

## Dry run (merge sort)

a = [3, 1, 2, 5, 4]

| step                       | inversions added |
| -------------------------- | ---------------- |
| merge [3] and [1]          | 1 (1 jumps 3)    |
| merge [5] and [4]          | 1 (4 jumps 5)    |
| merge [2] and [4, 5]       | 0                |
| merge [1, 3] and [2, 4, 5] | 1 (2 jumps 3)    |

Total **3**.

## Pitfalls

- **Overflow.** A reversed list has n(n − 1)/2 ≈ 5 · 10⁹ inversions. Use 64 bits.
- **Ties.** Equal scores are already in order. Counting them (using `<=`) gets example 2 wrong.
- **Fenwick tree size.** Scores go up to 10⁹, so compress them first; a tree indexed by raw score would need 4 GB.

## Complexity

O(n log n) time and O(n) space with either method.
