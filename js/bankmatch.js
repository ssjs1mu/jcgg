/* One payment, one entry — matching hand-made entries with bank statement lines.
   1. Entry first, statement later: the statement import recognises the entry (same bank, same amount, within 5 days,
      same person) and ticks it off instead of adding it again. If the entry was made from Cash but the money really
      went from the bank, the entry is moved onto the bank (see mod-import.js → markDups / stmtCommit).
   2. Statement first, entry later: posting a payment, advance, loan, receipt or salary payment that the imported
      statement already holds updates that bank line with your details instead of creating a second one.
   3. Accounts → Bank check lists any doubles already in the books (a statement imported twice, or an entry typed
      after its bank line) and fixes each with one tap. */
(()=>{
const J=window.J,{S,esc,inr,r2,fmtDate,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const STOP=new Set(["bank","sent","neft","imps","upi","paid","payment","salary","advance","loan","kotak","mahindra","private","limited","from","with","this","that","staff","client","capital","ledger","party","via","transfer"]);
const toks=s=>norm(s).split(" ").filter(w=>w.length>=4&&!STOP.has(w)&&!/^\d+$/.test(w));
const kindOf=a=>J.get("accounts",a)?.kind;
const isMon=a=>J.MONEY.includes(kindOf(a));
const days=(a,b)=>Math.abs((new Date(a)-new Date(b))/864e5);
const fam=a=>{const x=J.get("accounts",a);return x?.staff||a};
const famName=a=>{const x=J.get("accounts",fam(a));return x?[x.name.split(" - ")[0],...arr(x.aliases)].join(" "):""};
// money side of an entry: exactly one cash/bank/card line
function shape(lines){const L=arr(lines);const m=L.filter(l=>isMon(l.a));const o=L.filter(l=>!isMon(l.a));if(m.length!==1||!o.length)return null;const ml=m[0];return {acc:ml.a,side:+ml.cr>0?"out":"in",amt:r2(+ml.cr||+ml.dr),others:[...new Set(o.map(l=>l.a))]}}
J.bankShape=shape;
// do two entries concern the same person / head?  A = precise side (hand entry), B = the other one; txt = bank narration
function sameParty(A,B,txt){const fa=new Set(A.map(fam));if(B.some(x=>fa.has(fam(x))))return true;
  const loose=x=>kindOf(x)==="suspense";const aL=A.some(loose),bL=B.some(loose);if(!aL&&!bL)return false;if(aL&&bL)return false;
  const precise=aL?B:A,vague=aL?A:B;const want=precise.flatMap(x=>toks(famName(x)));if(!want.length)return false;
  const hay=norm([txt,...vague.map(x=>{const a=J.get("accounts",x);return a&&!a.sys?[a.name,...arr(a.aliases),a.upiName||""].join(" "):""})].join(" "));
  return want.some(w=>hay.includes(w))}
J.bankSameParty=sameParty;
J.bankTextHit=(others,txt)=>{const want=others.filter(x=>kindOf(x)!=="suspense"&&kindOf(x)!=="expense").flatMap(x=>toks(famName(x)));const h=norm(txt);return want.some(w=>h.includes(w))};
const linked=v=>!!v.bank?.from;

// ---------- 2. statement first, entry later ----------
const TW=["payment","advance","staffloan","receipt","expense","contra"];
function findTwin(spec){const sh=shape(spec.lines);if(!sh||!spec.date)return null;
  const c=J.all("vouchers").filter(v=>v.imp&&!linked(v)&&v.id!==spec.id&&days(v.date,spec.date)<=5).map(v=>({v,s:shape(v.lines)}))
    .filter(({v,s})=>s&&s.acc===sh.acc&&s.side===sh.side&&Math.abs(s.amt-sh.amt)<0.01&&sameParty(sh.others,s.others,v.narr+" "+arr(v.lines).map(l=>l.n||"").join(" ")))
    .sort((a,b)=>days(a.v.date,spec.date)-days(b.v.date,spec.date));return c[0]?.v||null}
J.findBankTwin=findTwin;
const orig=J.postVoucher;
J.postVoucher=async spec=>{
  if(!spec.id&&!spec.newId&&!spec.imp&&!spec.noTwin&&TW.includes(spec.type)){
    const t=findTwin(spec);
    if(t){const sh=shape(t.lines);const tm=arr(t.lines).find(l=>l.a===sh.acc);
      const lines=arr(spec.lines).map(l=>l.a===sh.acc&&tm?.n&&!l.n?{...l,n:tm.n}:l);
      const old=sh.others.filter(a=>kindOf(a)==="suspense"&&!J.get("accounts",a)?.sys);
      const v=await orig({...spec,id:t.id,lines,ref:spec.ref||t.ref,imp:t.imp,rec:{...(t.rec||{})},bank:{from:t.no,narr:t.narr,ref:t.ref||"",date:t.date,imp:t.imp,at:Date.now(),by:S.me?.email||""}});
      // a party ledger that was opened only for this bank line is folded into the right person
      for(const a of old){if((J.D.post?.get(a)||[]).some(p=>p.v.id!==t.id))continue;const pa=J.get("accounts",a);const to=fam(shape(lines)?.others.find(x=>kindOf(x)!=="suspense"));const tg=to&&J.get("accounts",to);
        try{if(tg&&!J.MONEY.includes(tg.kind))await J.store.patch("accounts",to,{aliases:[...new Set([...arr(tg.aliases),pa.name,...arr(pa.aliases)])].slice(-12),...(pa.banks?.length?{banks:[...arr(tg.banks),...pa.banks.filter(b=>!arr(tg.banks).some(x=>x.acNo===b.acNo))]}:{})});await J.store.patch("accounts",a,{active:false,note:"Merged into "+(tg?.name||"")+" — matched with a hand entry"})}catch(e){}}
      J._twin={no:v.no,from:t.no,at:Date.now()};setTimeout(()=>toast("Already in the bank statement ("+t.no+") — your details were added to it, nothing entered twice."),1400);return v}}
  return orig(spec)};

// ---------- 3. find doubles already in the books ----------
J.findDups=()=>{const vs=J.all("vouchers");const imp=vs.filter(v=>v.imp);const out={twice:[],pairs:[]};
  const g={};for(const v of imp){const s=shape(v.lines);if(!s)continue;(g[[s.acc,v.date,s.side,s.amt,norm(v.narr).slice(0,120)].join("|")]??=[]).push(v)}
  const extra=new Set();for(const list of Object.values(g)){const ids=new Set(list.map(v=>v.imp));if(list.length<2||ids.size<2)continue;list.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    const keep=list[0];for(const v of list.slice(1))if(v.imp!==keep.imp){extra.add(v.id);out.twice.push({keep,extra:v})}}
  const used=new Set();const man=vs.filter(v=>!v.imp&&!linked(v)).map(v=>({v,s:shape(v.lines)})).filter(x=>x.s);
  for(const i of imp){if(extra.has(i.id)||linked(i))continue;const si=shape(i.lines);if(!si)continue;const txt=i.narr+" "+arr(i.lines).map(l=>l.n||"").join(" ");
    const hit=man.filter(({v,s})=>!used.has(v.id)&&s.side===si.side&&Math.abs(s.amt-si.amt)<0.01&&days(v.date,i.date)<=5&&(s.acc===si.acc||["cash"].includes(kindOf(s.acc)))&&sameParty(s.others,si.others,txt))
      .sort((a,b)=>(a.s.acc===si.acc?0:1)-(b.s.acc===si.acc?0:1)||days(a.v.date,i.date)-days(b.v.date,i.date))[0];
    if(hit){used.add(hit.v.id);out.pairs.push({man:hit.v,bank:i,moved:hit.s.acc!==si.acc})}}
  return out};
// keep the hand entry (it carries payroll / advance links), take the bank details from the imported line, drop the copy
J.mergeBankPair=async(mid,bid)=>{const m=J.get("vouchers",mid),b=J.get("vouchers",bid);if(!m||!b)return;const sm=shape(m.lines),sb=shape(b.lines);if(!sm||!sb)return;
  const bm=arr(b.lines).find(l=>l.a===sb.acc);const lines=arr(m.lines).map(l=>l.a===sm.acc?{...l,a:sb.acc,...(bm?.n&&!l.n?{n:bm.n}:{})}:l);
  const rec={...(m.rec||{})};delete rec[sm.acc];if(b.rec?.[sb.acc])rec[sb.acc]=b.rec[sb.acc];
  await orig({...m,id:m.id,lines,rec,ref:m.ref||b.ref,imp:"",bank:{from:b.no,narr:b.narr,ref:b.ref||"",date:b.date,imp:b.imp,at:Date.now(),by:S.me?.email||"",...(sm.acc!==sb.acc?{movedFrom:sm.acc}:{})}});
  await J.store.del("vouchers",b.id)};

function vDups(){const d=J.findDups();const n=d.twice.length+d.pairs.length;
  const row=(v,acc)=>{const s=shape(v.lines);return `<button class="linkbtn vno" data-a="editv" data-x="${v.id}">${esc(v.no)}</button> · ${fmtDate(v.date)} · ${esc(J.accName(s?.acc))} · <b>${inr.format(s?.amt||0)}</b> ${s?.side==="out"?"paid to":"from"} ${esc(s?.others.map(J.accName).join(", "))}<div class="hint">${esc(v.narr||"")}</div>`};
  return `<p class="hint" style="margin-top:0">One payment should appear once. This screen finds the doubles — a statement imported twice, or a payment typed by hand that the bank statement also brought in — and fixes each with a tap. How to avoid them is explained under “How it works” below.</p>
  ${n?`<div class="row" style="gap:8px;margin-bottom:10px"><span class="chip warn">${n} double${n===1?"":"s"} found</span><button class="btn small w" data-a="dupFixAll">Fix all ${n}</button></div>`:`<div class="panel pb"><span class="chip ok">No doubles</span> <span class="muted">Every bank line is in the books once.</span></div>`}
  ${d.twice.length?`<section class="panel"><h2>Bank line imported twice (${d.twice.length})</h2><p class="hint pb" style="margin:0">The same statement line came in from two imports. The first stays, the extra copy is removed.</p><div class="tbl-wrap"><table><tbody>${d.twice.map(x=>`<tr><td>${row(x.extra)}<div class="hint">Same as ${esc(x.keep.no)}</div></td><td style="white-space:nowrap"><button class="btn small danger w" data-a="dupDel" data-x="${x.extra.id}">Remove copy</button></td></tr>`).join("")}</tbody></table></div></section>`:""}
  ${d.pairs.length?`<section class="panel"><h2>Typed by hand and also in the bank statement (${d.pairs.length})</h2><p class="hint pb" style="margin:0">Your entry stays (with its salary / advance link). The bank details — narration, UTR, cleared date — are copied onto it${d.pairs.some(p=>p.moved)?"; an entry made from Cash is moved to the bank that actually paid":""}. Then the imported copy is removed.</p><div class="tbl-wrap"><table><thead><tr><th>Your entry</th><th>Bank line</th><th></th></tr></thead><tbody>${d.pairs.map(p=>`<tr><td>${row(p.man)}</td><td>${row(p.bank)}${p.moved?`<div class="chip warn" style="margin-top:4px">entry was from ${esc(J.accName(shape(p.man.lines).acc))} — will move to ${esc(J.accName(shape(p.bank.lines).acc))}</div>`:""}</td><td style="white-space:nowrap"><button class="btn small w" data-a="dupMerge" data-x="${p.man.id}|${p.bank.id}">Merge</button></td></tr>`).join("")}</tbody></table></div></section>`:""}
  <section class="panel"><h2>How it works</h2><div class="pb" style="display:flex;flex-direction:column;gap:6px">
   <div><b>Paid first, statement later</b> — record the payment as usual (Staff advance, Payroll → Pay, Payment). When you import the statement, that line shows “matches PY/…”, is left unticked and your entry is marked cleared with the bank's narration.</div>
   <div><b>Statement first, entry later</b> — when you then record the same payment (same bank, same amount, within 5 days, same person), the app fills your details into the bank line instead of adding a new one, and says so.</div>
   <div><b>Pick the right “Paid from”</b> — choose the bank the money actually left. If you chose Cash by mistake, the import offers to move your entry to the bank.</div></div></section>`}
J.vDups=vDups;
const tap=(el,fn)=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again";setTimeout(()=>{if(el.isConnected)delete el.dataset.armed},4000);return}fn()};
J.act("dupDel",el=>tap(el,()=>J.safe(()=>J.store.del("vouchers",el.dataset.x),"Extra copy removed").then(()=>J.render())));
J.act("dupMerge",el=>tap(el,()=>{const [m,b]=el.dataset.x.split("|");J.safe(()=>J.mergeBankPair(m,b),"Merged — one entry with the bank details").then(()=>J.render())}));
J.act("dupFixAll",el=>tap(el,async()=>{el.disabled=true;const d=J.findDups();let n=0;await J.safe(async()=>{for(const x of d.twice){await J.store.del("vouchers",x.extra.id);n++}for(const p of d.pairs){await J.mergeBankPair(p.man.id,p.bank.id);n++}});toast(n+" double"+(n===1?"":"s")+" fixed");J.render()}));
const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="suspense");acc.tabs.splice(i+1,0,["dups","Bank check",vDups])}
})();
