#include <bits/stdc++.h>
using namespace std;

long long leapsUpTo(long long y) { return y / 4 - y / 100 + y / 400; }

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    string out;
    while (q--) {
        long long l, r;
        cin >> l >> r;
        out += to_string(leapsUpTo(r) - leapsUpTo(l - 1));
        out += '\n';
    }
    cout << out;
    return 0;
}
