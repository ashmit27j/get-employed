#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> x(n);
    for (auto &v : x) cin >> v;
    sort(x.begin(), x.end());
    auto fits = [&](long long d) {
        int placed = 1;
        long long last = x[0];
        for (int i = 1; i < n && placed < k; i++) {
            if (x[i] - last >= d) {
                placed++;
                last = x[i];
            }
        }
        return placed >= k;
    };
    long long lo = 1, hi = (x[n - 1] - x[0]) / (k - 1);
    while (lo < hi) {
        long long mid = (lo + hi + 1) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid - 1;
    }
    cout << lo << "\n";
    return 0;
}
