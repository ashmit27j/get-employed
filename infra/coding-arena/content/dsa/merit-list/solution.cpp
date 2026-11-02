#include <bits/stdc++.h>
using namespace std;

long long sortCount(vector<long long> &a, vector<long long> &buf, int lo, int hi) {
    if (hi - lo < 2) return 0;
    int mid = (lo + hi) / 2;
    long long count = sortCount(a, buf, lo, mid) + sortCount(a, buf, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[j] < a[i]) {
            count += mid - i;  // a[j] jumps over everything left in the left half
            buf[k++] = a[j++];
        } else {
            buf[k++] = a[i++];
        }
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    copy(buf.begin() + lo, buf.begin() + hi, a.begin() + lo);
    return count;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n), buf(n);
    for (auto &x : a) cin >> x;
    cout << sortCount(a, buf, 0, n) << "\n";
    return 0;
}
