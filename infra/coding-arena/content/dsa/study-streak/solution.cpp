#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, s;
    cin >> n >> s;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long window = 0;
    int left = 0, best = 0;
    for (int right = 0; right < n; right++) {
        window += a[right];
        while (window > s) window -= a[left++];
        best = max(best, right - left + 1);
    }
    cout << best << "\n";
    return 0;
}
