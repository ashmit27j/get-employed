#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<long long, long long>> offers(n);
    for (auto &[d, p] : offers) cin >> d >> p;
    sort(offers.begin(), offers.end());
    priority_queue<long long, vector<long long>, greater<long long>> chosen;
    long long total = 0;
    for (auto [d, p] : offers) {
        chosen.push(p);
        total += p;
        if ((long long)chosen.size() > d) {
            total -= chosen.top();
            chosen.pop();
        }
    }
    cout << total << "\n";
    return 0;
}
