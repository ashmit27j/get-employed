#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int r, c;
    cin >> r >> c;
    vector<vector<int>> grid(r, vector<int>(c));
    for (auto &row : grid)
        for (auto &x : row) cin >> x;

    // Print the roll numbers in clockwise spiral order.

    return 0;
}
