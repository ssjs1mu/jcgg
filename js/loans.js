/* Loans, advances and deposits per person — ONE ledger per person, whatever the terms.
   The ledger carries a list of terms by date (e.g. interest-free until 31 Mar 2026, 12% simple from 1 Apr 2026).
   Every amount received / given on that ledger becomes a "tranche" with the terms in force on its date. Repayments
   clear accrued interest first, then the tranches (interest-bearing, highest rate first — or oldest first).
   Interest is posted month by month to the same ledger (one entry per person per month, re-posting rewrites it);
   compound interest is added to its tranche at each compounding date; waivers are posted on the same ledger too.
   Accounts → Loans & interest shows every person with a date-wise statement and the tranche table. */
(()=>{
const J=window.J,{S,esc,inr,r2,money,fmtDate,monthLabel,today,toast,fld,txt,num,selO}=J;
const LK=["loan","staffloan","staffadv","deprec","deppaid"];
const TYPES=[["none","Interest-free"],["simple","Simple interest"],["compound","Compound interest"],["fixed","Fixed amount per month"]];
const COMP=[["monthly","Monthly"],["quarterly","Quarterly"],["yearly","Yearly"]];
const defDir=k=>k==="loan"||k==="deprec"?"taken":"given";
const pad=n=>String(n).padStart(2,"0");
// ---------- terms ----------
function cfg(a){if(!a)return {dir:"taken",order:"rate",terms:[]};let terms=Array.isArray(a.lterms)?a.lterms:[];
  if(!terms.length&&a.lt&&a.lt.type)terms=[{from:"",type:a.lt.type,rate:a.lt.rate,comp:a.lt.comp,fixed:a.lt.fixed,life:a.lt.life,nonref:a.lt.nonref}];
  return {dir:a.ldir||a.lt?.dir||defDir(a.kind),order:a.lorder||"rate",terms:terms.slice().sort((x,y)=>(x.from||"").localeCompare(y.from||""))}}
const termOn=(c,day)=>{let t={type:"none"};for(const x of c.terms)if(!x.from||x.from<=day)t=x;return t};
const termText=t=>{if(!t||!t.type||t.type==="none")return "Interest-free";const r=+t.rate||0;return t.type==="simple"?`Simple ${r}% p.a.`:t.type==="compound"?`Compound ${r}% p.a. (${((COMP.find(c=>c[0]===t.comp)||COMP[0])[1]).toLowerCase()})`:`Fixed ${money(+t.fixed||0)}/month${t.life?" for life":""}${t.nonref?" · non-refundable":""}`};
J.loanTermText=termText;J.loanCfg=cfg;
const hasTerms=a=>cfg(a).terms.some(t=>t.type&&t.type!=="none");
// ---------- ledger form ----------
const ROWS=4;
J.loanTermsBox=a=>{const c=cfg(a);const show=LK.includes(a.kind);const rows=[...c.terms];while(rows.length<Math.max(ROWS,c.terms.length+1))rows.push({});
  return `<div id="ltBox" class="panel pb" style="margin:0;${show?"":"display:none"}"><b>Loan / advance terms</b>
  <p class="hint" style="margin:2px 0 6px">All money given to or received from this person stays on this one ledger. Add a line for each change of terms: money received / given on or after its date follows it (e.g. interest-free from the start, 12% simple from 01-04-2026).</p>
  <div class="form">${fld("This ledger is",selO("ltDir",[["taken","Money taken — we owe them"],["given","Money given — they owe us"]],c.dir))}${fld("Repayments clear",selO("ltOrder",[["rate","Interest-bearing first (highest rate)"],["fifo","Oldest first"]],c.order))}</div>
  <div class="tbl-wrap"><table class="lt-tbl"><thead><tr><th>From date</th><th>Interest</th><th>Rate % p.a.</th><th>Compounding</th><th>Fixed ₹/month</th><th>For life</th><th>Non-refund.</th></tr></thead><tbody>
  ${rows.map((t,i)=>`<tr><td><input type="date" name="lt${i}from" value="${esc(t.from||"")}" aria-label="Terms ${i+1} from"></td><td><select name="lt${i}type" aria-label="Terms ${i+1} interest"><option value="">—</option>${TYPES.map(([v,l])=>`<option value="${v}" ${t.type===v?"selected":""}>${l}</option>`).join("")}</select></td><td><input type="number" step="any" name="lt${i}rate" value="${esc(t.rate??"")}" style="width:70px"></td><td><select name="lt${i}comp">${COMP.map(([v,l])=>`<option value="${v}" ${t.comp===v?"selected":""}>${l}</option>`).join("")}</select></td><td><input type="number" step="any" name="lt${i}fixed" value="${esc(t.fixed??"")}" style="width:90px"></td><td><input type="checkbox" name="lt${i}life" ${t.life?"checked":""}></td><td><input type="checkbox" name="lt${i}nonref" ${t.nonref?"checked":""}></td></tr>`).join("")}</tbody></table></div>
  <p class="hint" style="margin:4px 0 0">Leave “From date” blank on the first line to cover everything from the start. Interest is posted from Accounts → Loans &amp; interest.</p></div>`};
J.loanTermsRead=(fd,kind)=>{if(!LK.includes(kind))return;const terms=[];for(let i=0;i<20;i++){if(fd["lt"+i+"type"]===undefined)break;const ty=fd["lt"+i+"type"];if(!ty)continue;terms.push({from:fd["lt"+i+"from"]||"",type:ty,rate:+fd["lt"+i+"rate"]||0,comp:fd["lt"+i+"comp"]||"monthly",fixed:+fd["lt"+i+"fixed"]||0,life:!!fd["lt"+i+"life"],nonref:!!fd["lt"+i+"nonref"]})}
  return {ldir:fd.ltDir||defDir(kind),lorder:fd.ltOrder||"rate",lterms:terms}};
document.addEventListener("change",e=>{if(e.target?.id==="f-kind"){const b=document.getElementById("ltBox");if(b){b.style.display=LK.includes(e.target.value)?"":"none";const d=document.getElementById("f-ltDir");if(d)d.value=defDir(e.target.value)}}});
// ---------- engine: replay the ledger, tranche by tranche ----------
const isInt=v=>/^lint-/.test(v.id),isWaive=v=>v.src?.label==="Interest waiver";
const monthEnd=m=>J.monthEnd(m);
const capDue=(t,m)=>t.type!=="compound"||t.comp==="monthly"||(t.comp==="quarterly"&&["03","06","09","12"].includes(m.slice(5)))||(t.comp==="yearly"&&m.slice(5)==="03");
// state after replaying postings (optionally stopping before a day, skipping one voucher)
function replay(a,{until,skip,accrueMonth}={}){const c=cfg(a);const sgn=c.dir==="taken"?-1:1;const T=[];let I=0;let k=0;const ev=[];
  const open=r2((+a.opening||0)*sgn);if(open>0.004)T.push({key:"open",date:J.settings().startMonth+"-01",amt:open,orig:open,repaid:0,t:termOn(c,"0000-00-00"),acc:0,int:0});
  const apply=p=>{const v=p.v;const amt=r2((p.dr-p.cr)*sgn);
    if(isInt(v)){I=r2(I+amt);for(const [key,x] of Object.entries(v.f?.cap||{})){const tr=T.find(q=>q.key===key);if(tr){tr.amt=r2(tr.amt+x);tr.int=r2(tr.int+x);I=r2(I-x)}}ev.push({p,kind:"interest",amt});return}
    if(isWaive(v)){I=r2(I+amt);ev.push({p,kind:"waiver",amt});return}
    if(amt>0){T.push({key:v.id+"#"+(k++),date:p.date,amt,orig:amt,repaid:0,t:termOn(c,p.date),acc:0,int:0,no:v.no});ev.push({p,kind:"in",amt});return}
    let r=-amt;ev.push({p,kind:"repay",amt:-amt});const fromI=Math.min(Math.max(I,0),r);I=r2(I-fromI);r=r2(r-fromI);
    const ord=T.filter(x=>x.amt>0.004).sort(c.order==="fifo"?(x,y)=>x.date.localeCompare(y.date):(x,y)=>((+y.t.rate||0)+(y.t.type==="fixed"?0:0))-((+x.t.rate||0))||x.date.localeCompare(y.date));
    for(const tr of ord){if(r<=0)break;if(tr.t.nonref)continue;const x=Math.min(tr.amt,r);tr.amt=r2(tr.amt-x);tr.repaid=r2(tr.repaid+x);r=r2(r-x)}
    if(r>0.004){for(const tr of ord){if(r<=0)break;const x=Math.min(tr.amt,r);tr.amt=r2(tr.amt-x);tr.repaid=r2(tr.repaid+x);r=r2(r-x)}}if(r>0.004)I=r2(I-r)};
  const posts=(J.D.post?.get(a.id)||[]).filter(p=>p.v.id!==skip);
  if(!accrueMonth){for(const p of posts){if(until&&p.date>=until)break;apply(p)}return {T,I,ev,c}}
  // accrue interest for month m day by day
  const m=accrueMonth,first=m+"-01",end=monthEnd(m),D=+end.slice(8,10);let i=0;
  while(i<posts.length&&posts[i].date<first)apply(posts[i++]);
  const daily={},fixed={};
  for(let d=1;d<=D;d++){const day=m+"-"+pad(d);while(i<posts.length&&posts[i].date<=day)apply(posts[i++]);
    for(const tr of T){const t=tr.t;if(!t||t.type==="none"||t.type==="fixed")continue;if(tr.date>day)continue;const base=tr.amt;if(base<=0)continue;daily[tr.key]=(daily[tr.key]||0)+base*(+t.rate||0)/100/365;}}
  for(const tr of T){const t=tr.t;if(t?.type==="fixed"&&(tr.amt>0.004||t.life)&&tr.date<=end)fixed[tr.key]=r2(+t.fixed||0)}
  const comp={},cap={};let simple=0;for(const tr of T){const x=r2((daily[tr.key]||0));if(x<=0)continue;if(tr.t.type==="compound")comp[tr.key]=x;else simple=r2(simple+x)}
  // compounding date: everything accrued on that loan since the last compounding (earlier months' entries of the period) is added to it
  for(const tr of T){if(tr.t.type!=="compound"||!capDue(tr.t,m))continue;let s=comp[tr.key]||0;const per=tr.t.comp==="quarterly"?3:tr.t.comp==="yearly"?12:1;let [y,mo]=m.split("-").map(Number);for(let i=1;i<per;i++){mo--;if(mo<1){mo=12;y--}const pv=J.get("vouchers","lint-"+a.id+"-"+y+"-"+pad(mo));s+=+(pv?.f?.comp?.[tr.key]||0)}if(s>0)cap[tr.key]=r2(s)}
  // fixed amounts: once per terms line, not per tranche
  const seen=new Set();for(const tr of T){if(fixed[tr.key]==null)continue;const id=tr.t.from+"|"+tr.t.fixed;if(seen.has(id))continue;seen.add(id);simple=r2(simple+fixed[tr.key])}
  const compNow=r2(Object.values(comp).reduce((s,x)=>s+x,0));
  return {T,I,c,simple,cap,comp,compNow,total:r2(simple+compNow)}}
// compound interest accrued but not yet added (quarterly / yearly) is carried in the voucher as "pend"
async function heads(dir){return dir==="taken"?{int:await J.ensureAcc("Interest paid on loans","expense"),waive:await J.ensureAcc("Interest waived by lenders","income")}:{int:await J.ensureAcc("Interest received on loans given","income"),waive:await J.ensureAcc("Interest waived on loans given","expense")}}
async function postMonth(a,m){const vid="lint-"+a.id+"-"+m;const st=replay(a,{accrueMonth:m,skip:vid});const c=st.c;
  // amount booked this month = simple/fixed + compound interest that is added now (capitalised); un-capitalised compound waits
  const amt=st.total;
  if(amt>=0.5){const H=await heads(c.dir);const L=c.dir==="taken"?[{a:H.int,dr:amt,cr:0,n:a.name+" · "+monthLabel(m)},{a:a.id,dr:0,cr:amt,n:"Interest "+monthLabel(m)}]:[{a:a.id,dr:amt,cr:0,n:"Interest "+monthLabel(m)},{a:H.int,dr:0,cr:amt,n:a.name+" · "+monthLabel(m)}];
    const parts=[...new Set(st.T.filter(tr=>tr.t.type!=="none").map(tr=>termText(tr.t)))].join(" + ");
    await J.postVoucher({id:vid,type:"journal",noTwin:true,date:monthEnd(m),lines:L,party:a.id,narr:"Interest "+monthLabel(m)+" · "+a.name+" · "+parts,ref:m,src:{col:"loans",id:a.id,label:"Loan interest"},f:{cap:st.cap,comp:st.comp}})}
  else if(J.get("vouchers",vid))await J.store.del("vouchers",vid);return amt}
const months=(a,b)=>{const out=[];let [y,m]=a.split("-").map(Number);const [by,bm]=b.split("-").map(Number);while(y<by||(y===by&&m<=bm)){out.push(y+"-"+pad(m));m++;if(m>12){m=1;y++}}return out};
const lastClosed=()=>{const d=new Date();d.setDate(0);return J.iso(d).slice(0,7)};
async function postRange(a){if(!hasTerms(a))return 0;const c=cfg(a);const first=(J.D.post?.get(a.id)||[])[0]?.date||J.settings().startMonth+"-01";const start=[first,...c.terms.map(t=>t.from).filter(Boolean)].sort()[0].slice(0,7);
  const ms=months(start<J.settings().startMonth?J.settings().startMonth:start,lastClosed());J.busy?.start?.("Posting interest · "+a.name,ms.length,"months");let n=0;
  try{for(const m of ms){await postMonth(a,m);await new Promise(r=>setTimeout(r,60));J.derive&&J.derive();n++;J.busy?.tick?.()}}finally{J.busy?.end?.()}return n}
// ---------- Accounts → Loans & interest ----------
const people=all=>J.all("accounts").filter(a=>LK.includes(a.kind)&&!a.intOf&&(all||a.active!==false)&&(all||hasTerms(a)||a.kind==="loan"||/^dep/.test(a.kind)));
function vLoans(){const U=J.ui("loans",{all:false,open:""});const lc=lastClosed();
  const rows=people(U.all).sort((x,y)=>x.name.localeCompare(y.name)).map(a=>{const st=replay(a);const c=st.c;const princ=r2(st.T.reduce((s,t)=>s+t.amt,0));const lastP=J.all("vouchers").filter(v=>v.src?.col==="loans"&&v.src?.id===a.id&&isInt(v)).map(v=>v.ref).sort().at(-1)||"";return {a,c,st,princ,lastP,bal:r2(J.balanceOf(a.id)*(c.dir==="taken"?-1:1))}});
  const op=U.open&&J.get("accounts",U.open);
  return `<p class="hint" style="margin-top:0">One ledger per person for all money given or taken — loans, advances, deposits. Each amount follows the terms in force on its date (set on the ledger: interest-free, simple, compound or a fixed amount per month). Interest is posted to the same ledger month by month; repayments clear interest first, then the loans. Tap <b>Statement</b> for the date-wise record and the loan-by-loan table.</p>
  <div class="filters"><label class="row" style="gap:6px"><input type="checkbox" data-set="loans.all=${U.all?"":"1"}" ${U.all?"checked":""}> Show all staff loans &amp; advances</label><div class="row" style="margin-left:auto"><button class="btn primary w" data-a="loanPostAll">Post interest up to ${monthLabel(lc)}</button></div></div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Person / ledger</th><th>Terms</th><th class="num">Principal</th><th class="num">Interest unpaid</th><th class="num">Ledger balance</th><th>Interest posted to</th><th></th></tr></thead><tbody>
  ${rows.map(r=>`<tr ${U.open===r.a.id?'style="background:var(--wash)"':""}><td><b>${esc(r.a.name)}</b><div class="hint">${r.c.dir==="taken"?"We owe":"They owe us"} · ${esc(J.KINDS?.[r.a.kind]?.l||r.a.kind)}</div></td><td>${r.c.terms.length?r.c.terms.map(t=>`<div>${t.from?fmtDate(t.from)+": ":""}${esc(termText(t))}</div>`).join(""):"Interest-free"}${r.a.dep?.monthly?`<div class="hint">Deposit: ${money(r.a.dep.monthly)}/month booked to “Returns paid on deposits”${r.a.dep.terms==="nonref"?" · non-refundable":""}</div>`:""}</td>
    <td class="num">${inr.format(r.princ)}</td><td class="num">${Math.abs(r.st.I)>=0.5?inr.format(r.st.I):"—"}</td><td class="num"><b>${inr.format(r.bal)}</b></td><td>${hasTerms(r.a)?(r.lastP?monthLabel(r.lastP)+(r.lastP<lc?' <span class="chip warn">due</span>':' <span class="chip ok">up to date</span>'):'<span class="chip warn">not posted</span>'):'<span class="chip plain">no interest</span>'}</td>
    <td style="white-space:nowrap;text-align:right"><button class="btn small w" data-set="loans.open=${U.open===r.a.id?"":r.a.id}">Statement</button> <button class="btn small" data-a="loanTerms" data-x="${r.a.id}">Terms</button> ${hasTerms(r.a)?`<button class="btn small" data-a="loanPost" data-x="${r.a.id}">Post</button> <button class="btn small" data-a="loanWaive" data-x="${r.a.id}">Waive</button>`:""}</td></tr>`).join("")||`<tr><td colspan="7" class="muted">No loans yet. Create a ledger of kind “Loan” for the person and set its terms.</td></tr>`}</tbody></table></div></section>
  ${op?statement(op):""}`}
function statement(a){const st=replay(a);const c=st.c;const sg=c.dir==="taken"?-1:1;let bal=r2((+a.opening||0)*sg);
  const rows=(J.D.post?.get(a.id)||[]).map(p=>{const v=p.v;const amt=r2((p.dr-p.cr)*sg);bal=r2(bal+amt);const k=isInt(v)?"int":isWaive(v)?"waive":amt>0?"in":"out";return {p,v,amt,k,bal}});
  const inL=c.dir==="taken"?"Received":"Given",outL=c.dir==="taken"?"Repaid by us":"Repaid to us";
  return `<section class="panel"><h2>${esc(a.name)} · statement</h2>
   <div class="tbl-wrap"><table><thead><tr><th>Loan of</th><th class="num">Amount</th><th>Terms</th><th class="num">Repaid</th><th class="num">Interest added</th><th class="num">Outstanding</th></tr></thead><tbody>${st.T.map(tr=>`<tr><td>${tr.key==="open"?"Opening balance":fmtDate(tr.date)}${tr.no?` <span class="hint">${esc(tr.no)}</span>`:""}</td><td class="num">${inr.format(tr.orig)}</td><td>${esc(termText(tr.t))}</td><td class="num">${tr.repaid?inr.format(tr.repaid):"—"}</td><td class="num">${tr.int?inr.format(tr.int):"—"}</td><td class="num"><b>${inr.format(tr.amt)}</b></td></tr>`).join("")||'<tr><td colspan="6" class="muted">No money given or taken yet.</td></tr>'}</tbody>
   <tfoot><tr><td>Total</td><td class="num">${inr.format(r2(st.T.reduce((s,t)=>s+t.orig,0)))}</td><td></td><td class="num">${inr.format(r2(st.T.reduce((s,t)=>s+t.repaid,0)))}</td><td class="num">${inr.format(r2(st.T.reduce((s,t)=>s+t.int,0)))}</td><td class="num">${inr.format(r2(st.T.reduce((s,t)=>s+t.amt,0)))}</td></tr>${Math.abs(st.I)>=0.5?`<tr><td colspan="5">Interest unpaid</td><td class="num">${inr.format(st.I)}</td></tr>`:""}</tfoot></table></div>
   <h3 class="ph" style="padding:12px 16px 4px">Date-wise record</h3>
   <div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Entry</th><th>Particulars</th><th class="num">${inL}</th><th class="num">${outL}</th><th class="num">Interest</th><th class="num">Waived</th><th class="num">Balance</th></tr></thead><tbody>
   ${+a.opening?`<tr><td>${fmtDate(J.settings().startMonth+"-01")}</td><td></td><td>Opening balance</td><td class="num">${inr.format(r2(a.opening*sg))}</td><td></td><td></td><td></td><td class="num">${inr.format(r2(a.opening*sg))}</td></tr>`:""}
   ${rows.map(r=>`<tr><td>${fmtDate(r.p.date)}</td><td class="mono">${esc(r.v.no||"")}</td><td>${esc(r.v.narr||r.p.n||"")}</td><td class="num">${r.k==="in"?inr.format(r.amt):""}</td><td class="num">${r.k==="out"?inr.format(-r.amt):""}</td><td class="num">${r.k==="int"?inr.format(r.amt):""}</td><td class="num">${r.k==="waive"?inr.format(-r.amt):""}</td><td class="num"><b>${inr.format(r.bal)}</b></td></tr>`).join("")}</tbody></table></div>
   <div class="row pb" style="gap:8px"><button class="btn small" data-a="openLedger" data-x="${a.id}">Open ledger</button><button class="btn small" data-a="loanPrint" data-x="${a.id}">Print statement</button></div></section>`}
J.loanStatement=statement;
J.act("loanPrint",el=>{const a=J.get("accounts",el.dataset.x);J.printDoc?.("Loan statement "+a.name,`<h1>${esc(J.settings().business||"JCGG")}</h1>`+statement(a).replace(/<div class="row pb"[\s\S]*?<\/div><\/section>$/,"</section>"),true)});
J.act("loanTerms",el=>J.accDrawer(el.dataset.x));
J.act("loanPost",async el=>{const a=J.get("accounts",el.dataset.x);const n=await J.safe(()=>postRange(a));if(n)toast("Interest posted for "+n+" month(s) · "+a.name);J.render()});
J.act("loanPostAll",async()=>{let n=0;for(const a of people(true))if(hasTerms(a)){await J.safe(()=>postRange(a));n++}toast(n?"Interest posted for "+n+" ledger(s)":"No ledger has interest terms yet");J.render()});
J.act("loanWaive",el=>{const a=J.get("accounts",el.dataset.x);const st=replay(a);const c=st.c;const due=r2(Math.max(0,st.I));
  J.drawer({title:"Waive interest · "+a.name,submit:"Post waiver",body:`<p class="hint" style="margin-top:0">${c.dir==="taken"?"The lender does not take the interest (e.g. at closure). It is taken off this ledger and shown as income “Interest waived by lenders”.":"You let the borrower off the interest. It is taken off this ledger and written off as “Interest waived on loans given”."}</p>
    <div class="form">${fld("Date",`<input type="date" name="date" id="f-date" value="${today()}">`)}${fld("Amount waived ₹",num("amt",due||""))}</div>${fld("Note",txt("note","",c.dir==="taken"?"e.g. waived at closure":"e.g. goodwill"))}<p class="hint">Interest unpaid now: ${money(due)}${st.T.some(t=>t.int>0)?" · compound interest already added to the loans: "+money(r2(st.T.reduce((s,t)=>s+t.int,0))):""}.</p>`,
    onSubmit:async fd=>{const A=r2(+fd.amt||0);if(!(A>0))return "Enter the amount.";const H=await heads(c.dir);
      const L=c.dir==="taken"?[{a:a.id,dr:A,cr:0,n:"Interest waived"},{a:H.waive,dr:0,cr:A,n:a.name}]:[{a:H.waive,dr:A,cr:0,n:a.name},{a:a.id,dr:0,cr:A,n:"Interest waived"}];
      await J.postVoucher({type:"journal",noTwin:true,date:fd.date,lines:L,party:a.id,narr:"Interest waived · "+a.name+(fd.note?" · "+fd.note:""),src:{col:"loans",id:a.id,label:"Interest waiver"}});toast(money(A)+" interest waived")}})});
{const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="reports");acc.tabs.splice(i<0?acc.tabs.length:i,0,["loans","Loans & interest",vLoans])}}
})();
