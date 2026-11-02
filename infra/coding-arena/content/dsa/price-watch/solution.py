import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    p = list(map(int, data[1:1 + n]))
    stack = []  # days still waiting; their prices never increase from bottom to top
    total = 0
    for i, price in enumerate(p):
        while stack and p[stack[-1]] < price:
            total += i - stack.pop()
        stack.append(i)
    print(total)


main()
