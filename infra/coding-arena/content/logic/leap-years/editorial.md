## The rule for one year

```text
leap(y) = (y % 4 == 0 and y % 100 != 0) or y % 400 == 0
```

Looping over [L, R] with this check is correct, but a range can hold 10¹⁸ years. That would take decades.

## Count instead of looping

Let f(y) be the number of leap years from 1 to y. Among 1..y there are ⌊y/4⌋ multiples of 4. The multiples of 100 among them aren't leap years, so subtract ⌊y/100⌋. But the multiples of 400 were subtracted and should count, so add ⌊y/400⌋ back:

```text
f(y) = y / 4 - y / 100 + y / 400      (integer division)
answer(L, R) = f(R) - f(L - 1)
```

This add-and-subtract pattern is called **inclusion–exclusion**.

## Dry run

| y    | y/4 | y/100 | y/400 | f(y) |
| ---- | --- | ----- | ----- | ---- |
| 2004 | 501 | 20    | 5     | 486  |
| 1995 | 498 | 19    | 4     | 483  |

f(2004) − f(1995) = **3**: 1996, 2000 and 2004.

## Pitfalls

- **f(R) − f(L), not f(L − 1).** That misses year L when L itself is a leap year: (2000, 2000) would give 0.
- **Overflow.** 10¹⁸ fits in a signed 64-bit integer (up to about 9.2 · 10¹⁸), but not in 32 bits.
- **Floating point.** `y / 4.0` loses precision for numbers this large. Use integer division.

## Complexity

O(1) per question.
