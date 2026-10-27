/* Staff KOT payments are often made late and in lumps. Here the unpaid KOTs are ticked, matched with one payment (amount + date + how), and recorded.
   A match can also post the receipt in Accounts (Dr cash/bank/UPI, Cr the person's billing ledger). Matches are kept in meta/kotPay. */
(()=>{
const J=window.J,{S,esc,inr,r2,money0,fmtDate,today,monthLabel,fld,num,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const items=()=>arr(J.get("meta","kotPay")?.items);
const saveItems=async l=>{await J.store.put("meta",{id:"kotPay",items:l})};
const kots=()=>J.all("kots").filter(k=>k.kind==="staff").sort((a,b)=>a.date.localeCompare(b.date)||(a.at||0)-(b.at||0));
const paidMap=()=>{const m=new Map();for(const p of items())for(const id of arr(p.kots))m.set(id,p);return m};
J.skPaidChip=k=>{const p=paidMap().get(k.id);if(!p)return "";return `<div><span class="chip ok" title="${esc(p.note||"")}">Paid ${fmtDate(p.date)}</span></div>`};
const ledgerOf=k=>{if(J.foodViaHouse?.(k.date.slice(0,7)))return J.kotHouse().acc;return J.foodToClient?.(k.staff)||""};
const ui=()=>J.ui("skm",{sel:{},staff:"",from:"",show:"unpaid",date:today(),amt:"",acc:"",post:null,note:""});
function view(){const U=ui();const pm=paidMap();const all=kots();const staff=[...new Map(all.map(k=>[k.staff,k.staffName||J.get("accounts",k.staff)?.name||k.staff])).entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1])));
  let L=all.filter(k=>(!U.staff||k.staff===U.staff)&&(!U.from||k.date>=U.from)&&(U.show==="all"||(U.show==="paid")===pm.has(k.id)));
  const sel=all.filter(k=>U.sel[k.id]&&!pm.has(k.id));const tot=r2(sel.reduce((s,k)=>s+(+k.total||0),0));const amt=r2(+U.amt||0);const diff=r2(amt-tot);
  const boxes=J.accsOf(["cash","bank","aggregator"]).filter(a=>!a.mkj);if(!U.acc||!boxes.some(a=>a.id===U.acc))U.acc=(J.sysAcc("cash")||boxes[0])?.id||"";
  const needLed=sel.filter(k=>!ledgerOf(k));const canPost=sel.length>0&&!needLed.length;const post=U.post==null?(!J.kotHouse()):U.post;
  const who=[...new Set(sel.map(k=>k.staffName||k.staff))];
  return `<div class="filters">${fld("Person",`<select data-ui="skm.staff"><option value="">Everyone</option>${staff.map(([id,n])=>`<option value="${id}" ${U.staff===id?"selected":""}>${esc(n)}</option>`).join("")}</select>`)}${fld("From date",`<input type="date" data-ui="skm.from" value="${esc(U.from)}">`)}${fld("Show",`<select data-ui="skm.show"><option value="unpaid" ${U.show==="unpaid"?"selected":""}>Unpaid KOTs</option><option value="paid" ${U.show==="paid"?"selected":""}>Paid / matched</option><option value="all" ${U.show==="all"?"selected":""}>All</option></select>`)}<button class="btn" data-a="skmAll">Tick all shown unpaid</button><button class="btn" data-a="skmNone">Clear ticks</button></div>
  <section class="panel pb" style="position:sticky;top:0;z-index:2"><div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end"><div><div class="hint">Ticked</div><b>${sel.length} KOT${sel.length===1?"":"s"} · ${money0(tot)}</b>${who.length?`<div class="hint">${esc(who.slice(0,4).join(", "))}${who.length>4?"…":""}</div>`:""}</div>
   ${fld("Payment date",`<input type="date" data-ui="skm.date" value="${esc(U.date)}" max="${today()}">`)}${fld("Amount paid",`<input type="number" step="any" inputmode="decimal" data-ui="skm.amt" value="${esc(U.amt)}" placeholder="${tot||""}">`)}${fld("Received in",`<select data-ui="skm.acc">${boxes.map(a=>`<option value="${a.id}" ${a.id===U.acc?"selected":""}>${esc(a.name)}</option>`).join("")}</select>`)}
   <div><div class="hint">Match</div>${sel.length&&amt>0?(Math.abs(diff)<0.5?'<span class="chip ok">Matches exactly</span>':`<span class="chip warn">${diff>0?"Excess ":"Short "}${money0(Math.abs(diff))}</span>`):'<span class="muted">tick KOTs, enter amount</span>'}</div></div>
   <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" data-ui="skm.post" ${post?"checked":""}> Also post the receipt in Accounts (untick if this money is already recorded, e.g. in the Petpooja house bill or a bank entry)</label>
   ${post&&needLed.length?`<p class="hint" style="color:var(--bad);margin:4px 0 0">${esc([...new Set(needLed.map(k=>k.staffName))].join(", "))}: food is recovered from salary, so there is no ledger to receive a payment — untick the box to record the match only.</p>`:""}
   ${fld("Note"+(Math.abs(diff)>=0.5&&sel.length&&amt>0?" (required — explain the difference)":""),`<input data-ui="skm.note" value="${esc(U.note)}" placeholder="e.g. paid 3 weeks together by UPI on 12 Oct">`)}
   <button class="btn primary w" style="margin-top:6px" data-a="skmSave" ${sel.length&&amt>0&&!(post&&needLed.length)?"":"disabled"}>Match payment to ticked KOTs</button></section>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th></th><th>Date</th><th>KOT</th><th>Person</th><th>Items</th><th class="num">Amount</th><th>Payment</th></tr></thead><tbody>${L.slice(0,400).map(k=>{const p=pm.get(k.id);const ch=p&&arr(p.kots).length&&r2(+(p.amts||{})[k.id]||k.total)!==r2(+k.total)?'<span class="chip warn" title="KOT amount changed after it was matched">changed</span>':"";
   return `<tr><td>${p?"":`<input type="checkbox" data-ach="skmTick" data-x="${k.id}" ${U.sel[k.id]?"checked":""} aria-label="Tick ${esc(k.no)}">`}</td><td>${fmtDate(k.date)}</td><td class="mono">${esc(k.no)}</td><td>${esc(k.staffName||J.get("accounts",k.staff)?.name||"")}</td><td class="hint">${esc(arr(k.items).map(i=>i.name+" × "+i.qty).join(", "))}</td><td class="num">${inr.format(k.total)}</td><td>${p?`<span class="chip ok">Paid ${fmtDate(p.date)}</span> ${ch}<div class="hint">${esc(p.note||"")}</div>`:'<span class="chip warn">Unpaid</span>'}</td></tr>`}).join("")||'<tr><td colspan="7" class="muted">Nothing to show.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>Payments matched</h2><div class="tbl-wrap"><table><thead><tr><th>Paid on</th><th>Amount</th><th>KOTs</th><th>Person(s)</th><th>Difference</th><th>Note</th><th></th></tr></thead><tbody>${items().slice().reverse().map(p=>`<tr><td>${fmtDate(p.date)}<div class="hint">${esc((p.by||"").split("@")[0])}</div></td><td class="num">${inr.format(p.amt)}</td><td class="num">${arr(p.kots).length}<div class="hint">${esc(p.nos||"")}</div></td><td class="hint">${esc(p.who||"")}</td><td class="num">${Math.abs(p.diff||0)>=0.5?(p.diff>0?"+":"−")+inr.format(Math.abs(p.diff)):"—"}</td><td>${esc(p.note||"")}${p.vid&&J.get("vouchers",p.vid)?` <button class="linkbtn vno" data-a="editv" data-x="${p.vid}">${esc(J.get("vouchers",p.vid).no)}</button>`:'<div class="hint">match only</div>'}</td><td>${J.confirmBtn("skp:"+p.id,"Undo this match","skmUndo",p.id)}</td></tr>`).join("")||'<tr><td colspan="7" class="muted">No payments matched yet.</td></tr>'}</tbody></table></div></section>`}
J.skMatchView=view;
J.act("skmTick",el=>{const U=ui();U.sel[el.dataset.x]=el.checked;if(!el.checked)delete U.sel[el.dataset.x];J.render()});
J.act("skmNone",()=>{ui().sel={};J.render()});
J.act("skmAll",()=>{const U=ui();const pm=paidMap();for(const k of kots())if(!pm.has(k.id)&&(!U.staff||k.staff===U.staff)&&(!U.from||k.date>=U.from))U.sel[k.id]=true;J.render()});
J.act("skmSave",async()=>{if(J.readOnly?.())return;const U=ui();const pm=paidMap();const sel=kots().filter(k=>U.sel[k.id]&&!pm.has(k.id));const amt=r2(+U.amt||0);if(!sel.length||!(amt>0))return;
  const tot=r2(sel.reduce((s,k)=>s+(+k.total||0),0));const diff=r2(amt-tot);if(Math.abs(diff)>=0.5&&String(U.note||"").trim().length<5)return toast("Write a note explaining the difference");
  if(U.date>today())return toast("Payment date cannot be in the future");
  const post=U.post==null?(!J.kotHouse()):U.post;const id="skp-"+J.uid();let vid="";
  await J.safe(async()=>{
    if(post){const by={};for(const k of sel){const l=ledgerOf(k);if(!l)throw new Error("No ledger for "+k.staffName);by[l]=r2((by[l]||0)+(+k.total||0))}
      const keys=Object.keys(by);if(Math.abs(diff)>=0.005){const big=keys.sort((a,b)=>by[b]-by[a])[0];by[big]=r2(by[big]+diff)}
      const lines=[{a:U.acc,dr:amt,cr:0,n:"Staff food payment"},...Object.entries(by).filter(([,v])=>v>0).map(([a,v])=>({a,dr:0,cr:v,n:"Staff KOT food paid"}))];
      const v=await J.postVoucher({newId:id,type:"receipt",date:U.date,lines,narr:"Staff KOT food paid — "+sel.length+" KOTs ("+fmtDate(sel[0].date)+" – "+fmtDate(sel.at(-1).date)+")"+(U.note?" · "+U.note:""),ref:"SKP",src:{col:"kotPay",id,label:"Staff KOT payment"}});vid=v.id}
    const who=[...new Set(sel.map(k=>k.staffName||k.staff))].join(", ");
    await saveItems([...items(),{id,date:U.date,amt,total:tot,diff,note:(U.note||"").trim(),kots:sel.map(k=>k.id),amts:Object.fromEntries(sel.map(k=>[k.id,k.total])),nos:sel.slice(0,6).map(k=>k.no).join(", ")+(sel.length>6?"…":""),who,vid,by:S.me.email||"",at:Date.now()}]);
    J.ppLogAdd?.({kind:"other",date:U.date,note:(U.note||"").trim(),after:`Staff KOT payment ${money0(amt)} matched to ${sel.length} KOTs (${money0(tot)})${Math.abs(diff)>=0.5?" · difference "+money0(diff):""} · ${who}`});
  },"Payment matched");U.sel={};U.amt="";U.note="";J.render()});
J.act("skmUndo",async el=>{const p=items().find(x=>x.id===el.dataset.x);if(!p)return;await J.safe(async()=>{if(p.vid&&J.get("vouchers",p.vid)){const v=J.get("vouchers",p.vid);if(J.lock?.isFrozen(v))await J.lock.guard(v,"undo a staff food payment");await J.store.del("vouchers",p.vid)}
  await saveItems(items().filter(x=>x.id!==p.id));J.ppLogAdd?.({kind:"other",date:p.date,note:"Undone",after:"Staff KOT payment of "+money0(p.amt)+" match undone"})},"Match undone");S.confirm=null;J.render()});
})();
