import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    offers = [(int(data[1 + 2 * i]), int(data[2 + 2 * i])) for i in range(n)]  # (deadline, stipend)

    # Print the largest total stipend.


main()
