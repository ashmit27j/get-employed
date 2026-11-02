import sys


def main():
    a, b = sys.stdin.read().split()
    # Bit-parallel LCS: bit i of v is 0 where a[i] closes a match. The editorial explains the
    # O(|A| · |B|) table this simulates, which is the solution to learn first.
    m = len(a)
    match = {}
    for i, ch in enumerate(a):
        match[ch] = match.get(ch, 0) | (1 << i)
    mask = (1 << m) - 1
    v = mask
    for ch in b:
        u = v & match.get(ch, 0)
        v = ((v + u) | (v - u)) & mask
    print(m - bin(v).count("1"))


main()
