#!/usr/bin/env python3
"""Pre-release self-test (static): every script parses, every script in index.html exists, no action name is
defined twice, and every button action used on a screen (data-a / data-ach) has a handler (J.act).
Exit code 1 on an error, so tools/release.py can stop the release."""
import re, glob, os, subprocess, sys, collections
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
err, warn = [], []
files = sorted(glob.glob("js/*.js"))
for f in files:
    r = subprocess.run(["node", "--check", f], capture_output=True, text=True)
    if r.returncode: err.append(f"{f}: does not parse — {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
idx = open("index.html").read()
for src in re.findall(r'<script src="([^"?]+)', idx):
    if not src.startswith("http") and not os.path.exists(src): err.append(f"index.html loads {src}, which does not exist")
loaded = set(re.findall(r'<script src="(js/[^"?]+)', idx))
for f in files:
    if f not in loaded and "firebase-config" not in f and "recipe-lib" not in f: warn.append(f"{f} is not loaded by index.html")
defs = collections.defaultdict(list); used = collections.defaultdict(set)
for f in files:
    s = open(f).read()
    live = re.sub(r'if\(0\)J\.mod\(.*', '', s)
    for m in re.finditer(r'J\.act\("([A-Za-z0-9_]+)"', s): defs[m.group(1)].append(f)
    for m in re.finditer(r'data-a(?:ch)?=\\?"([A-Za-z0-9_]+)\\?"', s): used[m.group(1)].add(f)
    for m in re.finditer(r'J\.run\("([A-Za-z0-9_]+)"', s): used[m.group(1)].add(f)
for a, fs in defs.items():
    if len(fs) > 1: err.append(f'action "{a}" is defined {len(fs)} times ({", ".join(sorted(set(fs)))}) — the later one silently wins')
for a, fs in used.items():
    if a not in defs: err.append(f'button action "{a}" is used in {", ".join(sorted(fs))} but has no handler — the button does nothing')
for w in warn: print("note:", w)
for e in err: print("ERROR:", e)
print(f"Self-test: {len(files)} scripts, {len(defs)} actions, {len(err)} errors, {len(warn)} notes")
sys.exit(1 if err else 0)
