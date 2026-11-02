#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int r, c;
    cin >> r >> c;
    vector<string> grid(r);
    for (auto &row : grid) cin >> row;
    int sr = 0, sc = 0, er = 0, ec = 0;
    for (int i = 0; i < r; i++)
        for (int j = 0; j < c; j++) {
            if (grid[i][j] == 'S') sr = i, sc = j;
            if (grid[i][j] == 'E') er = i, ec = j;
        }
    vector<int> dist(r * c, -1);
    vector<int> q;
    q.reserve(r * c);
    dist[sr * c + sc] = 0;
    q.push_back(sr * c + sc);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    for (size_t head = 0; head < q.size(); head++) {
        int v = q[head], vr = v / c, vc = v % c;
        for (int k = 0; k < 4; k++) {
            int nr = vr + dr[k], nc = vc + dc[k];
            if (nr < 0 || nr >= r || nc < 0 || nc >= c || grid[nr][nc] == '#') continue;
            int u = nr * c + nc;
            if (dist[u] >= 0) continue;
            dist[u] = dist[v] + 1;
            q.push_back(u);
        }
    }
    cout << dist[er * c + ec] << "\n";
    return 0;
}
