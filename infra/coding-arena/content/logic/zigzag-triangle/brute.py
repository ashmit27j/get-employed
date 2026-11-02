# Works out each row from the closed form for its first number, i(i - 1)/2 + 1.
n = int(input())
for i in range(1, n + 1):
    first = i * (i - 1) // 2 + 1
    row = [first + j for j in range(i)]
    print(" ".join(map(str, row if i % 2 else row[::-1])))
