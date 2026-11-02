#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    int start = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            int value = i % 2 ? start + j : start + i - 1 - j;
            cout << value << (j + 1 < i ? ' ' : '\n');
        }
        start += i;
    }
    return 0;
}
