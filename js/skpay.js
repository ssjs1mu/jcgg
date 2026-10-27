/* Staff KOT payments are made late and in lumps. KOTs are grouped DAY-WISE (one clubbed total per date) and matched with Google Pay collections:
   • days whose total equals the UPI collections of that day that no Petpooja bill claimed are matched automatically (receipt posted to the Google Pay ledger);
   • everything else stays in the list for ticking — tick days (or KOTs) and club them against one payment, picking Google Pay collections or typing cash / bank.
   Matches live in meta/kotPay; collections used here are reserved in the Google Pay engine (gpay.js) so they no longer show as "no Petpooja bill". */
(()=>{
const J=window.J,{S,esc,inr,r2,money0,fmtDate,today,toast,fld}=J;
const arr=x=>Array.isArray(x)?x:[];
const doc=()=>J.get("meta","kotPay")||{id:"kotPay",items:[],skip:[]};
const items=()=>arr(doc().items);
const saveDoc=async(items,skip)=>{const d=doc();await J.store.put("meta",{id:"kotPay",items,skip:skip||arr(d.skip)})};
const kots=()=>J.all("kots").filter(k=>k.kind==="staff").sort((a,b)=>a.date.localeCompare(b.date)||(a.at||0)-(b.at||0));
const paidMap=()=>{const m=new Map();for(const p of items())for(const id of arr(p.kots))m.set(id,p);return m};
J.skPaidChip=k=>{const p=paidMap().get(k.id);return p?`<div><span class="chip ok" title="${esc(p.note||"")}">Paid ${fmtDate(p.date)}</span></div>`:""};
const ledgerOf=k=>{if(J.foodViaHouse?.(k.date.slice(0,7)))return J.kotHouse().acc;return J.foodToClient?.(k.staff)||""};
const gpAcc=()=>J.all("accounts").find(a=>a.kind==="aggregator"&&/google pay|gpay|upi settlement/i.test(a.name));
const ui=()=>J.ui("skm",{sel:{},gp:{},staff:"",from:"",show:"unpaid",date:today(),amt:"",acc:"",post:null,note:""});
const frozenOn=d=>{try{return !!(J.lock?.on?.()&&J.lock.isFrozen({date:d}))}catch(e){return false}};
// ---- day groups ----
const dayGroups=(list,pm)=>{const by=new Map();for(const k of list){let g=by.get(k.date);if(!g){g={d:k.date,ks:[],tot:0};by.set(k.date,g)}g.ks.push(k);g.tot=r2(g.tot+(+k.total||0))}return [...by.values()].sort((a,b)=>a.d.localeCompare(b.d))};
const unusedColls=()=>{try{return J.gpay.run().colls.filter(c=>!c.used)}catch(e){return []}};
// ---- automatic matching: a day's unpaid KOT total == that day's free Google Pay collections ----
function proposals(){const pm=paidMap();const skip=new Set(arr(doc().skip));const free=unusedColls();if(!free.length)return [];const taken=new Set();const out=[];
  for(const g of dayGroups(kots().filter(k=>!pm.has(k.id)))){if(skip.has(g.d)||g.tot<=0)continue;const cs=free.filter(c=>c.d===g.d&&!taken.has(c.k));if(!cs.length)continue;let hit=null;
    const one=cs.find(c=>Math.abs(c.a-g.tot)<=0.5);if(one)hit=[one];
    if(!hit&&cs.length<=12){const n=cs.length;for(let m=3;m<(1<<n)&&!hit;m++){let bits=0,s=0;for(let i=0;i<n;i++)if(m>>i&1){bits++;s+=cs[i].a}if(bits>1&&bits<=4&&Math.abs(s-g.tot)<=0.5)hit=cs.filter((c,i)=>m>>i&1)}}
    if(hit){hit.forEach(c=>taken.add(c.k));out.push({g,hit})}}
  return out}
let running=false,lastSig="";
async function autoMatch(){if(running||J.readOnly?.())return;const P=proposals().filter(x=>!frozenOn(x.g.d));if(!P.length)return;const sig=P.map(x=>x.g.d+x.g.tot).join();if(sig===lastSig)return;lastSig=sig;running=true;
  try{const gp=gpAcc();let list=items().slice();
    for(const {g,hit} of P){const id="skp-"+J.uid();let vid="";const lg=g.ks.map(k=>ledgerOf(k));const canPost=!!gp&&lg.every(Boolean);const amt=r2(hit.reduce((s,c)=>s+c.a,0));
      if(canPost){const by={};g.ks.forEach((k,i)=>{by[lg[i]]=r2((by[lg[i]]||0)+(+k.total||0))});
        const v=await J.postVoucher({newId:id,type:"receipt",date:g.d,lines:[{a:gp.id,dr:amt,cr:0,n:"Staff food paid by Google Pay"},...Object.entries(by).map(([a,x])=>({a,dr:0,cr:x,n:"Staff KOT food paid · "+fmtDate(g.d)}))],narr:"Staff KOT food "+fmtDate(g.d)+" paid by Google Pay (auto-matched, "+hit.length+" collection"+(hit.length>1?"s":"")+")",ref:"SKP",src:{col:"kotPay",id,label:"Staff KOT payment"}});vid=v.id}
      list.push({id,date:g.d,amt,total:g.tot,diff:0,auto:true,gp:hit.map(c=>c.k),kots:g.ks.map(k=>k.id),amts:Object.fromEntries(g.ks.map(k=>[k.id,k.total])),nos:g.ks.slice(0,6).map(k=>k.no).join(", ")+(g.ks.length>6?"…":""),who:[...new Set(g.ks.map(k=>k.staffName||k.staff))].join(", "),
        note:"Auto-matched with Google Pay "+hit.map(c=>(c.t||"")+" "+(c.n||"")+" ₹"+c.a).join(" + ")+(canPost?"":" (match only — no ledger to post to)"),vid,by:"auto",at:Date.now()})}
    await saveDoc(list);J.ppLogAdd?.({kind:"other",note:"Auto-match",after:`${P.length} day${P.length>1?"s":""} of staff KOT food matched with Google Pay collections: ${P.map(x=>fmtDate(x.g.d)+" "+money0(x.g.tot)).join(", ")}`});toast(P.length+" KOT day"+(P.length>1?"s":"")+" matched with Google Pay")}
  catch(e){console.warn("kot auto-match",e);toast("Auto-match stopped: "+(e.message||e))}finally{running=false;J.render()}}
// ---- view ----
function view(){const U=ui();const pm=paidMap();const all=kots();
  const staff=[...new Map(all.map(k=>[k.staff,k.staffName||J.get("accounts",k.staff)?.name||k.staff])).entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1])));
  const L=all.filter(k=>(!U.staff||k.staff===U.staff)&&(!U.from||k.date>=U.from));
  const groups=dayGroups(L).map(g=>{const un=g.ks.filter(k=>!pm.has(k.id));const ps=[...new Set(g.ks.filter(k=>pm.has(k.id)).map(k=>pm.get(k.id)))];return {...g,un,unTot:r2(un.reduce((s,k)=>s+(+k.total||0),0)),ps}}).filter(g=>U.show==="all"||(U.show==="unpaid"?g.un.length:!g.un.length));
  const sel=all.filter(k=>U.sel[k.id]&&!pm.has(k.id));const tot=r2(sel.reduce((s,k)=>s+(+k.total||0),0));
  const free=unusedColls();const gsel=free.filter(c=>U.gp[c.k]);const gsum=r2(gsel.reduce((s,c)=>s+c.a,0));
  const amt=gsel.length?gsum:r2(+U.amt||0);const diff=r2(amt-tot);
  const gp=gpAcc();const boxes=J.accsOf(["cash","bank","aggregator"]).filter(a=>!a.mkj);const accSel=gsel.length&&gp?gp.id:(U.acc&&boxes.some(a=>a.id===U.acc)?U.acc:(J.sysAcc("cash")||boxes[0])?.id||"");
  const needLed=sel.filter(k=>!ledgerOf(k));const post=U.post==null?(gsel.length>0||!J.kotHouse()):U.post;
  const who=[...new Set(sel.map(k=>k.staffName||k.staff))];const pend=proposals().filter(x=>!frozenOn(x.g.d));
  if(pend.length)setTimeout(autoMatch,250);
  const candHint=g=>{const cs=free.filter(c=>c.d===g.d);return cs.length?`<div class="hint">Google Pay that day, unmatched: ${cs.map(c=>"₹"+c.a).join(", ")}</div>`:""};
  return `${pend.length?`<p class="note">Matching ${pend.length} day${pend.length>1?"s":""} with Google Pay collections…</p>`:""}
  <div class="filters">${fld("Person",`<select data-ui="skm.staff"><option value="">Everyone</option>${staff.map(([id,n])=>`<option value="${id}" ${U.staff===id?"selected":""}>${esc(n)}</option>`).join("")}</select>`)}${fld("From date",`<input type="date" data-ui="skm.from" value="${esc(U.from)}">`)}${fld("Show days",`<select data-ui="skm.show"><option value="unpaid" ${U.show==="unpaid"?"selected":""}>Unpaid</option><option value="paid" ${U.show==="paid"?"selected":""}>Paid / matched</option><option value="all" ${U.show==="all"?"selected":""}>All</option></select>`)}<button class="btn" data-a="skmAll">Tick all shown unpaid days</button><button class="btn" data-a="skmNone">Clear ticks</button></div>
  <section class="panel pb"><div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end"><div><div class="hint">Ticked</div><b>${new Set(sel.map(k=>k.date)).size} day${new Set(sel.map(k=>k.date)).size===1?"":"s"} · ${sel.length} KOT${sel.length===1?"":"s"} · ${money0(tot)}</b>${who.length?`<div class="hint">${esc(who.slice(0,4).join(", "))}${who.length>4?"…":""}</div>`:""}</div>
   ${fld("Payment date",`<input type="date" data-ui="skm.date" value="${esc(gsel.length?gsel.map(c=>c.d).sort().at(-1):U.date)}" ${gsel.length?"disabled":""} max="${today()}">`)}${fld("Amount paid",`<input type="number" step="any" inputmode="decimal" data-ui="skm.amt" value="${gsel.length?gsum:esc(U.amt)}" placeholder="${tot||""}" ${gsel.length?"disabled":""}>`)}${fld("Received in",`<select data-ui="skm.acc" ${gsel.length?"disabled":""}>${boxes.map(a=>`<option value="${a.id}" ${a.id===accSel?"selected":""}>${esc(a.name)}</option>`).join("")}</select>`)}
   <div><div class="hint">Match</div>${sel.length&&amt>0?(Math.abs(diff)<0.5?'<span class="chip ok">Matches exactly</span>':`<span class="chip warn">${diff>0?"Excess ":"Short "}${money0(Math.abs(diff))}</span>`):'<span class="muted">tick days, pick collections or enter amount</span>'}</div></div>
   <details style="margin-top:8px" ${gsel.length?"open":""}><summary><b>Google Pay collections not matched to any bill</b> (${free.length})${gsel.length?` · ticked ${gsel.length} = ${money0(gsum)}`:""}</summary><div class="tbl-wrap"><table><tbody>${free.slice().reverse().slice(0,80).map(c=>`<tr><td><input type="checkbox" data-ach="skmGp" data-x="${esc(c.k)}" ${U.gp[c.k]?"checked":""} aria-label="Tick collection"></td><td>${fmtDate(c.d)} ${esc(c.t||"")}</td><td>${esc(c.n||"")}</td><td class="num">${inr.format(c.a)}</td><td class="hint">${esc(c.note||"")}</td></tr>`).join("")||'<tr><td class="muted">None — upload the Google Pay file in Sales &amp; Cash → Google Pay &amp; UPI.</td></tr>'}</tbody></table></div></details>
   <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" data-ui="skm.post" ${post?"checked":""}> Also post the receipt in Accounts (untick if this money is already recorded, e.g. in a Petpooja house bill or a bank entry)</label>
   ${post&&needLed.length?`<p class="hint" style="color:var(--bad);margin:4px 0 0">${esc([...new Set(needLed.map(k=>k.staffName))].join(", "))}: food is recovered from salary, so there is no ledger to receive a payment — untick the box to record the match only.</p>`:""}
   ${fld("Note"+(Math.abs(diff)>=0.5&&sel.length&&amt>0?" (required — explain the difference)":""),`<input data-ui="skm.note" value="${esc(U.note)}" placeholder="e.g. paid 3 weeks together by UPI on 12 Oct">`)}
   <button class="btn primary w" style="margin-top:6px" data-a="skmSave" ${sel.length&&amt>0&&!(post&&needLed.length)?"":"disabled"}>Match payment to ticked days</button></section>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th></th><th>Date</th><th class="num">KOTs</th><th>People</th><th class="num">Day total</th><th>Payment</th></tr></thead><tbody>${groups.slice(0,200).map(g=>{const all2=g.un.length&&g.un.every(k=>U.sel[k.id]);
   return `<tr><td>${g.un.length?`<input type="checkbox" data-ach="skmDay" data-x="${g.d}" ${all2?"checked":""} aria-label="Tick ${fmtDate(g.d)}">`:""}</td><td><b>${fmtDate(g.d)}</b></td><td class="num">${g.ks.length}</td>
   <td class="hint"><details><summary>${esc([...new Set(g.ks.map(k=>k.staffName||k.staff))].slice(0,3).join(", "))}${new Set(g.ks.map(k=>k.staff)).size>3?"…":""}</summary>${g.ks.map(k=>`<div>${esc(k.no)} · ${esc(k.staffName||"")} · ${inr.format(k.total)} ${pm.has(k.id)?"✓":""}</div>`).join("")}</details></td>
   <td class="num"><b>${inr.format(g.tot)}</b>${g.un.length&&g.unTot!==g.tot?`<div class="hint">unpaid ${inr.format(g.unTot)}</div>`:""}</td>
   <td>${g.ps.map(p=>`<span class="chip ok">${p.auto?"Auto · ":""}Paid ${fmtDate(p.date)}</span>`).join(" ")}${g.un.length?`<span class="chip warn">Unpaid</span>${candHint(g)}`:""}</td></tr>`}).join("")||'<tr><td colspan="6" class="muted">Nothing to show.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>Payments matched</h2><div class="tbl-wrap"><table><thead><tr><th>Paid on</th><th>Amount</th><th>KOTs</th><th>Person(s)</th><th>Difference</th><th>Note</th><th></th></tr></thead><tbody>${items().slice().reverse().map(p=>`<tr><td>${fmtDate(p.date)}<div class="hint">${p.auto?"auto":esc((p.by||"").split("@")[0])}</div></td><td class="num">${inr.format(p.amt)}</td><td class="num">${arr(p.kots).length}<div class="hint">${esc(p.nos||"")}</div></td><td class="hint">${esc(p.who||"")}</td><td class="num">${Math.abs(p.diff||0)>=0.5?(p.diff>0?"+":"−")+inr.format(Math.abs(p.diff)):"—"}</td><td>${esc(p.note||"")}${p.vid&&J.get("vouchers",p.vid)?` <button class="linkbtn vno" data-a="editv" data-x="${p.vid}">${esc(J.get("vouchers",p.vid).no)}</button>`:'<div class="hint">match only</div>'}</td><td>${J.confirmBtn("skp:"+p.id,"Undo this match","skmUndo",p.id)}</td></tr>`).join("")||'<tr><td colspan="7" class="muted">No payments matched yet.</td></tr>'}</tbody></table></div></section>`}
J.skMatchView=view;
J.act("skmDay",el=>{const U=ui();const pm=paidMap();for(const k of kots())if(k.date===el.dataset.x&&!pm.has(k.id)&&(!U.staff||k.staff===U.staff)){if(el.checked)U.sel[k.id]=true;else delete U.sel[k.id]}J.render()});
J.act("skmGp",el=>{const U=ui();if(el.checked)U.gp[el.dataset.x]=true;else delete U.gp[el.dataset.x];J.render()});
J.act("skmNone",()=>{const U=ui();U.sel={};U.gp={};J.render()});
J.act("skmAll",()=>{const U=ui();const pm=paidMap();for(const k of kots())if(!pm.has(k.id)&&(!U.staff||k.staff===U.staff)&&(!U.from||k.date>=U.from))U.sel[k.id]=true;J.render()});
J.act("skmSave",async()=>{if(J.readOnly?.())return;const U=ui();const pm=paidMap();const sel=kots().filter(k=>U.sel[k.id]&&!pm.has(k.id));
  const free=unusedColls();const gsel=free.filter(c=>U.gp[c.k]);const gp=gpAcc();const amt=gsel.length?r2(gsel.reduce((s,c)=>s+c.a,0)):r2(+U.amt||0);if(!sel.length||!(amt>0))return;
  const date=gsel.length?gsel.map(c=>c.d).sort().at(-1):U.date;const accId=gsel.length&&gp?gp.id:(U.acc||(J.sysAcc("cash")||{}).id);
  const tot=r2(sel.reduce((s,k)=>s+(+k.total||0),0));const diff=r2(amt-tot);if(Math.abs(diff)>=0.5&&String(U.note||"").trim().length<5)return toast("Write a note explaining the difference");
  if(date>today())return toast("Payment date cannot be in the future");
  const post=U.post==null?(gsel.length>0||!J.kotHouse()):U.post;const id="skp-"+J.uid();let vid="";
  await J.safe(async()=>{
    if(post){const by={};for(const k of sel){const l=ledgerOf(k);if(!l)throw new Error("No ledger for "+k.staffName);by[l]=r2((by[l]||0)+(+k.total||0))}
      const keys=Object.keys(by);if(Math.abs(diff)>=0.005){const big=keys.sort((a,b)=>by[b]-by[a])[0];by[big]=r2(by[big]+diff)}
      const v=await J.postVoucher({newId:id,type:"receipt",date,lines:[{a:accId,dr:amt,cr:0,n:"Staff food payment"},...Object.entries(by).filter(([,x])=>x>0).map(([a,x])=>({a,dr:0,cr:x,n:"Staff KOT food paid"}))],narr:"Staff KOT food paid — "+new Set(sel.map(k=>k.date)).size+" day(s), "+sel.length+" KOTs ("+fmtDate(sel[0].date)+" – "+fmtDate(sel.at(-1).date)+")"+(U.note?" · "+U.note:""),ref:"SKP",src:{col:"kotPay",id,label:"Staff KOT payment"}});vid=v.id}
    const who=[...new Set(sel.map(k=>k.staffName||k.staff))].join(", ");
    await saveDoc([...items(),{id,date,amt,total:tot,diff,gp:gsel.map(c=>c.k),note:(U.note||"").trim(),kots:sel.map(k=>k.id),amts:Object.fromEntries(sel.map(k=>[k.id,k.total])),nos:sel.slice(0,6).map(k=>k.no).join(", ")+(sel.length>6?"…":""),who,vid,by:S.me.email||"",at:Date.now()}]);
    J.ppLogAdd?.({kind:"other",date,note:(U.note||"").trim(),after:`Staff KOT payment ${money0(amt)} matched to ${new Set(sel.map(k=>k.date)).size} day(s) / ${sel.length} KOTs (${money0(tot)})${Math.abs(diff)>=0.5?" · difference "+money0(diff):""} · ${who}`});
  },"Payment matched");U.sel={};U.gp={};U.amt="";U.note="";J.render()});
J.act("skmUndo",async el=>{const p=items().find(x=>x.id===el.dataset.x);if(!p)return;await J.safe(async()=>{if(p.vid&&J.get("vouchers",p.vid)){const v=J.get("vouchers",p.vid);if(J.lock?.isFrozen(v))await J.lock.guard(v,"undo a staff food payment");await J.store.del("vouchers",p.vid)}
  const skip=p.auto?[...new Set([...arr(doc().skip),p.date])]:arr(doc().skip);await saveDoc(items().filter(x=>x.id!==p.id),skip);lastSig="";J.ppLogAdd?.({kind:"other",date:p.date,note:"Undone",after:"Staff KOT payment of "+money0(p.amt)+" match undone"})},"Match undone");S.confirm=null;J.render()});
})();
