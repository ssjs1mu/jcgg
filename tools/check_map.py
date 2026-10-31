#!/usr/bin/env python3
"""Warn when a module is missing from the Manual 'How the books connect' map (LINKS in js/manual.js)."""
import re,glob
man=open("js/manual.js").read()
links=set(re.findall(r'^ ([a-z]+):\[',man.split("const LINKS={")[1].split("const SRC=")[0],re.M))
ids=set()
for f in glob.glob("js/*.js"):
    for m in re.finditer(r'(?<!if\(0\))J\.mod\(\{id:"([a-z0-9-]+)"',open(f).read()):ids.add(m.group(1))
skip={"home","manual","settings","jdash"}
miss=sorted(i for i in ids-links-skip)
print("Books map: "+("all modules mapped" if not miss else "NOT MAPPED -> "+", ".join(miss)+" (add to LINKS in js/manual.js)"))
