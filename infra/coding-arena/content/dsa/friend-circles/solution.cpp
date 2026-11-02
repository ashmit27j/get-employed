#include <bits/stdc++.h>
using namespace std;

vector<int> parent, sz;

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    parent.resize(n + 1);
    sz.assign(n + 1, 1);
    iota(parent.begin(), parent.end(), 0);
    string answer;
    while (q--) {
        int t, a, b;
        cin >> t >> a >> b;
        int ra = find(a), rb = find(b);
        if (t == 1) {
            if (ra == rb) continue;
            if (sz[ra] < sz[rb]) swap(ra, rb);
            parent[rb] = ra;
            sz[ra] += sz[rb];
        } else {
            answer += ra == rb ? 'Y' : 'N';
        }
    }
    cout << answer << "\n";
    return 0;
}
