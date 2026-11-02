## From buses to the LCM

Bus i leaves at minutes 0, pᵢ, 2pᵢ, …, so it leaves at minute t exactly when pᵢ divides t. All buses leave together when **every** period divides t. The smallest such t > 0 is the **least common multiple** of the periods.

## Computing the LCM

The LCM of two numbers comes from their GCD: **lcm(a, b) = a / gcd(a, b) · b**. For a list, fold it in one number at a time:

```text
answer = 1
for p in periods:
    answer = answer / gcd(answer, p) * p
```

The GCD comes from Euclid's algorithm, `gcd(a, b) = gcd(b, a mod b)`, which takes O(log) steps.

## Dry run

Periods 4, 6, 10:

| p   | gcd(answer, p) | answer after |
| --- | -------------- | ------------ |
| 4   | 1              | 4            |
| 6   | 2              | 12           |
| 10  | 2              | 60           |

## Pitfalls

- **Multiplying everything.** 4 · 6 · 10 = 240 is a time they all meet, but not the first.
- **Overflow.** The answer reaches lcm(21, …, 40) ≈ 5.3 · 10¹⁵. Use 64 bits, and divide by the GCD **before** multiplying so the intermediate value never exceeds the final answer by much.
- **Simulating minute by minute.** Stepping through 10¹⁵ minutes is far too slow.

## Complexity

O(n log P) per case, where P = 40.
