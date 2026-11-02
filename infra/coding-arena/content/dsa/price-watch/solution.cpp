#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> p(n);
    for (auto &x : p) cin >> x;
    vector<int> st;  // days still waiting for a higher price
    st.reserve(n);
    long long total = 0;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && p[st.back()] < p[i]) {
            total += i - st.back();
            st.pop_back();
        }
        st.push_back(i);
    }
    cout << total << "\n";
    return 0;
}
