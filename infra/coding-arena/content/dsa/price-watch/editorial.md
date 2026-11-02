## Brute force: look ahead from every day

For each day, scan forward until a strictly higher price appears. On a strictly falling sequence nobody is ever beaten, so every scan runs to the end: about n²/2 = 2 · 10¹⁰ steps for n = 2 · 10⁵. Too slow, but handy for testing.

## The key observation

Scan the days left to right and keep a list of the days that **haven't found a higher price yet**. Their prices never increase from the oldest to the newest: if an older day had a lower price than a newer one, the newer day would already have beaten it.

So the list is a stack. When day i arrives:

```text
while stack is not empty and price[top] < price[i]:
    total += i - top          # day top waited i - top days
    pop
push i
```

Days left on the stack at the end are never beaten and add 0.

Each day is pushed once and popped at most once, so the whole scan is O(n), even though there is a loop inside a loop.

## Dry run

p = [3, 1, 4, 1, 5, 9], days numbered from 0:

| day | price | popped (wait) | stack after | total |
| --- | ----- | ------------- | ----------- | ----- |
| 0   | 3     |               | [0]         | 0     |
| 1   | 1     |               | [0, 1]      | 0     |
| 2   | 4     | 1 (1), 0 (2)  | [2]         | 3     |
| 3   | 1     |               | [2, 3]      | 3     |
| 4   | 5     | 3 (1), 2 (2)  | [4]         | 6     |
| 5   | 9     | 4 (1)         | [5]         | 7     |

## Pitfalls

- **Strictly higher.** Equal prices don't end a wait. Popping on `<=` instead of `<` gets example 2 wrong.
- **Overflow.** A long falling run followed by a peak makes the total about n²/2, which needs 64 bits.
- **Pushing values instead of indices.** You need the day number to compute the wait, so push indices and look prices up.

## Complexity

O(n) time and O(n) space for the stack.
