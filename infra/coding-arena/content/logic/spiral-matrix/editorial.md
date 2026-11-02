## Shrinking boundaries

Keep the rows and columns that haven't been visited as four boundaries: `top`, `bottom`, `left`, `right`. Each lap walks the outer ring and moves the boundaries inwards.

```text
while top <= bottom and left <= right:
    walk row top, left → right;          top += 1
    walk column right, top → bottom;      right -= 1
    if top <= bottom:
        walk row bottom, right → left;    bottom -= 1
    if left <= right:
        walk column left, bottom → top;   left += 1
```

The two `if` checks matter when the last part is a single row or a single column: without them, it gets walked twice, once forwards and once backwards.

## Dry run

```text
 1  2  3  4
 5  6  7  8
 9 10 11 12
```

| step            | seats   | boundaries after         |
| --------------- | ------- | ------------------------ |
| top row         | 1 2 3 4 | top = 1                  |
| right column    | 8 12    | right = 2                |
| bottom row      | 11 10 9 | bottom = 1               |
| left column     | 5       | left = 1                 |
| top row (lap 2) | 6 7     | top = 2, loop ends after |

## Pitfalls

- **Single row or column.** A 1 × 5 hall should print 1 2 3 4 5 once, not 1 2 3 4 5 4 3 2 1. The extra boundary checks handle it.
- **Mixing up rows and columns.** `g[row][col]`: walking a row changes the column index.
- **Building output.** 40,000 numbers: join them into one string instead of printing each one separately.

## Complexity

Every seat is visited once: O(R · C) time.
