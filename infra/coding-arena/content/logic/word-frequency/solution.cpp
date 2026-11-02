#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    unordered_map<string, int> counts;
    counts.reserve(n * 2);
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        counts[w]++;
    }
    string best;
    int bestCount = 0;
    for (auto &[w, c] : counts) {
        if (c > bestCount || (c == bestCount && w < best)) {
            best = w;
            bestCount = c;
        }
    }
    cout << best << " " << bestCount << "\n";
    return 0;
}
