/* Reconcile & map (Accounts and Bills, taxes & dues): search the whole book for a name, words in a bank narration or an amount,
   choose where it belongs — Category › Sub-category (expense ledger) › Micro-category — and press Map. Every ticked entry found
   (sitting in Suspense or in any other expense ledger) is moved there in one go; the search words are saved on the micro-category
   so later statement lines with the same name are tagged by themselves. Bank / party legs of an entry are never touched. */
(()=>{
const J=window.J,{esc,fmtDate}=J;
const arr=x=>Array.isArray(x)?x:[];
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const inr=new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const title=s=>String(s||"").trim().replace(/\s+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const NEWC="__rmnew__";
const R={q:"",amt:"",scope:"susp",led:"",from:"",to:"",learn:true,cat:"",sub:"",micro:"",ncat:"",nsub:"",nmicro:"",rows:[]};
const KINDS=["expense","suspense"];
const subsOf=cat=>J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===cat).sort((a,b)=>a.name.localeCompare(b.name));
const microsOf=id=>arr(J.get("accounts",id)?.svc).filter(c=>c.active!==false);
const nowUnder=(l)=>{const a=J.get("accounts",l.a);const s=l.s?J.svcById?.(l.s)?.name:"";return {led:a?.name||"?",cat:a?.kind==="expense"?J.expCatOf(a):(a?.kind==="suspense"?"Suspense":""),micro:s||""}};
const MON=()=>J.MONEY||["cash","bank","card","wallet"];
const moneyOf=v=>{const l=v.lines.find(x=>MON().includes(J.get("accounts",x.a)?.kind));return l?l.a:""};
const subTxt=v=>norm((v.narr||"")+" "+(v.ref||"")+" "+(v.party?J.accName(v.party):"")+" "+v.lines.map(l=>(l.n||"")+" "+J.accName(l.a)).join(" "));
function find(){const w=norm(R.q).split(" ").filter(Boolean);const A=+R.amt||0;const out=[];let n=0;
  for(const v of J.D?.vs||J.all("vouchers")){if(R.from&&v.date<R.from)continue;if(R.to&&v.date>R.to)continue;
    if(R.led&&!v.lines.some(l=>l.a===R.led))continue;
    if(w.length&&!(()=>{const h=subTxt(v);return w.every(x=>h.includes(x))})())continue;
    v.lines.forEach((l,i)=>{const k=J.get("accounts",l.a)?.kind;if(!KINDS.includes(k))return;if(R.scope==="susp"&&k!=="suspense")return;if(R.scope==="mapped"&&k!=="expense")return;const am=+l.dr||+l.cr||0;if(A&&Math.abs(am-A)>0.5)return;out.push({v,i,l,am,mon:moneyOf(v)})})}
  return out.sort((x,y)=>y.v.date.localeCompare(x.v.date)).slice(0,600)}
const payeeWords=pick=>{const out=[];for(const r of pick){const n=String(r.v.narr||"");let w="";
    if(String(r.v.id).startsWith("cct-")){const d=n.replace(/^Card …\d+ · /,"").split("/");w=/^UPI/i.test(d[0])&&d[1]?d[1].trim():"";}
    else{const p=window.BankPDF?.party?.(n);w=p?(p.vpa||p.name||""):""}
    w=String(w).replace(/\s+/g," ").trim();if(w.length>=4&&!/^\d+$/.test(w.replace(/\s/g,""))&&!out.includes(w))out.push(w)}return out.slice(0,12)};
const resHtml=()=>{const L=R.rows;if(!L.length)return '<p class="muted" style="margin:8px 0">Nothing matches these filters.</p>';
  const tot=L.reduce((t,r)=>t+(r.l.dr?r.am:-r.am),0);
  return `<div class="tbl-wrap" style="max-height:52vh;overflow:auto"><table class="sheet"><thead><tr><th><input type="checkbox" id="rm-all"  aria-label="Select all" style="width:auto"></th><th>Date</th><th>Entry</th><th>Bank / card / wallet</th><th>Details</th><th>Now under</th><th>Category</th><th class="num">Dr</th><th class="num">Cr</th></tr></thead><tbody>${L.map((r,k)=>{const n=nowUnder(r.l);return `<tr><td><input type="checkbox" class="rm-p" data-k="${k}" style="width:auto" aria-label="Select"></td><td style="white-space:nowrap">${fmtDate(r.v.date)}</td><td class="mono">${esc(r.v.no||"")}</td><td style="white-space:normal">${esc(r.mon?J.accName(r.mon):"—")}</td><td style="white-space:normal">${esc(String(r.v.narr||"").slice(0,110))}</td><td style="white-space:normal">${esc(n.led)}${n.micro?'<div class="hint">'+esc(n.micro)+"</div>":""}</td><td>${esc(n.cat)}</td><td class="num">${r.l.dr?inr.format(r.am):""}</td><td class="num">${r.l.cr?inr.format(r.am):""}</td></tr>`}).join("")}</tbody></table></div><p class="hint" style="margin:6px 0 0">${L.length}${L.length>=600?"+ (narrow the filters to see the rest)":""} entries · net Dr ₹${inr.format(tot)} · tick the ones to map (the box in the header ticks all).</p>`};
const opt=(v,t,sel)=>`<option value="${esc(v)}" ${v===sel?"selected":""}>${esc(t)}</option>`;
const catSel=()=>{const cs=J.expCats();return `<option value="">Choose…</option>${cs.map(c=>opt(c,c,R.cat)).join("")}${opt(NEWC,"＋ New category (type name)",R.cat)}`};
const subSel=()=>{if(!R.cat||R.cat===NEWC)return `<option value="">${R.cat===NEWC?"—":"Choose the category first"}</option>${opt(NEWC,"＋ New sub-category (type name)",R.sub)}`;return `<option value="">Choose…</option>${subsOf(R.cat).map(a=>opt(a.id,a.name,R.sub)).join("")}${opt(NEWC,"＋ New sub-category (type name)",R.sub)}`};
const microSel=()=>{const m=R.sub&&R.sub!==NEWC?microsOf(R.sub):[];return `<option value="">— no micro-category —</option>${m.map(c=>opt(c.id,c.name,R.micro)).join("")}${opt(NEWC,"＋ New micro-category (type name)",R.micro)}`};
function vMap(){R.rows=find();
  return `<section class="panel pb"><h3 style="margin:0 0 6px">Reconcile &amp; map</h3>
  <p class="hint" style="margin:0 0 8px">Every entry of every bank, card, wallet and cash ledger is listed here. Filter (ledger, dates, name, amount, Suspense or already mapped), tick the entries, choose Category › Sub-category › Micro-category and press <b>Map ticked entries</b>. Wrong earlier mappings are corrected the same way; the bank / card leg is never changed.</p>
  <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;align-items:end">
   <label>Name / words in details (optional)<input id="rm-q" value="${esc(R.q)}" placeholder="e.g. samir naskar" autocomplete="off"></label>
   <label>Amount ₹ (optional)<input id="rm-amt" type="number" inputmode="decimal" step="any" value="${esc(R.amt)}"></label>
   <label>Show<select id="rm-scope">${opt("susp","Suspense (not mapped yet)",R.scope)}${opt("mapped","Already mapped (to correct)",R.scope)}${opt("all","Both",R.scope)}</select></label>
   <label>Bank / card / wallet<select id="rm-led"><option value="">All bank, card, wallet &amp; cash ledgers</option>${MON().flatMap(k=>J.accsOf([k]).map(a=>opt(a.id,a.name,R.led))).join("")}</select></label>
   <label>From<input id="rm-from" type="date" value="${esc(R.from)}"></label>
   <label>To<input id="rm-to" type="date" value="${esc(R.to)}"></label></div>
  <div class="row" style="margin:8px 0 0;gap:8px;align-items:center"><button class="btn w" data-a="rmAuto">Auto-map Suspense with the words already saved</button><span class="hint" id="rm-auto"></span></div>
  <div id="rm-res">${resHtml()}</div>
  <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;align-items:end;margin-top:10px">
   <label>Category<select id="rm-cat">${catSel()}</select></label>
   <label id="rm-ncat-w" style="${R.cat===NEWC?"":"display:none"}">New category name<input id="rm-ncat" value="${esc(R.ncat)}"></label>
   <label>Sub-category (ledger)<select id="rm-sub">${subSel()}</select></label>
   <label id="rm-nsub-w" style="${R.sub===NEWC?"":"display:none"}">New sub-category name<input id="rm-nsub" value="${esc(R.nsub)}"></label>
   <label>Micro-category<select id="rm-micro">${microSel()}</select></label>
   <label id="rm-nmicro-w" style="${R.micro===NEWC?"":"display:none"}">New micro-category name<input id="rm-nmicro" value="${esc(R.nmicro)}"></label></div>
  <label class="row" style="margin-top:8px;gap:6px;align-items:center"><input type="checkbox" id="rm-learn" style="width:auto" ${R.learn?"checked":""}> Remember these payees under the micro-category, so the next statement maps them by itself</label>
  <div class="row" style="margin-top:10px;gap:8px;align-items:center"><button class="btn primary w" data-a="rmApply">Map ticked entries</button><span class="hint" id="rm-note"></span></div>
  <p class="hint" style="margin:8px 0 0">The search words are saved on the micro-category, so later bank lines with the same name are tagged by themselves. Matched or frozen entries need Unlock first (Accounts → Freeze &amp; checks).</p></section>`}
const $=id=>document.getElementById(id);
const showW=()=>{[["rm-ncat-w",R.cat===NEWC],["rm-nsub-w",R.sub===NEWC],["rm-nmicro-w",R.micro===NEWC]].forEach(([i,on])=>{const e=$(i);if(e)e.style.display=on?"":"none"})};
const refreshTargets=()=>{const a=$("rm-sub"),b=$("rm-micro");if(a)a.innerHTML=subSel();if(b)b.innerHTML=microSel();showW()};
const refreshRes=()=>{R.rows=find();const b=$("rm-res");if(b)b.innerHTML=resHtml();if(R.q&&!R.nmicro){R.nmicro=title(R.q);const e=$("rm-nmicro");if(e)e.value=R.nmicro}};
document.addEventListener("input",e=>{const t=e.target;if(!t?.id?.startsWith("rm-"))return;
  if(t.id==="rm-q"){R.q=t.value;refreshRes()}else if(t.id==="rm-amt"){R.amt=t.value;refreshRes()}
  else if(t.id==="rm-ncat")R.ncat=t.value;else if(t.id==="rm-nsub")R.nsub=t.value;else if(t.id==="rm-nmicro")R.nmicro=t.value});
document.addEventListener("change",e=>{const t=e.target;if(!t?.id?.startsWith("rm-"))return;
  if(t.id==="rm-all")document.querySelectorAll(".rm-p").forEach(x=>x.checked=t.checked);
  else if(t.id==="rm-scope"){R.scope=t.value;refreshRes()}
  else if(t.id==="rm-led"){R.led=t.value;refreshRes()}else if(t.id==="rm-from"){R.from=t.value;refreshRes()}else if(t.id==="rm-to"){R.to=t.value;refreshRes()}else if(t.id==="rm-learn")R.learn=t.checked;
  else if(t.id==="rm-cat"){R.cat=t.value;R.sub="";R.micro="";refreshTargets()}
  else if(t.id==="rm-sub"){R.sub=t.value;R.micro="";refreshTargets()}
  else if(t.id==="rm-micro"){R.micro=t.value;showW()}});
J.act("rmApply",async()=>{const note=m=>{const n=$("rm-note");if(n)n.textContent=m;J.toast?.(m)};
  const pick=[...document.querySelectorAll(".rm-p")].filter(x=>x.checked).map(x=>R.rows[+x.dataset.k]).filter(Boolean);
  if(!pick.length)return note("Tick at least one entry.");
  if(!R.cat)return note("Choose the category.");
  const catName=R.cat===NEWC?title(R.ncat):R.cat;if(!catName)return note("Type the new category name.");
  if(!R.sub)return note("Choose the sub-category.");
  if(R.sub===NEWC&&!title(R.nsub))return note("Type the new sub-category name.");
  if(R.micro===NEWC&&!title(R.nmicro))return note("Type the new micro-category name.");
  const frozen=pick.filter(r=>J.lock?.isFrozen?.(r.v));if(frozen.length&&!J.lock?.open?.())return note(frozen.length+" of the ticked entries are matched or frozen. Unlock first in Accounts → Freeze & checks, then press Map again.");
  J.busy?.start("Mapping entries",pick.length);let n=0,skip=0,ledName="",microName="";
  try{
    if(R.cat===NEWC){const cs=arr(J.get("meta","cats")?.exp);const base=cs.length?cs:J.expCats();if(!base.includes(catName))await J.store.put("meta",{...(J.get("meta","cats")||{id:"cats"}),id:"cats",exp:[...base,catName]})}
    let led=R.sub;
    if(R.sub===NEWC){const nm=title(R.nsub);const ex=J.all("accounts").find(a=>a.kind==="expense"&&a.name.toLowerCase()===nm.toLowerCase());
      if(ex){led=ex.id;if(ex.cat!==catName)await J.store.patch("accounts",ex.id,{cat:catName})}
      else{led="exp-"+J.uid();await J.store.put("accounts",{id:led,name:nm,kind:"expense",cat:catName,opening:0,active:true})}}
    const A=J.get("accounts",led);ledName=A?.name||"";
    let svc=arr(A?.svc).map(c=>({...c}));let tag="";
    const addW=(c,w)=>{if(!w||/^\d*$/.test(w.replace(/\s/g,"")))return;const have=String(c.words||"").split(",").map(x=>norm(x)).filter(Boolean);if(!have.includes(norm(w))&&norm(c.name)!==norm(w))c.words=[c.words,w].filter(Boolean).join(", ")};
    if(R.micro===NEWC){const nm=title(R.nmicro);const ex=svc.find(c=>norm(c.name)===norm(nm));if(ex){tag=ex.id;addW(ex,R.q)}else{tag="svc-"+J.uid();const c={id:tag,name:nm,no:"",provider:"",words:"",active:true};addW(c,R.q);svc.push(c)}}
    else if(R.micro){tag=R.micro;const c=svc.find(x=>x.id===tag);if(c)addW(c,R.q)}
    microName=svc.find(c=>c.id===tag)?.name||"";
    if(tag&&R.learn){const c=svc.find(x=>x.id===tag);if(c)for(const w of (R.q?[R.q]:payeeWords(pick)))addW(c,w)}
    await J.store.patch("accounts",led,{svc});
    const byV=new Map();for(const r of pick)(byV.get(r.v.id)||byV.set(r.v.id,[]).get(r.v.id)).push(r.i);
    for(const [vid,idx] of byV){const v=J.get("vouchers",vid);if(!v)continue;
      try{await J.postVoucher({...v,id:v.id,lines:v.lines.map((l,i)=>{if(!idx.includes(i))return l;const m={...l,a:led};if(tag)m.s=tag;else delete m.s;return m})});n+=idx.length}catch(e){skip+=idx.length}J.busy?.tick?.()}
    // card lines are re-posted from the statements, so the mapping is kept as a card rule too (otherwise the next push would put them back)
    const cc=pick.filter(r=>String(r.v.id).startsWith("cct-"));if(cc.length&&J._cc?.mkey){const RR={...(J.get("meta","maprules")?.rules||{})};
      for(const r of cc){const d=String(r.v.narr||"").replace(/^Card …\d+ · /,"");RR[J._cc.mkey(d)]={a:led,s:tag||"",own:"biz",label:d.slice(0,50),at:Date.now()}}
      const dd={id:"maprules",kind:"maprules",rules:RR,at:Date.now()};await J.store.put("meta",dd);try{J.S.c.meta.set("maprules",dd)}catch(e){}}
  }finally{J.busy?.end?.()}
  const learnNote=R.learn&&!R.micro?" · pick a micro-category too if you want the payee remembered for next time":"";
  R.rows=[];R.q="";R.amt="";R.nmicro="";J.render();
  J.toast?.(n+" entr"+(n===1?"y":"ies")+" mapped to "+catName+" › "+ledName+(microName?" › "+microName:"")+(skip?" · "+skip+" frozen or locked, not changed":"")+learnNote)});
// Auto-map: every Suspense entry whose narration hits words already saved on a micro-category
const autoPlan=()=>{const out=[];for(const v of J.D?.vs||J.all("vouchers")){const txt=(v.narr||"")+" "+v.lines.map(l=>l.n||"").join(" ")+" "+(v.ref||"");let m=null;
    v.lines.forEach((l,i)=>{if(J.get("accounts",l.a)?.kind!=="suspense")return;m=m||J.svcMatch?.(txt);if(m&&J.get("accounts",m.a))out.push({v,i,m})})}return out};
J.act("rmAuto",async()=>{const P=autoPlan();const n=$("rm-auto");if(!P.length){if(n)n.textContent="No Suspense entry matches a saved word right now.";return J.toast?.("Nothing to auto-map")}
  const fr=P.filter(x=>J.lock?.isFrozen?.(x.v));if(fr.length&&!J.lock?.open?.())return J.toast?.(fr.length+" are matched or frozen — Unlock first (Accounts → Freeze & checks)");
  if(!R._auto||R._auto!==P.length){R._auto=P.length;if(n)n.textContent=P.length+" entries would move — press again to confirm";return J.toast?.(P.length+" entries would move — press again to confirm")}
  R._auto=0;J.busy?.start("Auto-mapping",P.length);let ok=0;try{for(const x of P){const v=J.get("vouchers",x.v.id);if(!v)continue;try{await J.postVoucher({...v,id:v.id,lines:v.lines.map((l,i)=>i===x.i?{...l,a:x.m.a,s:x.m.svc}:l)});ok++}catch(e){}J.busy?.tick?.()}}finally{J.busy?.end?.()}
  J.toast?.(ok+" Suspense entries mapped from saved words");J.render()});
let k=0;const add=()=>{let ok=0;for(const id of ["accounts","dues"]){const m=J.MODS?.find(x=>x.id===id);if(m){ok++;if(!m.tabs.some(t=>t[0]==="remap"))m.tabs.push(["remap","Reconcile & map",vMap])}}if(ok<2&&k++<60)setTimeout(add,200)};add();
})();
