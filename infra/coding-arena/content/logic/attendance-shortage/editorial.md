## The idea

Go through the students in order and check each one against the 75% rule. Collect the ones who fall short and print them, or print -1 if there are none.

## Compare with integers

The tempting check is `a / T < 0.75`. Floating-point numbers can't represent every fraction exactly, so right at the boundary the division can round to the wrong side. Avoid division altogether by multiplying both sides by 100 · T:

```text
short  ⇔  a / T < 75 / 100  ⇔  100 · a < 75 · T
```

Both sides are whole numbers, so the comparison is exact.

## Dry run

T = 40, so 75 · T = 3000.

| student | a   | 100 · a | short? |
| ------- | --- | ------- | ------ |
| 1       | 30  | 3000    | no     |
| 2       | 29  | 2900    | yes    |
| 3       | 40  | 4000    | no     |
| 4       | 0   | 0       | yes    |

Output: `2 4`.

## Pitfalls

- **Exactly 75% is enough.** Use `<`, not `<=`.
- **Overflow.** 100 · aᵢ reaches 10¹¹, which doesn't fit in a 32-bit `int`. Use `long long` in C++.
- **Rounding 0.75 · T.** When T isn't a multiple of 4, 0.75 · T isn't a whole number. The integer form handles it with no special case.
- **Empty output.** Remember to print -1 when nobody is short.

## Complexity

O(n) time.
