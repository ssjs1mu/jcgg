/* MKJ — the owner's personal side, visible to Super Admin only.
   Personal marks (inventory lines, fixed assets, ledgers ticked "Personal (MKJ) account") live here, away from JCGG's books.
   Business spends made on a personal card / wallet / bank a/c are a payable to MKJ; each is settled one of three ways:
   (1) paid back to the personal a/c from cash or a business bank, (2) added to capital infusion, (3) set off against personal purchases the business paid for. */
(()=>{
const J=window.J,{esc,fmtDate,today,r2,inr,money0,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const mk=()=>J.all("accounts").filter(a=>a.mkj&&a.active!==false);
const holdAcc=()=>J.all("accounts").find(a=>a.sys==="persbuy");
const capAccs=()=>J.all("accounts").filter(a=>a.kind==="capital"&&a.sys!=="persbuy"&&a.active!==false);
const isSet=v=>v.src?.col==="mkjset";
// spends = credits on the instrument that are not personal purchases and not settlements; settled = debits tagged as settlements
function info(a){const hold=holdAcc();const posts=J.D.post?.get(a.id)||[];
  const sp=posts.filter(p=>p.cr>0&&!isSet(p.v)&&!(hold&&p.v.lines.some(l=>l.a===hold.id))).map(p=>({p,amt:r2(p.cr),left:r2(p.cr)}));
  const settled=r2(posts.filter(p=>p.dr>0&&isSet(p.v)).reduce((s,p)=>s+p.dr,0));
  let rest=settled;for(const s of sp){const t=Math.min(s.left,rest);s.left=r2(s.left-t);rest=r2(rest-t)}
  const total=r2(sp.reduce((s,x)=>s+x.amt,0));return {a,sp,total,settled,open:r2(total-settled),extra:rest>0.004?rest:0}}
const chip=s=>s.left<0.005?'<span class="chip ok">Settled</span>':s.left<s.amt-0.005?`<span class="chip warn">Part · ${money0(s.left)} due</span>`:'<span class="chip bad">Open</span>';
const accName=id=>J.get("accounts",id)?.name||"(deleted ledger)";
const frozen=d=>J.lock?.on?.()&&J.lock.isFrozen({date:d});

function vOver(){const L=mk();const hold=holdAcc();const caps=capAccs();const I=L.map(info);const open=r2(I.reduce((s,x)=>s+x.open,0));
  const holdBal=hold?J.balanceOf(hold.id):0;
  return `<div class="kpis">${J.kpi("Business spends to settle",money0(open),I.length+" personal instruments","mkjacc/settle")}${J.kpi("Personal buys paid by business",money0(holdBal),"owner owes the business","mkjinv/purch")}${J.kpi("Capital infused",money0(-caps.reduce((s,a)=>s+J.balanceOf(a.id),0)),caps.length+" capital ledgers","accounts/ledger")}</div>
  <section class="panel"><h2>Personal instruments</h2><div class="pb">${L.length?"":'<p class="hint">Nothing is marked yet. Open Accounts → Ledgers, edit a credit card, wallet or personal bank a/c and tick <b>Personal (MKJ) account</b>. Business spends on it will then appear here to settle.</p>'}</div>
  ${L.length?`<div class="tbl-wrap"><table><thead><tr><th>Instrument</th><th>Type</th><th class="num">Balance</th><th class="num">Business spends</th><th class="num">Settled</th><th class="num">To settle</th></tr></thead><tbody>${I.map(x=>`<tr><td>${esc(x.a.name)}</td><td>${esc(x.a.kind)}</td><td class="num">${inr.format(J.balanceOf(x.a.id))}</td><td class="num">${inr.format(x.total)}</td><td class="num">${inr.format(x.settled)}</td><td class="num"><b>${inr.format(x.open)}</b></td></tr>`).join("")}</tbody></table></div>`:""}</section>
  <section class="panel"><div class="pb"><p class="hint" style="margin:0">JCGG’s books stay balanced: the personal instrument is an ordinary ledger there, and every settlement is a normal entry. Here you see which business spends are still owed to MKJ and how each was cleared.</p></div></section>`}

function vSettle(){const L=mk();const u=J.ui("mkj",{sel:"",how:"cash",box:""});if(!L.length)return `<section class="panel"><div class="pb"><p class="hint">Tick <b>Personal (MKJ) account</b> on a card, wallet or bank ledger first (Accounts → Ledgers).</p></div></section>`;
  if(!u.sel||!L.some(a=>a.id===u.sel))u.sel=L[0].id;const x=info(J.get("accounts",u.sel));
  const boxes=J.accsOf(["cash","bank"]).filter(a=>!a.mkj);const caps=capAccs();const hold=holdAcc();
  const sel=`<select id="mk-sel" data-a="mkjPick">${L.map(a=>`<option value="${a.id}" ${a.id===u.sel?"selected":""}>${esc(a.name)}</option>`).join("")}</select>`;
  return `<section class="panel"><div class="row" style="padding:10px 12px;gap:10px;flex-wrap:wrap"><b>Instrument</b>${sel}<span class="chip ${x.open>0.005?"bad":"ok"}">${x.open>0.005?money0(x.open)+" to settle":"All settled"}</span></div>
  <div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Entry</th><th>Against</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>${x.sp.slice().reverse().slice(0,120).map(s=>`<tr><td>${fmtDate(s.p.date)}</td><td>${esc(s.p.v.no)}<div class="muted">${esc(s.p.v.narr||"")}</div></td><td>${esc(s.p.v.lines.filter(l=>l.a!==x.a.id).map(l=>accName(l.a)).join(", "))}</td><td class="num">${inr.format(s.amt)}</td><td>${chip(s)}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">No business spends on this instrument.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>Settle</h2><div class="pb form">
   <label>How<select id="mk-how" data-a="mkjHow"><option value="cash" ${u.how==="cash"?"selected":""}>Pay back to the personal a/c (cash / online)</option><option value="cap" ${u.how==="cap"?"selected":""}>Add to capital infusion</option><option value="hold" ${u.how==="hold"?"selected":""}>Set off against personal purchases paid by business</option></select></label>
   <label>Amount<input id="mk-amt" type="number" step="0.01" value="${x.open>0?x.open:""}"></label><label>Date<input id="mk-date" type="date" value="${today()}"></label>
   ${u.how==="cash"?`<label>Paid from<select id="mk-from">${boxes.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></label>`:u.how==="cap"?`<label>Capital ledger<select id="mk-cap">${caps.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></label>`:`<p class="hint" style="grid-column:1/-1">Owner’s personal purchases currently held: ${money0(hold?J.balanceOf(hold.id):0)}.</p>`}
   <button class="btn" data-a="mkjSettle">Post settlement</button></div></section>`}

function vBook(){const hold=holdAcc();const ids=new Set([...mk().map(a=>a.id),...capAccs().map(a=>a.id),...(hold?[hold.id]:[])]);const seen=new Map();
  for(const id of ids)for(const p of J.D.post?.get(id)||[])if(!seen.has(p.v.id))seen.set(p.v.id,p.v);const vs=[...seen.values()].sort((a,b)=>b.date.localeCompare(a.date)||b.no.localeCompare(a.no)).slice(0,200);
  return `<section class="panel"><h2>MKJ day book</h2><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>No.</th><th>Particulars</th><th class="num">Amount</th></tr></thead><tbody>${vs.map(v=>`<tr><td>${fmtDate(v.date)}</td><td>${esc(v.no)}</td><td>${esc(v.lines.map(l=>accName(l.a)).join(" · "))}<div class="muted">${esc(v.narr||"")}</div></td><td class="num">${inr.format(r2(v.lines.reduce((s,l)=>s+l.dr,0)))}</td></tr>`).join("")||'<tr><td colspan="4" class="muted">No entries yet.</td></tr>'}</tbody></table></div></section>`}

J.act("mkjPick",el=>{J.ui("mkj",{}).sel=document.getElementById("mk-sel").value;J.render()});
J.act("mkjHow",el=>{J.ui("mkj",{}).how=document.getElementById("mk-how").value;J.render()});
J.act("mkjSettle",async()=>{if(!J.canSee("mkjacc"))return;const u=J.ui("mkj",{});const a=J.get("accounts",u.sel);if(!a)return;const x=info(a);
  const amt=r2(+document.getElementById("mk-amt")?.value||0),date=document.getElementById("mk-date")?.value||today();
  if(!(amt>0))return toast("Enter an amount");if(amt>x.open+0.005)return toast("That is more than the "+money0(x.open)+" still to settle");
  if(frozen(date))return toast("That date is frozen — unlock it in Accounts → Freeze & checks first");
  let cr,narr;
  if(u.how==="cash"){cr=document.getElementById("mk-from")?.value;narr="Business spends paid back to "+a.name}
  else if(u.how==="cap"){cr=document.getElementById("mk-cap")?.value;narr="Business spends on "+a.name+" added to capital infusion"}
  else{const h=holdAcc();if(!h)return toast("No personal purchases are held");cr=h.id;narr="Business spends on "+a.name+" set off against personal purchases"}
  if(!cr)return toast("Pick the other side");
  await J.safe(()=>J.postVoucher({type:"journal",date,lines:[{a:a.id,dr:amt,cr:0,n:narr},{a:cr,dr:0,cr:amt,n:narr}],narr,src:{col:"mkjset",id:a.id,how:u.how}}),"Settlement posted");J.render()});

const ic='<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>';
J.mod({id:"mkjacc",label:"MKJ Accounts",group:"MKJ",icon:ic,sub:"Personal instruments, capital and settling business spends.",tabs:[["over","Overview",vOver],["settle","Settle business spends",vSettle],["book","MKJ day book",vBook]],badge:()=>{try{const n=mk().filter(a=>info(a).open>0.5).length;return n||0}catch(e){return 0}}});
J.mod({id:"mkjinv",label:"MKJ Inventory",group:"MKJ",icon:'<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v8l9 4 9-4V8"/>',sub:"Personal purchases marked in stock entries.",tabs:[["purch","Personal purchases",()=>J.invViews?.purch?.()||""]]});
J.mod({id:"mkjassets",label:"MKJ Fixed Assets",group:"MKJ",icon:'<rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M7 7V5h10v2M3 12h18"/>',sub:"Personal equipment and assets.",tabs:[["register","Register",()=>J.assetViews?.register?.()||""],["schedule","Depreciation",()=>J.assetViews?.schedule?.()||""]]});
})();
