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
// ---- automatic matching ----
// 1) a day's unpaid KOT total == that day's free Google Pay collections;
// 2) a collection equals the clubbed total of consecutive unpaid KOT days ending on, or up to 3 days before, the collection date.
const gap=(a,b)=>J.daysBetween(a,b);
function windows(ud,c,maxGap){const out=[];for(let i=0;i<ud.length;i++){let s=0;for(let j=i;j<ud.length&&j<i+45;j++){s=r2(s+ud[j].tot);if(Math.abs(s-c.a)<=0.5){const e=ud[j].d;const g=gap(e,c.d);if(g>=0&&g<=maxGap)out.push({i,j,g});break}if(s>c.a+0.5)break}}return out.sort((a,b)=>a.g-b.g||(b.j-b.i)-(a.j-a.i))}
const mk=(gs,hit)=>({g:{d:gs.at(-1).d,days:gs.map(x=>x.d),ks:gs.flatMap(x=>x.ks),tot:r2(gs.reduce((s,x)=>s+x.tot,0))},hit,pay:hit.map(c=>c.d).sort().at(-1)});
function proposals(){const pm=paidMap();const skip=new Set(arr(doc().skip));const free=unusedColls();if(!free.length)return [];const ud=dayGroups(kots().filter(k=>!pm.has(k.id))).filter(g=>g.tot>0&&!skip.has(g.d));const takenD=new Set(),takenC=new Set(),out=[];
  for(const g of ud){const cs=free.filter(c=>c.d===g.d&&!takenC.has(c.k));if(!cs.length)continue;let hit=null;
    const one=cs.find(c=>Math.abs(c.a-g.tot)<=0.5);if(one)hit=[one];
    if(!hit&&cs.length<=12){const n=cs.length;for(let m=3;m<(1<<n)&&!hit;m++){let bits=0,sm=0;for(let i=0;i<n;i++)if(m>>i&1){bits++;sm+=cs[i].a}if(bits>1&&bits<=4&&Math.abs(sm-g.tot)<=0.5)hit=cs.filter((c,i)=>m>>i&1)}}
    if(hit){hit.forEach(c=>takenC.add(c.k));takenD.add(g.d);out.push(mk([g],hit))}}
  for(const c of free.slice().sort((a,b)=>a.d.localeCompare(b.d))){if(takenC.has(c.k))continue;const u2=ud.filter(g=>!takenD.has(g.d));const w=windows(u2,c,3)[0];if(!w)continue;const gs=u2.slice(w.i,w.j+1);gs.forEach(g=>takenD.add(g.d));takenC.add(c.k);out.push(mk(gs,[c]))}
  return out}
function suggestions(auto){const pm=paidMap();const skip=new Set(arr(doc().skip));const ud=dayGroups(kots().filter(k=>!pm.has(k.id))).filter(g=>g.tot>0&&!skip.has(g.d));const usedD=new Set(auto.flatMap(x=>x.g.days)),usedC=new Set(auto.flatMap(x=>x.hit.map(c=>c.k)));const u2=ud.filter(g=>!usedD.has(g.d));const out=[];
  for(const c of unusedColls().filter(c=>!usedC.has(c.k)).sort((a,b)=>b.d.localeCompare(a.d))){const w=windows(u2,c,14)[0];if(w){const gs=u2.slice(w.i,w.j+1);out.push({c,days:gs.map(x=>x.d),tot:r2(gs.reduce((s,x)=>s+x.tot,0))})}}
  return out}
let running=false,lastSig="";
async function autoMatch(){if(running||J.readOnly?.())return;const P=proposals().filter(x=>!frozenOn(x.pay)&&!x.g.days.some(frozenOn));if(!P.length)return;const sig=P.map(x=>x.pay+x.g.tot+x.g.days.length).join();if(sig===lastSig)return;lastSig=sig;running=true;
  try{const gp=gpAcc();let list=items().slice();
    for(const {g,hit,pay} of P){const id="skp-"+J.uid();let vid="";const lg=g.ks.map(k=>ledgerOf(k));const canPost=!!gp&&lg.every(Boolean);const amt=r2(hit.reduce((s,c)=>s+c.a,0));const span=g.days.length>1?fmtDate(g.days[0])+" – "+fmtDate(g.days.at(-1)):fmtDate(g.days[0]);
      if(canPost){const by={};g.ks.forEach((k,i)=>{by[lg[i]]=r2((by[lg[i]]||0)+(+k.total||0))});
        const v=await J.postVoucher({newId:id,type:"receipt",date:pay,lines:[{a:gp.id,dr:amt,cr:0,n:"Staff food paid by Google Pay"},...Object.entries(by).map(([a,x])=>({a,dr:0,cr:x,n:"Staff KOT food paid · "+span}))],narr:"Staff KOT food "+span+" paid by Google Pay (auto-matched, "+hit.length+" collection"+(hit.length>1?"s":"")+")",ref:"SKP",src:{col:"kotPay",id,label:"Staff KOT payment"}});vid=v.id}
      list.push({id,date:pay,amt,total:g.tot,diff:0,auto:true,gp:hit.map(c=>c.k),kots:g.ks.map(k=>k.id),days:g.days,amts:Object.fromEntries(g.ks.map(k=>[k.id,k.total])),nos:g.ks.slice(0,6).map(k=>k.no).join(", ")+(g.ks.length>6?"…":""),who:[...new Set(g.ks.map(k=>k.staffName||k.staff))].join(", "),
        note:"Auto-matched KOTs of "+span+" with Google Pay "+hit.map(c=>fmtDate(c.d)+" "+(c.t||"")+" "+(c.n||"")+" ₹"+c.a).join(" + ")+(canPost?"":" (match only — no ledger to post to)"),vid,by:"auto",at:Date.now()})}
    await saveDoc(list);J.ppLogAdd?.({kind:"other",note:"Auto-match",after:`${P.length} staff KOT payment${P.length>1?"s":""} auto-matched with Google Pay collections: ${P.map(x=>(x.g.days.length>1?fmtDate(x.g.days[0])+"–"+fmtDate(x.g.days.at(-1)):fmtDate(x.g.days[0]))+" "+money0(x.g.tot)).join("; ")}`});toast(P.length+" staff KOT payment"+(P.length>1?"s":"")+" matched with Google Pay")}
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
  const who=[...new Set(sel.map(k=>k.staffName||k.staff))];const allP=proposals();const pend=allP.filter(x=>!frozenOn(x.pay)&&!x.g.days.some(frozenOn));const sugg=suggestions(allP).slice(0,12);
  if(pend.length)setTimeout(autoMatch,250);
  const candHint=g=>{const cs=free.filter(c=>c.d===g.d);return cs.length?`<div class="hint">Google Pay that day, unmatched: ${cs.map(c=>"₹"+c.a).join(", ")}</div>`:""};
  return `${pend.length?`<p class="note">Matching ${pend.length} Google Pay collection${pend.length>1?"s":""} with KOT days…</p>`:""}
  <div class="filters">${fld("Person",`<select data-ui="skm.staff"><option value="">Everyone</option>${staff.map(([id,n])=>`<option value="${id}" ${U.staff===id?"selected":""}>${esc(n)}</option>`).join("")}</select>`)}${fld("From date",`<input type="date" data-ui="skm.from" value="${esc(U.from)}">`)}${fld("Show days",`<select data-ui="skm.show"><option value="unpaid" ${U.show==="unpaid"?"selected":""}>Unpaid</option><option value="paid" ${U.show==="paid"?"selected":""}>Paid / matched</option><option value="all" ${U.show==="all"?"selected":""}>All</option></select>`)}<button class="btn" data-a="skmAll">Tick all shown unpaid days</button><button class="btn" data-a="skmNone">Clear ticks</button></div>
  <section class="panel pb"><div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end"><div><div class="hint">Ticked</div><b>${new Set(sel.map(k=>k.date)).size} day${new Set(sel.map(k=>k.date)).size===1?"":"s"} · ${sel.length} KOT${sel.length===1?"":"s"} · ${money0(tot)}</b>${who.length?`<div class="hint">${esc(who.slice(0,4).join(", "))}${who.length>4?"…":""}</div>`:""}</div>
   ${fld("Payment date",`<input type="date" data-ui="skm.date" value="${esc(gsel.length?gsel.map(c=>c.d).sort().at(-1):U.date)}" ${gsel.length?"disabled":""} max="${today()}">`)}${fld("Amount paid",`<input type="number" step="any" inputmode="decimal" data-ui="skm.amt" value="${gsel.length?gsum:esc(U.amt)}" placeholder="${tot||""}" ${gsel.length?"disabled":""}>`)}${fld("Received in",`<select data-ui="skm.acc" ${gsel.length?"disabled":""}>${boxes.map(a=>`<option value="${a.id}" ${a.id===accSel?"selected":""}>${esc(a.name)}</option>`).join("")}</select>`)}
   <div><div class="hint">Match</div>${sel.length&&amt>0?(Math.abs(diff)<0.5?'<span class="chip ok">Matches exactly</span>':`<span class="chip warn">${diff>0?"Excess ":"Short "}${money0(Math.abs(diff))}</span>`):'<span class="muted">tick days, pick collections or enter amount</span>'}</div></div>
   <details style="margin-top:8px" ${gsel.length?"open":""}><summary><b>Google Pay collections not matched to any bill</b> (${free.length})${gsel.length?` · ticked ${gsel.length} = ${money0(gsum)}`:""}</summary><div class="tbl-wrap"><table><tbody>${free.slice().reverse().slice(0,80).map(c=>`<tr><td><input type="checkbox" data-ach="skmGp" data-x="${esc(c.k)}" ${U.gp[c.k]?"checked":""} aria-label="Tick collection"></td><td>${fmtDate(c.d)} ${esc(c.t||"")}</td><td>${esc(c.n||"")}</td><td class="num">${inr.format(c.a)}</td><td class="hint">${esc(c.note||"")}</td></tr>`).join("")||'<tr><td class="muted">None — upload the Google Pay file in Sales &amp; Cash → Google Pay &amp; UPI.</td></tr>'}</tbody></table></div></details>
   <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" data-ui="skm.post" ${post?"checked":""}> Also post the receipt in Accounts (untick if this money is already recorded, e.g. in a Petpooja house bill or a bank entry)</label>
   ${post&&needLed.length?`<p class="hint" style="color:var(--bad);margin:4px 0 0">${esc([...new Set(needLed.map(k=>k.staffName))].join(", "))}: food is recovered from salary, so there is no ledger to receive a payment — untick the box to record the match only.</p>`:""}
   ${fld("Note"+(Math.abs(diff)>=0.5&&sel.length&&amt>0?" (required — explain the difference)":""),`<input data-ui="skm.note" value="${esc(U.note)}" placeholder="e.g. paid 3 weeks together by UPI on 12 Oct">`)}
   <button class="btn primary w" style="margin-top:6px" data-a="skmSave" ${sel.length&&amt>0&&!(post&&needLed.length)?"":"disabled"}>Match payment to ticked days</button></section>
  ${sugg.length?`<section class="panel pb"><b>Suggestions</b><div class="hint">A collection that equals a run of unpaid KOT days, but not close enough to its date to match on its own:</div>${sugg.map(x=>`<div class="row" style="gap:8px;padding:3px 0;flex-wrap:wrap"><span>${fmtDate(x.c.d)} · ${esc(x.c.n||"")} · <b>${inr.format(x.c.a)}</b> = KOTs ${fmtDate(x.days[0])}${x.days.length>1?" – "+fmtDate(x.days.at(-1)):""}</span><button class="btn small" data-a="skmUse" data-x="${esc(x.c.k)}|${x.days[0]}|${x.days.at(-1)}">Tick these</button></div>`).join("")}</section>`:""}
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th></th><th>Date</th><th class="num">KOTs</th><th>People</th><th class="num">Day total</th><th>Payment</th></tr></thead><tbody>${groups.slice(0,200).map(g=>{const all2=g.un.length&&g.un.every(k=>U.sel[k.id]);
   return `<tr><td>${g.un.length?`<input type="checkbox" data-ach="skmDay" data-x="${g.d}" ${all2?"checked":""} aria-label="Tick ${fmtDate(g.d)}">`:""}</td><td><b>${fmtDate(g.d)}</b></td><td class="num">${g.ks.length}</td>
   <td class="hint"><details><summary>${esc([...new Set(g.ks.map(k=>k.staffName||k.staff))].slice(0,3).join(", "))}${new Set(g.ks.map(k=>k.staff)).size>3?"…":""}</summary>${g.ks.map(k=>`<div>${esc(k.no)} · ${esc(k.staffName||"")} · ${inr.format(k.total)} ${pm.has(k.id)?"✓":""}</div>`).join("")}</details></td>
   <td class="num"><b>${inr.format(g.tot)}</b>${g.un.length&&g.unTot!==g.tot?`<div class="hint">unpaid ${inr.format(g.unTot)}</div>`:""}</td>
   <td>${g.ps.map(p=>`<span class="chip ok">${p.auto?"Auto · ":""}Paid ${fmtDate(p.date)}</span>`).join(" ")}${g.un.length?`<span class="chip warn">Unpaid</span>${candHint(g)}`:""}</td></tr>`}).join("")||'<tr><td colspan="6" class="muted">Nothing to show.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>Payments matched</h2><div class="tbl-wrap"><table><thead><tr><th>Paid on</th><th>Amount</th><th>KOTs</th><th>Person(s)</th><th>Difference</th><th>Note</th><th></th></tr></thead><tbody>${items().slice().reverse().map(p=>`<tr><td>${fmtDate(p.date)}<div class="hint">${p.auto?"auto":esc((p.by||"").split("@")[0])}</div></td><td class="num">${inr.format(p.amt)}</td><td class="num">${arr(p.kots).length}<div class="hint">${esc(p.nos||"")}</div></td><td class="hint">${esc(p.who||"")}</td><td class="num">${Math.abs(p.diff||0)>=0.5?(p.diff>0?"+":"−")+inr.format(Math.abs(p.diff)):"—"}</td><td>${esc(p.note||"")}${p.vid&&J.get("vouchers",p.vid)?` <button class="linkbtn vno" data-a="editv" data-x="${p.vid}">${esc(J.get("vouchers",p.vid).no)}</button>`:'<div class="hint">match only</div>'}</td><td>${J.confirmBtn("skp:"+p.id,"Undo this match","skmUndo",p.id)}</td></tr>`).join("")||'<tr><td colspan="7" class="muted">No payments matched yet.</td></tr>'}</tbody></table></div></section>`}
J.skMatchView=view;
J.act("skmDay",el=>{const U=ui();const pm=paidMap();for(const k of kots())if(k.date===el.dataset.x&&!pm.has(k.id)&&(!U.staff||k.staff===U.staff)){if(el.checked)U.sel[k.id]=true;else delete U.sel[k.id]}J.render()});
J.act("skmUse",el=>{const [ck,a,b]=el.dataset.x.split("|");const U=ui();const pm=paidMap();U.sel={};U.gp={[ck]:true};for(const k of kots())if(k.date>=a&&k.date<=b&&!pm.has(k.id))U.sel[k.id]=true;J.render();window.scrollTo(0,0)});
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
  const skip=p.auto?[...new Set([...arr(doc().skip),...(p.days||[p.date])])]:arr(doc().skip);await saveDoc(items().filter(x=>x.id!==p.id),skip);lastSig="";J.ppLogAdd?.({kind:"other",date:p.date,note:"Undone",after:"Staff KOT payment of "+money0(p.amt)+" match undone"})},"Match undone");S.confirm=null;J.render()});
})();
