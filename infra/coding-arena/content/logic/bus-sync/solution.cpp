#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        long long answer = 1;
        for (int i = 0; i < n; i++) {
            long long p;
            cin >> p;
            answer = answer / __gcd(answer, p) * p;
        }
        cout << answer << "\n";
    }
    return 0;
}
