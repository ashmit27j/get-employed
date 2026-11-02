#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> prefix(n + 1, 0);
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        prefix[i + 1] = prefix[i] + x;
    }
    string out;
    while (q--) {
        int l, r;
        cin >> l >> r;
        out += to_string(prefix[r] - prefix[l - 1]);
        out += '\n';
    }
    cout << out;
    return 0;
}
