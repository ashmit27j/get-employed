# Sorts the words and counts runs of equal words.
import sys

data = sys.stdin.read().split()
words = sorted(data[1:1 + int(data[0])])
best, best_count = None, 0
i = 0
while i < len(words):
    j = i
    while j < len(words) and words[j] == words[i]:
        j += 1
    if j - i > best_count:  # sorted order, so the first run with a count wins ties
        best, best_count = words[i], j - i
    i = j
print(best, best_count)
