#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<pair<int, long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    const long long INF = LLONG_MAX;
    // dist[v][k]: cheapest way to reach v, with k = 1 once the coupon is used.
    vector<array<long long, 2>> dist(n + 1, {INF, INF});
    using State = tuple<long long, int, int>;
    priority_queue<State, vector<State>, greater<State>> pq;
    dist[1][0] = 0;
    pq.push({0, 1, 0});
    while (!pq.empty()) {
        auto [d, v, k] = pq.top();
        pq.pop();
        if (d > dist[v][k]) continue;
        for (auto [u, w] : adj[v]) {
            if (d + w < dist[u][k]) {
                dist[u][k] = d + w;
                pq.push({d + w, u, k});
            }
            if (k == 0 && d < dist[u][1]) {
                dist[u][1] = d;
                pq.push({d, u, 1});
            }
        }
    }
    long long best = min(dist[n][0], dist[n][1]);
    cout << (best == INF ? -1 : best) << "\n";
    return 0;
}
