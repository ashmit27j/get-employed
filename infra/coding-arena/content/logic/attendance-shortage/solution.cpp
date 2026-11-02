#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, t;
    cin >> n >> t;
    string out;
    for (long long i = 1; i <= n; i++) {
        long long a;
        cin >> a;
        if (100 * a < 75 * t) {
            if (!out.empty()) out += ' ';
            out += to_string(i);
        }
    }
    cout << (out.empty() ? "-1" : out) << "\n";
    return 0;
}
