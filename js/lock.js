/* Freeze & controls.
   An accounting entry becomes FROZEN once it is matched (ticked against a bank / Google Pay / aggregator statement), is dated on or
   before the "books frozen up to" date, or has been frozen by hand. A frozen entry cannot be changed, re-dated, deleted or un-matched
   without the passcode; the passcode unlocks editing for 10 minutes. Until an owner sets a passcode nothing is frozen.
   The passcode is never stored: only a salted SHA-256 hash is kept in meta/lockCfg. If the lock code itself fails the app carries on (fails open).
   Also: a health check across the books (balance, orphans, duplicates). */
(()=>{
const J=window.J,{S,esc,fmtDate,today,inr0,money0,r2,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const cfg=()=>J.get("meta","lockCfg")||{};
const on=()=>!!cfg().hash;
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const sha=async(s,salt)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+"|"+s)));
let until=0;
const open=()=>Date.now()<until;
const isFrozen=v=>{try{if(!v||!on())return false;const c=cfg();if(v.frozen)return true;if(Object.values(v.rec||{}).some(Boolean))return true;if(c.upto&&v.date&&v.date<=c.upto)return true}catch(e){console.warn("lock",e)}return false};
const why=v=>v.frozen?"frozen by hand":Object.values(v.rec||{}).some(Boolean)?"matched with a statement":"inside the frozen period";
const norm=l=>arr(l).filter(x=>x&&x.a&&(+x.dr||+x.cr)).map(x=>[x.a,r2(+x.dr||0),r2(+x.cr||0)].join("|")).sort().join(";");
J.lock={on,isFrozen,open,why,guard:(v,action)=>gate(v,action)};
// ---- passcode prompt (returns true when unlocked) ----
function ask(reason){return new Promise(res=>{const d=document.createElement("div");d.className="lock-ov";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  d.innerHTML=`<form class="lock-box"><h3>🔒 Frozen entry</h3><p>${esc(reason)}</p><label>Passcode<input type="password" autocomplete="off" id="lock-pw" aria-label="Passcode"></label><div class="err" id="lock-err" role="alert"></div><div class="row" style="gap:8px;justify-content:flex-end"><button type="button" class="btn w" data-x="no">Cancel</button><button class="btn primary w">Unlock for 10 minutes</button></div></form>`;
  document.body.appendChild(d);const f=d.querySelector("form"),pw=d.querySelector("#lock-pw");pw.focus();const end=v=>{d.remove();res(v)};
  d.querySelector('[data-x="no"]').onclick=()=>end(false);
  f.onsubmit=async e=>{e.preventDefault();try{const c=cfg();if(await sha(pw.value,c.salt)===c.hash){until=Date.now()+10*60e3;toast("Unlocked for 10 minutes");end(true)}else{d.querySelector("#lock-err").textContent="Wrong passcode.";pw.value="";pw.focus()}}catch(x){d.querySelector("#lock-err").textContent="Could not check the passcode."}}})}
async function gate(v,action){if(!isFrozen(v)||open())return;const ok=await ask(`This entry (${v.no||""} · ${fmtDate(v.date)} · ${money0(J.vAmount(v))}) is ${why(v)}. Enter the passcode to ${action}.`);if(!ok){const e=new Error("This entry is frozen ("+why(v)+") — it can be changed only with the passcode.");e.frozen=true;throw e}}
// ---- guard the store ----
const S0=J.store,put=S0.put.bind(S0),patch=S0.patch.bind(S0),del=S0.del.bind(S0);
S0.put=async(col,doc)=>{if(col==="vouchers"&&doc){let old=null;try{old=J.get("vouchers",doc.id)}catch(e){}
  if(old&&isFrozen(old)&&!open()&&(norm(old.lines)!==norm(doc.lines)||old.date!==doc.date))await gate(old,"change it")}return put(col,doc)};
S0.patch=async(col,id,p)=>{if(col==="vouchers"&&p){let old=null;try{old=J.get("vouchers",id)}catch(e){}
  if(old&&isFrozen(old)&&!open()){const unmatch=p.rec&&Object.entries(p.rec).some(([a,d])=>!d&&old.rec?.[a]);const body=(p.lines&&norm(p.lines)!==norm(old.lines))||(p.date&&p.date!==old.date)||p.frozen===false;if(unmatch||body)await gate(old,unmatch?"un-match it":"change it")}}return patch(col,id,p)};
S0.del=async(col,id)=>{if(col==="vouchers"){let old=null;try{old=J.get("vouchers",id)}catch(e){}if(old&&isFrozen(old)&&!open())await gate(old,"delete it")}return del(col,id)};
// ---- Controls tab ----
const saveCfg=async d=>{const x={...cfg(),...d,id:"lockCfg"};await J.store.put("meta",x);J.S.c.meta.set("lockCfg",x)};
J.act("lockSet",async()=>{const a=document.getElementById("lk-new")?.value||"",b=document.getElementById("lk-new2")?.value||"",cur=document.getElementById("lk-cur")?.value||"";
  if(a.length<4)return toast("Use at least 4 characters.");if(a!==b)return toast("The two passcodes are different.");
  await J.safe(async()=>{if(on()){if(await sha(cur,cfg().salt)!==cfg().hash)throw new Error("Current passcode is wrong.")}
    const salt=crypto.getRandomValues(new Uint32Array(4)).join("-");await saveCfg({salt,hash:await sha(a,salt),setBy:S.me?.email||"",setAt:Date.now()});until=0},"Passcode saved — matched entries are now frozen");J.render()});
J.act("lockUpto",async()=>{const d=document.getElementById("lk-upto")?.value||"";if(on()&&!open()&&!(await ask("Enter the passcode to change the frozen period.")))return;await J.safe(()=>saveCfg({upto:d}),d?"Books frozen up to "+fmtDate(d):"Period freeze removed");J.render()});
J.act("lockNow",()=>{until=0;toast("Locked");J.render()});
J.act("lockOpen",async()=>{if(await ask("Enter the passcode to edit frozen entries for 10 minutes."))J.render()});
J.act("lockFreezeAllMatched",()=>{});
J.act("hcFixNos",async()=>{const g={};for(const v of J.all("vouchers"))if(v.no)(g[v.no]??=[]).push(v);let n=0;await J.safe(async()=>{for(const a of Object.values(g)){if(a.length<2)continue;a.sort((x,y)=>(x.createdAt||0)-(y.createdAt||0));for(const v of a.slice(1)){await J.store.patch("vouchers",v.id,{no:J.nextVoucherNo(v.type,v.date)});n++}}},"Entry numbers fixed");J.ui("controls",{}).hc=J.healthCheck();J.render()});
J.act("hcRun",()=>{J.ui("controls",{}).hc=J.healthCheck();J.render()});
// ---- health check ----
J.healthCheck=()=>{const out=[];const V=J.all("vouchers");const A=new Map(J.all("accounts").map(a=>[a.id,a]));const add=(ok,t,remark,list,fix)=>out.push({ok,t,remark,list:list||[],fix});
  const unb=[],miss=[];let tdr=0,tcr=0;for(const v of V){let dr=0,cr=0;for(const l of v.lines||[]){dr+=+l.dr||0;cr+=+l.cr||0;if(!A.has(l.a))miss.push(v.no)}tdr+=dr;tcr+=cr;if(Math.abs(dr-cr)>0.01)unb.push(`${v.no} ${fmtDate(v.date)}`)}
  add(!unb.length,"Every entry balances (Dr = Cr)",unb.length?unb.length+" entries do not balance — open each and correct.":"All "+V.length+" entries balance; trial balance Dr "+money0(tdr)+" = Cr "+money0(tcr)+".",unb.slice(0,8));
  add(!miss.length,"No entry points to a missing ledger",miss.length?miss.length+" lines use a deleted ledger — re-create it or move the line.":"All lines point to existing ledgers.",[...new Set(miss)].slice(0,8));
  const nos={};for(const v of V)(nos[v.no]??=[]).push(v);const dn=Object.entries(nos).filter(([n,a])=>n&&a.length>1);add(!dn.length,"Entry numbers are unique",dn.length?dn.length+" numbers used twice — the later entry can be given a new number (nothing else changes).":"No repeated numbers.",dn.slice(0,8).map(([n])=>n),dn.length?["hcFixNos","Give the later entries new numbers"]:null);
  const g={};for(const v of V){if(/^(ppsale|skh|skc|salm|bill-|aggc)/.test(v.id))continue;const amt=J.vAmount(v);if(!(amt>0))continue;(g[[v.date,amt,v.party||"",v.ref||"",v.type].join("~")]??=[]).push(v)}
  const dg=Object.values(g).filter(a=>a.length>1);add(!dg.length,"No possible double entries",dg.length?dg.length+" groups of entries with the same date, amount, party and reference — check if both are real; delete the extra one.":"No look-alike entries.",dg.slice(0,8).map(a=>a.map(x=>x.no).join(" & ")+" · "+fmtDate(a[0].date)+" · "+money0(J.vAmount(a[0]))));
  const pp=J.all("ppday").filter(d=>!d.vid||!J.get("vouchers",d.vid));add(!pp.length,"Every Petpooja day is posted",pp.length?pp.length+" uploaded days have no sales entry — post them in Sales & Cash.":"All uploaded days have a sales entry.",pp.slice(0,8).map(d=>fmtDate(d.id)));
  const mv=J.all("moves").filter(m=>m.type==="purchase"&&(!m.vid||!J.get("vouchers",m.vid)));add(!mv.length,"Every purchase has an accounts entry",mv.length?mv.length+" purchases are not in Accounts.":"All purchases are in Accounts.",mv.slice(0,8).map(m=>fmtDate(m.date)+" "+(m.inv||"")));
  const nb=J.all("moves").filter(m=>m.type==="purchase"&&!((J.get("vouchers",m.vid)?.docs)||[]).length);add(!nb.length,"Every purchase has its bill saved",nb.length?nb.length+" purchases have no bill file — upload from Inventory → Purchases.":"All purchases have a bill.",nb.slice(0,8).map(m=>fmtDate(m.date)+" "+(m.inv||"")));
  const fut=V.filter(v=>v.date>today());add(!fut.length,"No entry dated in the future",fut.length?fut.length+" entries are dated after today.":"No future-dated entries.",fut.slice(0,8).map(v=>v.no));
  return out};
const chk=h=>`<div class="mis-i"><div class="row" style="gap:8px;align-items:flex-start"><span class="dot ${h.ok?"ok":"warn"}" aria-hidden="true"></span><div><b>${esc(h.t)}</b><div class="hint" style="white-space:normal">${esc(h.remark)}</div>${h.list.length?`<div class="hint mono">${h.list.map(esc).join(" · ")}</div>`:""}${h.fix?`<button class="btn small w" data-a="${h.fix[0]}">${esc(h.fix[1])}</button>`:""}</div></div></div>`;
J.lockView=()=>{const c=cfg();const V=J.all("vouchers");const m=V.filter(v=>Object.values(v.rec||{}).some(Boolean)).length;const per=c.upto?V.filter(v=>v.date<=c.upto).length:0;const U=J.ui("controls",{});
  // to match: bank / UPI / aggregator ledgers with entries not yet matched
  const toMatch=J.accsOf(["bank","card","aggregator"]).map(a=>{const un=(J.D.post?.get(a.id)||[]).filter(p=>!J.isCleared(p.v,a.id));return {a,n:un.length,dr:r2(un.reduce((s,p)=>s+p.dr,0)),cr:r2(un.reduce((s,p)=>s+p.cr,0)),old:un.reduce((x,p)=>!x||p.date<x?p.date:x,"")}}).filter(x=>x.n).sort((p,q)=>q.n-p.n);
  return `<div class="kpis">${J.kpi("Passcode",on()?"Set":"Not set",on()?(open()?"unlocked now":"locked"):"nothing is frozen yet","accounts/controls")}${J.kpi("Matched & frozen",String(on()?m:0),on()?"entries matched with a statement":"set a passcode to freeze","accounts/controls")}${J.kpi("Frozen by date",c.upto?fmtDate(c.upto):"—",c.upto?per+" entries":"no period frozen","accounts/controls")}${J.kpi("Still to match",String(toMatch.reduce((s,x)=>s+x.n,0)),toMatch.length+" ledgers","accounts/recon")}</div>
  <section class="panel"><h2>Freeze matched data</h2><div class="pb">
   <p class="hint" style="margin:0 0 8px">Once an entry is matched with a bank, Google Pay or aggregator statement it is frozen: it can't be changed, re-dated, deleted or un-matched without the passcode. You can also freeze every entry up to a date (for example after filing a month's GST).</p>
   ${on()?`<div class="row" style="gap:8px;flex-wrap:wrap">${open()?'<span class="chip warn">Unlocked — editing allowed for a few minutes</span><button class="btn w" data-a="lockNow">Lock now</button>':'<span class="chip ok">Locked</span><button class="btn w" data-a="lockOpen">Unlock to edit…</button>'}</div>
   <div class="form" style="margin-top:10px"><label>Freeze all entries up to<input type="date" id="lk-upto" value="${esc(c.upto||"")}"></label><div class="row" style="align-items:end"><button class="btn w" data-a="lockUpto">Save</button></div></div>
   <details style="margin-top:10px"><summary>Change passcode</summary><div class="form"><label>Current passcode<input type="password" id="lk-cur" autocomplete="off"></label><label>New passcode<input type="password" id="lk-new" autocomplete="off"></label><label>Repeat new passcode<input type="password" id="lk-new2" autocomplete="off"></label><div class="row" style="align-items:end"><button class="btn w" data-a="lockSet">Change passcode</button></div></div></details>`
   :`<div class="form"><label>Choose a passcode (4 or more characters)<input type="password" id="lk-new" autocomplete="off"></label><label>Repeat passcode<input type="password" id="lk-new2" autocomplete="off"></label><div class="row" style="align-items:end"><button class="btn primary w" data-a="lockSet">Set passcode &amp; start freezing</button></div></div><p class="hint">Only you should know it — it is not stored anywhere readable, and it can't be recovered, only reset by the database owner.</p>`}
  </div></section>
  <section class="panel"><h2>Still to match — what to settle</h2><div class="tbl-wrap"><table><thead><tr><th>Ledger</th><th class="num">Entries</th><th class="num">In</th><th class="num">Out</th><th>Oldest</th><th>To settle</th></tr></thead><tbody>${toMatch.map(x=>`<tr><td>${esc(x.a.name)}</td><td class="num">${x.n}</td><td class="num">${inr0.format(x.dr)}</td><td class="num">${inr0.format(x.cr)}</td><td>${fmtDate(x.old)}</td><td class="hint" style="white-space:normal">${/google pay|upi/i.test(x.a.name)?"Sales → Google Pay & UPI: upload the Google Pay CSV, then the bank statement":/settle|swiggy|zomato|eazy/i.test(x.a.name)?"Sales → Swiggy / Zomato: match the payout and book the commission":"Accounts → Reconcile: upload this account's statement and match"}</td></tr>`).join("")||'<tr><td colspan="6" class="muted">Everything is matched.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px"><h2 style="padding:0">Health check</h2><button class="btn primary w" data-a="hcRun">Run check</button></div>${U.hc?`<div class="pb">${U.hc.map(chk).join("")}</div>`:'<p class="hint pb" style="margin:0">Checks that every entry balances, nothing points to a deleted ledger, entry numbers and bills are not duplicated, and sales, purchases and bills are all posted.</p>'}</section>`};
const css=document.createElement("style");css.textContent=".lock-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999}.lock-box{background:var(--surface,#fff);color:inherit;border-radius:14px;padding:18px;max-width:380px;width:92%;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 40px rgba(0,0,0,.35)}.lock-box input{width:100%}";document.head.appendChild(css);
})();
