#include <bits/stdc++.h>
using namespace std;

const int MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, x;
    cin >> n >> x;
    vector<int> coins(n);
    for (auto &v : coins) cin >> v;
    vector<int> ways(x + 1, 0);
    ways[0] = 1;
    for (int c : coins)
        for (int amount = c; amount <= x; amount++) {
            ways[amount] += ways[amount - c];
            if (ways[amount] >= MOD) ways[amount] -= MOD;
        }
    cout << ways[x] << "\n";
    return 0;
}
