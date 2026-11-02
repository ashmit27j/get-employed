## Simulate it

Do exactly what the statement says: sum the digits, and repeat while the result has more than one digit.

```text
n = sum of the digits of N
while n >= 10:
    n = sum of the digits of n
print n
```

A 19-digit number has a digit sum of at most 171, then at most 9 + 9 = 18 for the next round (from 99), then a single digit. So the loop runs only a couple of times.

## Read the number as text

N can be as large as 10¹⁹ − 1, which is bigger than the largest signed 64-bit integer (about 9.2 · 10¹⁸). Reading it as a string avoids the problem completely, and the first round of the loop is just adding up its characters.

## Dry run

N = 9875: 9 + 8 + 7 + 5 = 29 → 2 + 9 = 11 → 1 + 1 = **2**.

## Going further: a formula

Any number leaves the same remainder as its digit sum when divided by 9 (because 10 leaves remainder 1). So the lucky digit is the single digit with N's remainder mod 9, which is **1 + (N − 1) mod 9** for N > 0, and 0 for N = 0. Nice to know, but the loop is what this problem practises.

## Pitfalls

- **Overflow.** `long long` can't hold 10¹⁹ − 1. Use a string or `unsigned long long`.
- **Zero.** The lucky digit of 0 is 0. The formula needs a special case for it; the loop doesn't.

## Complexity

O(total number of digits).
