#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    int count = 0;
    while (t--) {
        string s;
        cin >> s;
        bool ok = true;
        for (size_t i = 0, j = s.size() - 1; i < j; i++, j--) {
            if (tolower((unsigned char)s[i]) != tolower((unsigned char)s[j])) {
                ok = false;
                break;
            }
        }
        if (ok) count++;
    }
    cout << count << "\n";
    return 0;
}
