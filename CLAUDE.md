# JCGG Suite — standing rules
- Live app check: after every release open https://ssjs1mu.github.io/jcgg/ in the pane and verify the change.
- **Books map (Manual → "How the books connect")**: whenever a module starts or stops posting vouchers (J.postVoucher), gets a new tab, or a new reconciliation / check is added, update `LINKS`, the graph data `GN` (boxes) and `GE` (links), and `SRC` for a new voucher `src.col`) in `js/manual.js` in the same commit. A module missing from `LINKS` shows a "Not mapped yet" warning in the app. The counts and the module list in that section are live; the wording is not.
- Release: bump the cache tag in index.html, `python3 tools/release.py "msg"`, commit with the Co-Authored-By and Claude-Session trailers, push, wait for the Pages run.
