/* Daily register — a quick day-to-day list of cash, bank, card and wallet expenses / receipts, so balances stay current
   between statement uploads.  Each line posts a normal entry (Dr expense / Cr bank, or Dr bank / Cr income) marked as a register entry.
   When the bank statement is imported, the import recognises the register entry (same bank, same amount, within 5 days — no payee
   needed), the bank's narration, reference and date are copied onto it, and it moves from "Waiting for statement" to "Matched".
   The category you chose is kept. Cash entries have no statement, so they stay as the final record. */
(()=>{
const J=window.J,{S,esc,inr,r2,fmtDate,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const MON=["bank","cash","card","wallet"];
const today=()=>new Date(Date.now()+19800000).toISOString().slice(0,10);
const ui=()=>J.ui("reg",{acc:"",dir:"out",cat:"",sub:"",f:""});
const isReg=v=>!!v.f?.reg;
const monLine=v=>arr(v.lines).find(l=>MON.includes(J.get("accounts",l.a)?.kind));
const matched=(v,acc)=>!!(v.bank||v.imp||v.rec?.[acc]);
function regs(){return J.all("vouchers").filter(isReg)}
function vReg(){const U=ui();const accs=J.accsOf(MON).filter(a=>a.active!==false);if(!U.acc&&accs[0])U.acc=accs[0].id;
  const cats=J.expCats?J.expCats():[];const CW=U.dir==="out"&&U.cat==="__cw";const subs=CW?J.accsOf(["card","wallet"]).filter(a=>a.id!==U.acc&&a.active!==false):U.dir==="out"?J.accsOf(["expense"]).filter(a=>!U.cat||J.expCatOf(a)===U.cat):J.accsOf(["income"]);
  const R=regs().map(v=>{const m=monLine(v);return {v,m,acc:m?.a,sgn:m?(+m.dr>0?1:-1):0,amt:m?r2(+m.dr||+m.cr):0,done:m?matched(v,m.a):false}}).filter(x=>x.m);
  // per account: books balance, what is still waiting for a statement, and what the statement should therefore show
  const per=accs.map(a=>{const wait=R.filter(x=>x.acc===a.id&&!x.done&&a.kind!=="cash");const net=r2(wait.reduce((s,x)=>s+x.sgn*x.amt,0));const bal=J.balanceOf(a.id);return {a,n:wait.length,net,bal,stmt:r2(bal-net)}}).filter(x=>x.n||x.a.id===U.acc);
  const list=R.filter(x=>(!U.f||x.acc===U.f)).sort((a,b)=>b.v.date.localeCompare(a.v.date)||(b.v.createdAt||0)-(a.v.createdAt||0)).slice(0,200);
  const B=n=>J.bal(n);
  return `<p class="hint" style="margin-top:0">Enter each day's cash, bank, card and wallet expenses here. They post straight away, so every balance stays current. When you upload the bank statement, each line is matched to its register entry automatically (same bank, same amount, within 5 days): the bank's description, reference and date are copied on, and the entry moves to Matched. Nothing is entered twice.</p>
  <section class="panel"><h2>New entry</h2><div class="pb"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
   <label>Date<input type="date" id="rg-d" value="${today()}" max="${today()}"></label>
   <label>Account<select data-ui="reg.acc">${accs.map(a=>`<option value="${a.id}" ${a.id===U.acc?"selected":""}>${esc(a.name)}</option>`).join("")}</select></label>
   <label>Type<select data-ui="reg.dir"><option value="out" ${U.dir==="out"?"selected":""}>Paid out (expense)</option><option value="in" ${U.dir==="in"?"selected":""}>Received (income)</option></select></label>
   ${U.dir==="out"?`<label>Category<select data-ui="reg.cat"><option value="">All</option><option value="__cw" ${CW?"selected":""}>Credit card &amp; wallet payments</option>${cats.map(c=>`<option ${c===U.cat?"selected":""}>${esc(c)}</option>`).join("")}</select></label>`:""}
   <label>${CW?"Card / wallet paid":U.dir==="out"?"Sub-category":"Income head"}<select data-ui="reg.sub"><option value="">Choose…</option>${subs.map(a=>{const b=CW?J.balanceOf(a.id):0;return `<option value="${a.id}" ${a.id===U.sub?"selected":""}>${esc(a.name)}${CW?" · "+(a.kind==="card"?"Card":"Wallet")+(b?" · owes "+inr.format(Math.abs(b)):""):""}</option>`}).join("")}</select></label>
   <label>Micro category<input id="rg-m" placeholder="e.g. gas cylinder, tea, auto fare" style="width:180px"></label>
   <label>Amount<input id="rg-a" type="number" min="0" step="0.01" inputmode="decimal" style="width:110px"></label>
   <label>Note<input id="rg-n" placeholder="optional" style="width:160px"></label>
   <button class="btn primary w" data-a="regAdd">Add</button></div></div></section>
  ${per.length?`<section class="panel"><h2>Balances</h2><div class="tbl-wrap"><table class="fit"><thead><tr><th>Account</th><th class="num">Books balance now</th><th class="num">Waiting for statement</th><th class="num">Statement should show</th></tr></thead><tbody>${per.map(x=>`<tr><td>${esc(x.a.name)}</td><td class="num">${B(x.bal)}</td><td class="num">${x.n?x.n+" · "+B(x.net):"—"}</td><td class="num">${x.a.kind==="cash"?"—":B(x.stmt)}</td></tr>`).join("")}</tbody></table></div></section>`:""}
  <section class="panel"><h2>Register entries (${list.length})</h2><div class="row pb" style="gap:8px"><select data-ui="reg.f"><option value="">All accounts</option>${accs.map(a=>`<option value="${a.id}" ${a.id===U.f?"selected":""}>${esc(a.name)}</option>`).join("")}</select></div>
  <div class="tbl-wrap"><table class="fit"><thead><tr><th>Date</th><th>Account</th><th>Category › sub</th><th>Micro</th><th class="num">Paid out</th><th class="num">Received</th><th>Status</th><th></th></tr></thead><tbody>${list.map(x=>{const o=arr(x.v.lines).find(l=>l!==x.m);const a=o&&J.get("accounts",o.a);const cw=a&&(a.kind==="card"||a.kind==="wallet");const cash=J.get("accounts",x.acc)?.kind==="cash";
    return `<tr><td>${fmtDate(x.v.date)}</td><td>${esc(J.accName(x.acc))}</td><td>${esc((cw?"Card & wallet payments › ":a?J.expCatOf(a)+" › ":"")+(a?.name||""))}</td><td>${esc(x.v.f.micro||"")}</td><td class="num">${x.sgn<0?inr.format(x.amt):""}</td><td class="num">${x.sgn>0?inr.format(x.amt):""}</td>
    <td>${x.done?`<span class="chip ok">Matched</span>${x.v.bank?.date?` <span class="hint">${fmtDate(x.v.bank.date)}</span>`:""}`:cash?'<span class="chip plain">Cash · final</span>':'<span class="chip warn">Waiting for statement</span>'}</td>
    <td style="white-space:nowrap"><button class="linkbtn vno" data-a="editv" data-x="${x.v.id}">${esc(x.v.no)}</button>${x.done?"":` <button class="btn small danger" data-a="regDel" data-x="${x.v.id}">Remove</button>`}</td></tr>${x.done&&x.v.narr?`<tr><td></td><td colspan="7" class="hint">${esc(x.v.narr)}</td></tr>`:""}`}).join("")||'<tr><td colspan="8" class="muted">No register entries yet.</td></tr>'}</tbody></table></div></section>`}
J.act("regAdd",async()=>{const U=ui(),g=id=>document.getElementById(id)?.value||"";const d=g("rg-d"),amt=r2(+g("rg-a")),sub=U.sub;
  if(!U.acc)return toast("Choose the account");if(!sub)return toast(U.dir==="out"?"Choose the sub-category":"Choose the income head");if(!(amt>0))return toast("Enter the amount");if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return toast("Choose the date");
  const cwp=U.dir==="out"&&["card","wallet"].includes(J.get("accounts",sub)?.kind);const out=U.dir==="out",micro=g("rg-m").trim(),note=g("rg-n").trim();const n=J.accName(sub);
  await J.safe(()=>J.postVoucher({type:cwp?"contra":out?"payment":"receipt",...(cwp?{f:{reg:1,micro,from:U.acc,to:sub,amount:amt}}:{}),date:d,lines:out?[{a:sub,dr:amt,cr:0,n:micro||note},{a:U.acc,dr:0,cr:amt,n:micro||note}]:[{a:U.acc,dr:amt,cr:0,n:micro||note},{a:sub,dr:0,cr:amt,n:micro||note}],narr:[n,micro,note].filter(Boolean).join(" · "),ref:"REG",...(cwp?{}:{f:{reg:1,micro}}),src:{label:"Daily register"}}),"Added to the register");
  ["rg-a","rg-m","rg-n"].forEach(i=>{const e=document.getElementById(i);if(e)e.value=""});J.render()});
J.act("regDel",el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again";setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent="Remove"}},4000);return}
  J.safe(()=>J.store.del("vouchers",el.dataset.x),"Register entry removed").then(()=>J.render())});
J.vReg=vReg;
const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="dups");acc.tabs.splice(i<0?acc.tabs.length:i,0,["register","Daily register",vReg])}
})();
