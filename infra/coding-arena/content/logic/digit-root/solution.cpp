#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    string out;
    while (q--) {
        string s;
        cin >> s;
        int n = 0;
        for (char ch : s) n += ch - '0';
        while (n >= 10) {
            int next = 0;
            for (; n > 0; n /= 10) next += n % 10;
            n = next;
        }
        out += char('0' + n);
        out += '\n';
    }
    cout << out;
    return 0;
}
