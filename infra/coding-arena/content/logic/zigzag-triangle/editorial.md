## Keep a counter across rows

Row i holds i numbers, so before row i you've already written 1 + 2 + … + (i − 1) = i(i − 1)/2 numbers. Rather than computing that, keep a running `start` value and add i after each row.

```text
start = 1
for i in 1..n:
    row = start, start + 1, …, start + i - 1
    if i is even: reverse row
    print row
    start += i
```

## Dry run

n = 4:

| row | start | numbers  | printed  |
| --- | ----- | -------- | -------- |
| 1   | 1     | 1        | 1        |
| 2   | 2     | 2 3      | 3 2      |
| 3   | 4     | 4 5 6    | 4 5 6    |
| 4   | 7     | 7 8 9 10 | 10 9 8 7 |

## Pitfalls

- **Restarting the count.** The numbers continue from row to row; they don't restart at 1.
- **Reversing the wrong rows.** Row 1 goes left to right. If you count rows from 0, the parity flips.
- **Trailing spaces.** This judge compares the numbers, not the spacing, but a clean format is a good habit: print a space between numbers, not after the last one.

## Complexity

The triangle has n(n + 1)/2 numbers: O(n²) time, O(n) space for one row.
