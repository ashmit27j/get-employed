def main():
    n = int(input())
    nxt = 1
    lines = []
    for i in range(1, n + 1):
        row = list(range(nxt, nxt + i))
        nxt += i
        if i % 2 == 0:
            row.reverse()
        lines.append(" ".join(map(str, row)))
    print("\n".join(lines))


main()
