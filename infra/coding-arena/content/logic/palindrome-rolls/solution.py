import sys


def is_palindrome(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i].lower() != s[j].lower():
            return False
        i += 1
        j -= 1
    return True


def main():
    data = sys.stdin.read().split()
    t = int(data[0])
    print(sum(1 for s in data[1:1 + t] if is_palindrome(s)))


main()
