#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int r, c;
    cin >> r >> c;
    vector<vector<int>> g(r, vector<int>(c));
    for (auto &row : g)
        for (auto &x : row) cin >> x;
    int top = 0, bottom = r - 1, left = 0, right = c - 1;
    vector<int> order;
    order.reserve(r * c);
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) order.push_back(g[top][j]);
        top++;
        for (int i = top; i <= bottom; i++) order.push_back(g[i][right]);
        right--;
        if (top <= bottom) {
            for (int j = right; j >= left; j--) order.push_back(g[bottom][j]);
            bottom--;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; i--) order.push_back(g[i][left]);
            left++;
        }
    }
    string out;
    for (size_t k = 0; k < order.size(); k++) {
        if (k) out += ' ';
        out += to_string(order[k]);
    }
    cout << out << "\n";
    return 0;
}
