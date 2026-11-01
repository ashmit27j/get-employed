#include <bits/stdc++.h>
using namespace std;

// splitmix64 keeps unordered_map fast even on inputs built to collide with std::hash.
struct SplitMix {
    size_t operator()(uint64_t x) const {
        static const uint64_t seed = chrono::steady_clock::now().time_since_epoch().count();
        x += seed + 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, k;
    cin >> n >> k;
    unordered_map<long long, long long, SplitMix> seen;
    seen.reserve(n * 2);
    long long answer = 0;
    for (long long i = 0; i < n; i++) {
        long long x;
        cin >> x;
        auto it = seen.find(k - x);
        if (it != seen.end()) answer += it->second;
        seen[x]++;
    }
    cout << answer << "\n";
    return 0;
}
