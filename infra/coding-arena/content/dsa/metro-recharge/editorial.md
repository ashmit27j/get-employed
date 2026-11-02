## Brute force: add up each range

For every question, loop from l to r and add. Each question costs up to n steps, so the worst case is q · n = 2.5 · 10⁹ additions. That's far too slow, but it's a good checker for small inputs.

## The key observation

Store running totals once: **P[0] = 0** and **P[i] = P[i − 1] + aᵢ**. P[r] is the total of days 1..r, and P[l − 1] is the total of days 1..l − 1. Subtracting removes the days before l:

```text
total(l, r) = P[r] - P[l - 1]
```

Building P takes O(n), and every question is then a single subtraction.

## Dry run

a = [40, 0, 25, 60, 15] gives P = [0, 40, 40, 65, 125, 140].

| l   | r   | P[r] | P[l − 1] | total |
| --- | --- | ---- | -------- | ----- |
| 1   | 3   | 65   | 0        | 65    |
| 2   | 5   | 140  | 40       | 100   |
| 4   | 4   | 125  | 65       | 60    |

## Pitfalls

- **Overflow.** The totals reach 10¹⁴, so P must be 64-bit (`long long` in C++).
- **Slow output.** With 2.5 · 10⁴ answers, build the output in one string (or use `"\n".join` in Python) instead of printing line by line with flushing.
- **Off by one.** Using P[l] instead of P[l − 1] drops day l from every answer. Example 1's first question catches it.

## Complexity

O(n + q) time and O(n) extra space.
