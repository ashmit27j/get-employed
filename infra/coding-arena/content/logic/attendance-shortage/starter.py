import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, t = int(data[0]), int(data[1])
    a = list(map(int, data[2:2 + n]))

    # Print the numbers of students below 75% attendance, or -1.


main()
