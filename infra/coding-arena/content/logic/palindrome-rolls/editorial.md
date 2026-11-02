## Two pointers

Put one pointer at the start of the string and one at the end. Compare the two characters (both in lower case), and move the pointers towards each other until they meet. If any pair differs, it isn't a palindrome.

```text
i = 0, j = len(s) - 1
while i < j:
    if lower(s[i]) != lower(s[j]): not a palindrome
    i += 1; j -= 1
palindrome
```

Odd lengths work without a special case: the middle character is never compared with anything.

## Dry run

`abcBA`: a/A match, b/B match, then i and j meet at c. It's a palindrome.

`CSE2025`: C and 5 differ straight away. Not a palindrome.

## Pitfalls

- **Case.** `abcBA` only counts once you compare in lower case.
- **Digits.** `tolower` leaves digits unchanged, so they need no special handling.
- **Shortcut in Python.** `s.lower() == s.lower()[::-1]` is a correct one-liner. It builds two extra strings, which is fine here, but know the pointer version too: interviewers often ask for O(1) extra space.

## Complexity

O(total length) time, O(1) extra space.
