## Brute force: check every pair

Two nested loops try every i < j and count the pairs that sum to K.

```text
count = 0
for i in 0..n-1:
    for j in i+1..n-1:
        if a[i] + a[j] == K: count += 1
```

That's n(n − 1)/2 checks, about **2 · 10¹⁰** for n = 2 · 10⁵. At roughly 10⁸ to 10⁹ simple operations per second, that's far beyond the 2-second limit. It's still worth writing first: it's obviously correct, so you can use it to test the fast version on small inputs.

## The key observation

For a fixed **j**, a partner **i < j** must weigh exactly **K − aⱼ**. So the number of pairs ending at j is just _how many earlier parcels weigh K − aⱼ_.

That turns the problem into: scan left to right, and keep a count of every weight seen so far.

```text
seen = empty map from weight to count
answer = 0
for x in a:
    answer += seen[K - x]     # partners that came earlier
    seen[x] += 1              # x can now partner later parcels
```

Looking up the partner **before** adding x matters: it stops a parcel from pairing with itself when 2x = K.

## Dry run

n = 5, K = 6, a = [1, 5, 3, 3, 7]

| x   | need K − x | seen before x      | answer |
| --- | ---------- | ------------------ | ------ |
| 1   | 5          | {}                 | 0      |
| 5   | 1          | {1: 1}             | 1      |
| 3   | 3          | {1: 1, 5: 1}       | 1      |
| 3   | 3          | {1: 1, 5: 1, 3: 1} | 2      |
| 7   | −1         | {1: 1, 5: 1, 3: 2} | 2      |

## Pitfalls

- **Overflow.** aᵢ + aⱼ reaches 2 · 10⁹ and K − x can reach 3 · 10⁹, so store weights and K in 64-bit integers. The answer reaches about 2 · 10¹⁰ when every weight is equal, which also needs 64 bits.
- **Hash collisions in C++.** `std::unordered_map` with the default hash can be forced into O(n²) behaviour by crafted inputs. A custom hash (splitmix64, as in the reference solution) or the sorting approach below avoids it.

## Alternative: sort, then two pointers

Sort the array and move two pointers inwards from both ends. When a[lo] + a[hi] = K, count the run of equal values on each side and multiply the run lengths; if both pointers sit in the same run of a value v with 2v = K, add c(c − 1)/2 for that run instead. This is **O(n log n)** with O(1) extra space and has no hashing worst case. In an interview, mention both and explain the trade-off.

## Complexity

O(n) expected time with a hash map, O(n) space.
