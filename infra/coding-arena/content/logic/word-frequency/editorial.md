## Count with a hash map

Map every word to how many times it appears. One pass over the words fills the map.

```text
counts = empty map
for w in words: counts[w] += 1
```

## Pick the winner

Walk through the map and keep the best word so far. A word replaces the best when:

- its count is **higher**, or
- its count is **equal** and it comes **earlier** in dictionary order.

In Python, `min(counts, key=lambda w: (-counts[w], w))` does both comparisons at once: the minus sign puts higher counts first, and ties fall back to the word itself.

## Dry run

`placement intern offer intern placement ppo intern`

| word      | count |
| --------- | ----- |
| placement | 2     |
| intern    | 3     |
| offer     | 1     |
| ppo       | 1     |

The winner is **intern 3**.

## Pitfalls

- **Ties.** A hash map has no useful order, so you must compare words explicitly on a tie. Returning whichever word you met first is wrong.
- **Dictionary order.** `a` comes before `ab`, which comes before `b`. The built-in string comparison already does this.
- **Sorting everything.** Sorting all n words also works (count runs of equal words), at O(n log n). The map is O(n).

## Complexity

O(total length) expected time, O(distinct words) space.
