/* Loans & advances with interest terms.
   Each loan ledger (kind loan, staff loan, staff advance) can carry terms: interest-free, simple, compound (monthly /
   quarterly / yearly) or a fixed amount per month (optionally for life, principal non-refundable).
   Accounts → Loans & interest works out the interest month by month and posts one journal per loan per month
   (same entry number if re-posted), and records waivers (e.g. a lender who does not take the interest at closure). */
(()=>{
const J=window.J,{S,esc,inr,r2,money,money0,fmtDate,monthLabel,today,toast,fld,txt,num,selO}=J;
const LK=["loan","staffloan","staffadv"];
const TYPES=[["none","Interest-free"],["simple","Simple interest"],["compound","Compound interest"],["fixed","Fixed amount per month"]];
const COMP=[["monthly","Monthly"],["quarterly","Quarterly"],["yearly","Yearly"]];
const defDir=k=>k==="loan"?"taken":"given";
const termsOf=a=>a?.lt||{type:"none",dir:defDir(a?.kind)};
const termText=t=>{if(!t||t.type==="none")return "Interest-free";const r=+t.rate||0;return t.type==="simple"?`Simple ${r}% p.a.`:t.type==="compound"?`Compound ${r}% p.a., ${(COMP.find(c=>c[0]===t.comp)||COMP[0])[1].toLowerCase()}`:`Fixed ${money(+t.fixed||0)} / month${t.life?" for life":""}${t.nonref?" · principal non-refundable":""}`};
J.loanTermText=termText;
// ---------- ledger form: terms box ----------
J.loanTermsBox=a=>{const t=termsOf(a);const show=LK.includes(a.kind);return `<div id="ltBox" class="panel pb" style="margin:0;${show?"":"display:none"}"><b>Loan / advance terms</b><div class="form">
  ${fld("This is a loan",selO("ltDir",[["taken","Taken — we owe them"],["given","Given — they owe us"]],t.dir||defDir(a.kind)))}
  ${fld("Interest",selO("ltType",TYPES,t.type||"none"))}
  ${fld("Rate % per year",num("ltRate",t.rate,"e.g. 12"))}
  ${fld("Compounding",selO("ltComp",COMP,t.comp||"monthly"))}
  ${fld("Fixed amount per month ₹",num("ltFixed",t.fixed))}
  ${fld("Interest from",`<input type="date" name="ltFrom" id="f-ltFrom" value="${esc(t.from||"")}">`)}</div>
  <div class="row" style="gap:16px;flex-wrap:wrap"><label class="row" style="gap:6px"><input type="checkbox" name="ltLife" ${t.life?"checked":""}> Fixed amount is for life (no end date)</label><label class="row" style="gap:6px"><input type="checkbox" name="ltNonref" ${t.nonref?"checked":""}> Principal is non-refundable</label></div>
  <p class="hint" style="margin:4px 0 0">Old loans with different terms (e.g. an interest-free loan and a later loan with interest from the same person) are best kept as two ledgers, e.g. “Deepak — Loan (interest-free)” and “Deepak — Loan 2026 @12%”. Interest is posted from Accounts → Loans &amp; interest.</p></div>`};
J.loanTermsRead=(fd,kind)=>LK.includes(kind)?{dir:fd.ltDir||defDir(kind),type:fd.ltType||"none",rate:+fd.ltRate||0,comp:fd.ltComp||"monthly",fixed:+fd.ltFixed||0,from:fd.ltFrom||"",life:!!fd.ltLife,nonref:!!fd.ltNonref}:undefined;
document.addEventListener("change",e=>{if(e.target?.id==="f-kind"){const b=document.getElementById("ltBox");if(b){b.style.display=LK.includes(e.target.value)?"":"none";const d=document.getElementById("f-ltDir");if(d)d.value=defDir(e.target.value)}}});
// ---------- interest maths ----------
const pad=n=>String(n).padStart(2,"0");
const months=(a,b)=>{const out=[];let [y,m]=a.split("-").map(Number);const [by,bm]=b.split("-").map(Number);while(y<by||(y===by&&m<=bm)){out.push(y+"-"+pad(m));m++;if(m>12){m=1;y++}}return out};
const lastClosed=()=>{const d=new Date();d.setDate(0);return J.iso(d).slice(0,7)};
const intAccId=id=>"lint-acc-"+id;
async function intAcc(a){const t=termsOf(a);const id=intAccId(a.id);const want={id,name:(t.dir==="taken"?"Interest payable — ":"Interest receivable — ")+a.name,kind:"loan",opening:0,active:true,intOf:a.id};const cur=J.get("accounts",id);if(!cur||cur.name!==want.name){await J.store.put("accounts",{...(cur||{}),...want});J.S.c.accounts.set(id,{...(cur||{}),...want})}return id}
const sideBal=(a,id,upto)=>{const b=J.balanceOf(id,upto);return termsOf(a).dir==="taken"?-b:b};
// principal outstanding on a day = the loan ledger itself, without this ledger's own interest postings
const princOn=(a,day)=>{let b=+a.opening||0;for(const p of J.D.post?.get(a.id)||[]){if(p.date>day)break;if(/^lint-/.test(p.v.id)&&!/-cap$/.test(p.v.id))continue;b+=p.dr-p.cr}return termsOf(a).dir==="taken"?-b:b};
function monthInterest(a,m){const t=termsOf(a);if(t.type==="none")return 0;const from=t.from||"0000-00-00";const end=J.monthEnd(m);if(end<from)return 0;
  if(t.type==="fixed")return r2(+t.fixed||0);
  const r=(+t.rate||0)/100/365;let s=0;const D=+end.slice(8,10);
  for(let d=1;d<=D;d++){const day=m+"-"+pad(d);if(day<from)continue;let bal=princOn(a,day);
    if(t.type==="compound")bal+=Math.max(0,sideBal(a,intAccId(a.id),day));// interest not yet added to the loan earns interest too
    if(bal>0)s+=bal*r}
  return r2(s)}
const capMonth=(t,m)=>t.type==="compound"&&(t.comp==="monthly"||(t.comp==="quarterly"&&["03","06","09","12"].includes(m.slice(5)))||(t.comp==="yearly"&&m.slice(5)==="03"));
const heads=async dir=>dir==="taken"?{int:await J.ensureAcc("Interest paid on loans","expense"),waive:await J.ensureAcc("Interest waived by lenders","income")}:{int:await J.ensureAcc("Interest received on loans given","income"),waive:await J.ensureAcc("Interest waived on loans given","expense")};
async function postMonth(a,m){const t=termsOf(a);const amt=monthInterest(a,m);const vid="lint-"+a.id+"-"+m;const H=await heads(t.dir);const ia=await intAcc(a);
  if(amt>=0.5){const L=t.dir==="taken"?[{a:H.int,dr:amt,cr:0,n:"Interest "+monthLabel(m)},{a:ia,dr:0,cr:amt,n:termText(t)}]:[{a:ia,dr:amt,cr:0,n:termText(t)},{a:H.int,dr:0,cr:amt,n:"Interest "+monthLabel(m)}];
    await J.postVoucher({id:vid,type:"journal",noTwin:true,date:J.monthEnd(m),lines:L,party:a.id,narr:"Interest on "+a.name+" · "+monthLabel(m)+" · "+termText(t),ref:m,src:{col:"loans",id:a.id,label:"Loan interest"}})}
  else if(J.get("vouchers",vid))await J.store.del("vouchers",vid);
  // compound: add the interest to the loan itself at the end of each compounding period
  const cid=vid+"-cap";if(capMonth(t,m)){J.derive&&J.derive();const acc=r2(sideBal(a,ia,J.monthEnd(m))+(J.get("vouchers",cid)?r2(J.vAmount(J.get("vouchers",cid))):0));
    if(acc>=0.5){const L=t.dir==="taken"?[{a:ia,dr:acc,cr:0,n:"Interest added to loan"},{a:a.id,dr:0,cr:acc,n:"Interest added · "+monthLabel(m)}]:[{a:a.id,dr:acc,cr:0,n:"Interest added · "+monthLabel(m)},{a:ia,dr:0,cr:acc,n:"Interest added to loan"}];
      await J.postVoucher({id:cid,type:"journal",noTwin:true,date:J.monthEnd(m),lines:L,party:a.id,narr:"Interest added to "+a.name+" · "+monthLabel(m)+" (compounding)",ref:m,src:{col:"loans",id:a.id,label:"Loan interest"}})}}
  return amt}
// ---------- Accounts → Loans & interest ----------
const loans=()=>J.all("accounts").filter(a=>LK.includes(a.kind)&&!a.intOf&&a.active!==false&&(a.lt||a.kind==="loan"));
function vLoans(){const U=J.ui("loans",{all:false});const lc=lastClosed();const list=loans().filter(a=>U.all||a.lt?.type&&a.lt.type!=="none"||a.kind==="loan").sort((x,y)=>x.name.localeCompare(y.name));
  const rows=list.map(a=>{const t=termsOf(a);const ia=intAccId(a.id);const posted=(J.D.post?.get(ia)||[]).length;const princ=princOn(a,today());const intBal=J.get("accounts",ia)?sideBal(a,ia,today()):0;
    const lastP=J.all("vouchers").filter(v=>v.src?.col==="loans"&&v.src?.id===a.id&&!/-cap$/.test(v.id)&&v.ref).map(v=>v.ref).sort().at(-1)||"";
    const start=(t.from||J.settings().startMonth+"-01").slice(0,7);const pend=t.type==="none"?[]:months(lastP?months(lastP,lastP)[0]:start,lc).filter(m=>m>lastP&&m>=start);
    return {a,t,princ,intBal,lastP,pend,posted}});
  const deps=J.all("accounts").filter(a=>/^dep/.test(a.kind)&&a.dep?.monthly);
  return `<p class="hint" style="margin-top:0">Loans taken and given, staff loans and advances, with their interest terms. Interest is worked out month by month on the outstanding balance and posted as one entry per loan per month (re-posting a month rewrites the same entry). Open a ledger's <b>Terms</b> to set interest-free, simple, compound or a fixed amount per month.</p>
  <div class="filters"><label class="row" style="gap:6px"><input type="checkbox" data-set="loans.all=${U.all?"":"1"}" ${U.all?"checked":""}> Show staff loans &amp; advances without terms</label><div class="row" style="margin-left:auto"><button class="btn primary w" data-a="loanPostAll" ${rows.some(r=>r.pend.length)?"":"disabled"}>Post interest up to ${monthLabel(lc)}</button></div></div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Loan</th><th>Terms</th><th class="num">Principal outstanding</th><th class="num">Interest due (posted)</th><th>Posted up to</th><th></th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td><b>${esc(r.a.name)}</b><div class="hint">${r.t.dir==="taken"?"Taken — we owe":"Given — they owe us"} · ${esc(J.KINDS?.[r.a.kind]?.l||r.a.kind)}</div></td><td>${esc(termText(r.t))}${r.t.from?`<div class="hint">from ${fmtDate(r.t.from)}</div>`:""}</td>
    <td class="num">${inr.format(r.princ)}</td><td class="num">${Math.abs(r.intBal)>=0.5?inr.format(r.intBal):"—"}</td>
    <td>${r.t.type==="none"?'<span class="chip plain">no interest</span>':r.lastP?monthLabel(r.lastP)+(r.pend.length?` <span class="chip warn">${r.pend.length} month${r.pend.length>1?"s":""} to post</span>`:' <span class="chip ok">up to date</span>'):`<span class="chip warn">${r.pend.length} month${r.pend.length===1?"":"s"} to post</span>`}</td>
    <td style="white-space:nowrap;text-align:right"><button class="btn small" data-a="loanTerms" data-x="${r.a.id}">Terms</button> ${r.t.type!=="none"?`<button class="btn small w" data-a="loanPost" data-x="${r.a.id}">Post / re-post</button> `:""}${Math.abs(r.intBal)>=0.5||r.t.type!=="none"?`<button class="btn small" data-a="loanWaive" data-x="${r.a.id}">Waive interest</button> `:""}<button class="btn small" data-a="openLedger" data-x="${r.a.id}">Ledger</button></td></tr>`).join("")||`<tr><td colspan="6" class="muted">No loans yet. Create a ledger of kind “Loan” (or set terms on a staff loan / advance).</td></tr>`}</tbody></table></div></section>
  ${deps.length?`<section class="panel"><h2>Deposits with a fixed monthly payment</h2><div class="tbl-wrap"><table><thead><tr><th>Deposit</th><th class="num">Amount</th><th>Terms</th><th class="num">Monthly</th></tr></thead><tbody>${deps.map(a=>`<tr><td>${esc(a.name)}</td><td class="num">${inr.format(a.dep.amt||Math.abs(J.balanceOf(a.id)))}</td><td>${({nonref:"Non-refundable",ref:"Refundable",adj:"Adjustable"})[a.dep.terms]||""}${a.dep.date?" · since "+fmtDate(a.dep.date):""}</td><td class="num">${inr.format(a.dep.monthly)}${a.dep.day?` <span class="hint">on day ${a.dep.day}</span>`:""}</td></tr>`).join("")}</tbody></table></div><p class="hint pb" style="margin:0">E.g. a non-refundable deposit with a life-long ₹1,000 a month: the deposit stays in full on its ledger; each monthly payment is booked to “Returns paid on deposits” (an expense).</p></section>`:""}`}
J.act("loanTerms",el=>J.accDrawer(el.dataset.x));
async function postRange(a){const t=termsOf(a);if(t.type==="none")return 0;const start=(t.from||J.settings().startMonth+"-01").slice(0,7);let n=0;const ms=months(start,lastClosed());J.busy?.start?.("Posting interest · "+a.name,ms.length,"months");try{for(const m of ms){await postMonth(a,m);J.derive&&J.derive();n++;J.busy?.tick?.()}}finally{J.busy?.end?.()}return n}
J.act("loanPost",async el=>{const a=J.get("accounts",el.dataset.x);const n=await J.safe(()=>postRange(a));if(n)toast("Interest posted for "+n+" month(s) · "+a.name);J.render()});
J.act("loanPostAll",async()=>{let n=0;for(const a of loans())if(termsOf(a).type!=="none"){await J.safe(()=>postRange(a));n++}toast("Interest posted for "+n+" loan(s)");J.render()});
J.act("loanWaive",el=>{const a=J.get("accounts",el.dataset.x);const t=termsOf(a);const ia=intAccId(a.id);const due=J.get("accounts",ia)?r2(sideBal(a,ia,today())):0;
  J.drawer({title:"Waive interest · "+a.name,submit:"Post waiver",body:`<p class="hint" style="margin-top:0">${t.dir==="taken"?"The lender does not take the interest (e.g. at closure). The interest already booked as payable is written back as income “Interest waived by lenders”.":"You let the borrower off the interest. It is written off as an expense “Interest waived on loans given”."}</p>
    <div class="form">${fld("Date",`<input type="date" name="date" id="f-date" value="${today()}">`)}${fld("Amount waived ₹",num("amt",due||""))}</div>${fld("Waive from",selO("from",[["int","Interest due (posted, not yet added to the loan)"],["loan","Loan balance (interest already added to the loan)"]],"int"))}${fld("Note",txt("note","",t.dir==="taken"?"e.g. waived at closure":"e.g. goodwill"))}
    <p class="hint">Interest due now: ${money(due)}.</p>`,
    onSubmit:async fd=>{const A=r2(+fd.amt||0);if(!(A>0))return "Enter the amount.";const H=await heads(t.dir);const tgt=fd.from==="loan"?a.id:await intAcc(a);
      const L=t.dir==="taken"?[{a:tgt,dr:A,cr:0,n:"Interest waived"},{a:H.waive,dr:0,cr:A,n:a.name}]:[{a:H.waive,dr:A,cr:0,n:a.name},{a:tgt,dr:0,cr:A,n:"Interest waived"}];
      await J.postVoucher({type:"journal",noTwin:true,date:fd.date,lines:L,party:a.id,narr:"Interest waived · "+a.name+(fd.note?" · "+fd.note:""),src:{col:"loans",id:a.id,label:"Interest waiver"}});toast(money(A)+" interest waived")}})});
{const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="reports");acc.tabs.splice(i<0?acc.tabs.length:i,0,["loans","Loans & interest",vLoans])}}
})();
