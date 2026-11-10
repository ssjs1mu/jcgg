/* Review double entries: lists every group of entries with the same date, amount, party, reference, type and the same ledgers (same bank, same head),
   side by side, so the extra one can be ticked and deleted, or the group marked "not a duplicate" (remembered).
   The Books health check uses the same grouping (J.dupGroups). */
(()=>{
const J=window.J,{esc,toast,fmtDate}=J;const inr=x=>"₹"+Number(x).toLocaleString("en-IN",{maximumFractionDigits:2});
const SKIP=/^(ppsale|skh|skc|salm|bill-|aggc)/;
const ok=()=>new Set((J.get("meta","dupok")?.list)||[]);
J.dupGroups=(all)=>{const g={},okk=ok();for(const v of J.all("vouchers")){if(SKIP.test(v.id))continue;const amt=J.vAmount(v);if(!(amt>0))continue;(g[[v.date,amt,v.party||"",v.ref||"",v.type,(v.lines||[]).map(l=>l.a+(+l.dr?"d":"c")).sort().join(",")].join("~")]??=[]).push(v)}
  return Object.entries(g).filter(([k,a])=>a.length>1&&(all||!okk.has(k))).map(([k,a])=>({key:k,list:a.sort((x,y)=>String(x.no).localeCompare(String(y.no)))})).sort((a,b)=>a.list[0].date<b.list[0].date?-1:1)};
const nm=id=>J.get("accounts",id)?.name||"?";
const side=(v,k)=>[...new Set((v.lines||[]).filter(l=>+l[k]>0).map(l=>nm(l.a)))].join(", ");
const open=()=>{const gs=J.dupGroups();const linked=new Set(J.all("moves").map(m=>m.vid).filter(Boolean));
  const rows=gs.map((g,i)=>{const same=g.list.every(v=>(v.narr||"")===(g.list[0].narr||""));const amt=J.vAmount(g.list[0]);
    return `<tbody class="dup-g"><tr class="dup-h"><th colspan="7">${i+1}. ${fmtDate(g.list[0].date)} · ${esc(g.list[0].type)} · ${inr(amt)} · ${g.list.length} entries · <span class="chip ${same?"bad":"warn"}">${same?"same narration — likely duplicate":"narration differs — check"}</span> <button type="button" class="btn w" data-a="dupOk" data-x="${esc(g.key)}">Not a duplicate</button></th></tr>
    <tr class="dup-t"><td>Delete</td><td>Entry</td><td>Debit</td><td>Credit</td><td>Narration</td><td>Source</td><td>Status</td></tr>
    ${g.list.map((v,j)=>{const fr=J.lock?.isFrozen?.(v),ln=linked.has(v.id);return `<tr><td><input type="checkbox" class="dup-chk" value="${esc(v.id)}" ${j>0&&!ln?"checked":""} ${ln?"disabled":""}></td><td><b>${esc(v.no||"")}</b></td><td>${esc(side(v,"dr"))}</td><td>${esc(side(v,"cr"))}</td><td>${esc((v.narr||"").slice(0,70))}</td><td>${esc(v.src?.label||"")}</td><td>${ln?"linked to stock — delete in Inventory":fr?"matched / frozen":"free"}</td></tr>`}).join("")}</tbody>`}).join("");
  J.drawer({title:"Review double entries",wide:true,submit:gs.length?"Delete ticked entries":"Close",body:gs.length?`<p class="hint" style="margin-top:0">${gs.length} group(s). The first entry of each group is kept and the rest are ticked. Untick any that are real, or press <b>Not a duplicate</b> for the whole group (it is not shown again). Entries matched with a bank statement need Accounts → Freeze &amp; checks → Unlock first.</p><div style="overflow:auto"><table class="pj dup">${rows}</table></div>`:`<p class="hint">No look-alike entries. 🎉</p>`,
   onSubmit:async()=>{const ids=[...document.querySelectorAll(".dup-chk:checked")].map(x=>x.value);if(!gs.length)return;if(!ids.length)return "Tick the entries to delete.";
    const fr=ids.filter(id=>J.lock?.isFrozen?.(J.get("vouchers",id)));if(fr.length&&!J.lock?.open?.())return fr.length+" ticked entries are matched or frozen. Unlock first (Accounts → Freeze & checks), then press Delete again.";
    const whole=gs.filter(g=>g.list.every(v=>ids.includes(v.id)));if(whole.length&&J._dupAsk!==ids.join()){J._dupAsk=ids.join();return "Every entry in "+whole.length+" group(s) is ticked, so nothing would remain of them. Untick one in each, or press Delete again to remove them all."}
    J._dupAsk="";J.busy.start("Deleting "+ids.length+" entries",ids.length);let n=0;try{for(const id of ids){await J.deleteVoucher(id);n++;J.busy.tick?.()}}finally{J.busy.end()}
    toast(n+" entries deleted. Check Accounts → Freeze & checks to confirm.");J.afterDup?.()}})};
J.act("dupReview",open);
J.act("dupOk",async el=>{const k=el.dataset.x;const l=[...ok(),k];await J.store.put("meta",{id:"dupok",list:l});toast("Marked as not a duplicate");open()});
{const m=J.MODS.find(x=>x.id==="accounts");if(m){const old=m.headBtns;m.headBtns=()=>(old?old():"").replace('<button class="btn w" data-a="accMerge"','<button class="btn w" data-a="dupReview">Double entries</button><button class="btn w" data-a="accMerge"')}}
})();
