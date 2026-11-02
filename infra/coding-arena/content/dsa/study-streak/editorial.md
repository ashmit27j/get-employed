## Brute force: every start, every end

For each starting day, extend to the right while the total stays within S. That's O(n²), about 2 · 10¹⁰ steps when everything fits. Fine as a checker, too slow for the limits.

## The key observation

Screen time is never negative. So if a window is already over budget, making it longer can't fix it, and if a window fits, every shorter window inside it fits too.

That's what makes a **sliding window** correct. Keep a window [left, right] and its total:

```text
left = 0, window = 0, best = 0
for right in 0..n-1:
    window += a[right]
    while window > S:
        window -= a[left]; left += 1
    best = max(best, right - left + 1)
```

For each right end, the loop finds the leftmost start that fits. Both pointers only move forward, so the total work is O(n).

## Dry run

a = [2, 5, 1, 3, 8, 2], S = 10.

| right | add | window after shrinking | left | length | best |
| ----- | --- | ---------------------- | ---- | ------ | ---- |
| 0     | 2   | 2                      | 0    | 1      | 1    |
| 1     | 5   | 7                      | 0    | 2      | 2    |
| 2     | 1   | 8                      | 0    | 3      | 3    |
| 3     | 3   | 11 → 9                 | 1    | 3      | 3    |
| 4     | 8   | 17 → 12 → 11 → 8       | 4    | 1      | 3    |
| 5     | 2   | 10                     | 4    | 2      | 3    |

## Pitfalls

- **Overflow.** The window total reaches 2 · 10¹⁴, and S itself can be 10¹⁵. Both need 64 bits.
- **Zero days.** With S = 0, days with 0 minutes still form streaks. Shrink only while the window is **over** S, not while it equals S.
- **Negative values would break this.** The trick relies on aᵢ ≥ 0. With negatives you'd need prefix sums and a different approach.

## Complexity

O(n) time, O(1) extra space.
