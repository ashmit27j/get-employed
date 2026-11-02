## Brute force

Trying every subsequence of A and checking it against B is exponential. Plain recursion on "skip a character of A or of B" is exponential too, until you notice it keeps solving the same (i, j) pairs.

## The recurrence

Let **L[i][j]** be the LCS length of the first i characters of A and the first j characters of B.

- If either prefix is empty, L = 0.
- If A[i] = B[j] (the last characters match), an optimal answer can use that match: **L[i][j] = L[i − 1][j − 1] + 1**.
- Otherwise at least one of the two last characters isn't used: **L[i][j] = max(L[i − 1][j], L[i][j − 1])**.

```text
for i in 1..|A|:
    for j in 1..|B|:
        if A[i-1] == B[j-1]: cur[j] = prev[j-1] + 1
        else:               cur[j] = max(prev[j], cur[j-1])
    prev, cur = cur, prev
```

Row i only reads row i − 1, so two rows are enough: O(|B|) memory instead of 4 million cells.

## Dry run

A = "abcb", B = "bcb" (a shorter version of example 1):

|     | ""  | b   | c   | b     |
| --- | --- | --- | --- | ----- |
| ""  | 0   | 0   | 0   | 0     |
| a   | 0   | 0   | 0   | 0     |
| b   | 0   | 1   | 1   | 1     |
| c   | 0   | 1   | 2   | 2     |
| b   | 0   | 1   | 2   | **3** |

## Going further

The Python reference uses a **bit-parallel** version of the same table: each row is stored as the bits of one big integer and updated with a few additions and bitwise operations, so a row costs about |A|/64 machine operations. It's a nice trick to know about, but the two-row table is what interviewers expect, and it passes here in both languages.

## Pitfalls

- **Subsequence, not substring.** The matched characters don't have to be next to each other. Resetting to 0 on a mismatch solves the longest common _substring_ instead.
- **Memory.** A full 2001 × 2001 table of `int` is 16 MB, which fits, but two rows are simpler and faster.
- **Python speed.** About 4 · 10⁶ cells. Keep the inner loop to plain list reads and one comparison.

## Complexity

O(|A| · |B|) time and O(|B|) space.
