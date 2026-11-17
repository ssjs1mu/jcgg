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
const NEWC="__new__";
const R={q:"",amt:"",scope:"all",cat:"",sub:"",micro:"",ncat:"",nsub:"",nmicro:"",rows:[]};
const KINDS=["expense","suspense"];
const subsOf=cat=>J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===cat).sort((a,b)=>a.name.localeCompare(b.name));
const microsOf=id=>arr(J.get("accounts",id)?.svc).filter(c=>c.active!==false);
const nowUnder=(l)=>{const a=J.get("accounts",l.a);const s=l.s?J.svcById?.(l.s)?.name:"";return {led:a?.name||"?",cat:a?.kind==="expense"?J.expCatOf(a):(a?.kind==="suspense"?"Suspense":""),micro:s||""}};
function find(){const w=norm(R.q).split(" ").filter(Boolean);const A=+R.amt||0;if(!w.length&&!A)return [];const out=[];
  for(const v of J.D?.vs||J.all("vouchers")){const head=norm((v.narr||"")+" "+(v.ref||"")+" "+(v.party?J.accName(v.party):"")+" "+v.lines.map(l=>(l.n||"")+" "+J.accName(l.a)).join(" "));if(!w.every(x=>head.includes(x)))continue;
    v.lines.forEach((l,i)=>{const k=J.get("accounts",l.a)?.kind;if(!KINDS.includes(k))return;if(R.scope==="susp"&&k!=="suspense")return;const am=+l.dr||+l.cr||0;if(A&&Math.abs(am-A)>0.5)return;out.push({v,i,l,am})})}
  return out.sort((x,y)=>y.v.date.localeCompare(x.v.date)).slice(0,300)}
const resHtml=()=>{const L=R.rows;if(!L.length)return '<p class="muted" style="margin:8px 0">Type a name, words from the bank narration, or an amount — matching Suspense and expense entries from the whole book are listed here.</p>';
  const tot=L.reduce((t,r)=>t+(r.l.dr?r.am:-r.am),0);
  return `<div class="tbl-wrap" style="max-height:48vh;overflow:auto"><table class="sheet"><thead><tr><th><input type="checkbox" id="rm-all" checked aria-label="Select all" style="width:auto"></th><th>Date</th><th>Entry</th><th>Details</th><th>Now under</th><th>Category</th><th class="num">Dr</th><th class="num">Cr</th></tr></thead><tbody>${L.map((r,k)=>{const n=nowUnder(r.l);return `<tr><td><input type="checkbox" class="rm-p" data-k="${k}" checked style="width:auto" aria-label="Select"></td><td style="white-space:nowrap">${fmtDate(r.v.date)}</td><td class="mono">${esc(r.v.no||"")}</td><td style="white-space:normal">${esc(String(r.v.narr||"").slice(0,110))}</td><td style="white-space:normal">${esc(n.led)}${n.micro?'<div class="hint">'+esc(n.micro)+"</div>":""}</td><td>${esc(n.cat)}</td><td class="num">${r.l.dr?inr.format(r.am):""}</td><td class="num">${r.l.cr?inr.format(r.am):""}</td></tr>`}).join("")}</tbody></table></div><p class="hint" style="margin:6px 0 0">${L.length}${L.length>=300?"+":""} found · net Dr ₹${inr.format(tot)} · all ticked by default — untick any that are not this name.</p>`};
const opt=(v,t,sel)=>`<option value="${esc(v)}" ${v===sel?"selected":""}>${esc(t)}</option>`;
const catSel=()=>{const cs=J.expCats();return `<option value="">Choose…</option>${cs.map(c=>opt(c,c,R.cat)).join("")}${opt(NEWC,"＋ New category (type name)",R.cat)}`};
const subSel=()=>{if(!R.cat||R.cat===NEWC)return `<option value="">${R.cat===NEWC?"—":"Choose the category first"}</option>${opt(NEWC,"＋ New sub-category (type name)",R.sub)}`;return `<option value="">Choose…</option>${subsOf(R.cat).map(a=>opt(a.id,a.name,R.sub)).join("")}${opt(NEWC,"＋ New sub-category (type name)",R.sub)}`};
const microSel=()=>{const m=R.sub&&R.sub!==NEWC?microsOf(R.sub):[];return `<option value="">— no micro-category —</option>${m.map(c=>opt(c.id,c.name,R.micro)).join("")}${opt(NEWC,"＋ New micro-category (type name)",R.micro)}`};
function vMap(){if(!R.rows.length&&(R.q||R.amt))R.rows=find();
  return `<section class="panel pb"><h3 style="margin:0 0 6px">Reconcile &amp; map</h3>
  <p class="hint" style="margin:0 0 8px">Search a name or details → choose Category, Sub-category and Micro-category → press <b>Map ticked entries</b>. Entries sitting in Suspense, or already mapped elsewhere, are corrected in every account they touch; the bank leg stays as it is.</p>
  <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;align-items:end">
   <label>Name / words in details<input id="rm-q" value="${esc(R.q)}" placeholder="e.g. samir naskar" autocomplete="off"></label>
   <label>Amount ₹ (optional)<input id="rm-amt" type="number" inputmode="decimal" step="any" value="${esc(R.amt)}"></label>
   <label>Look in<select id="rm-scope">${opt("all","Suspense + all expense ledgers",R.scope)}${opt("susp","Suspense only",R.scope)}</select></label></div>
  <div id="rm-res">${resHtml()}</div>
  <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;align-items:end;margin-top:10px">
   <label>Category<select id="rm-cat">${catSel()}</select></label>
   <label id="rm-ncat-w" style="${R.cat===NEWC?"":"display:none"}">New category name<input id="rm-ncat" value="${esc(R.ncat)}"></label>
   <label>Sub-category (ledger)<select id="rm-sub">${subSel()}</select></label>
   <label id="rm-nsub-w" style="${R.sub===NEWC?"":"display:none"}">New sub-category name<input id="rm-nsub" value="${esc(R.nsub)}"></label>
   <label>Micro-category<select id="rm-micro">${microSel()}</select></label>
   <label id="rm-nmicro-w" style="${R.micro===NEWC?"":"display:none"}">New micro-category name<input id="rm-nmicro" value="${esc(R.nmicro)}"></label></div>
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
    await J.store.patch("accounts",led,{svc});
    const byV=new Map();for(const r of pick)(byV.get(r.v.id)||byV.set(r.v.id,[]).get(r.v.id)).push(r.i);
    for(const [vid,idx] of byV){const v=J.get("vouchers",vid);if(!v)continue;
      try{await J.postVoucher({...v,id:v.id,lines:v.lines.map((l,i)=>{if(!idx.includes(i))return l;const m={...l,a:led};if(tag)m.s=tag;else delete m.s;return m})});n+=idx.length}catch(e){skip+=idx.length}J.busy?.tick?.()}
  }finally{J.busy?.end?.()}
  R.rows=[];R.q="";R.amt="";R.nmicro="";J.render();
  J.toast?.(n+" entr"+(n===1?"y":"ies")+" mapped to "+catName+" › "+ledName+(microName?" › "+microName:"")+(skip?" · "+skip+" frozen or locked, not changed":""))});
let k=0;const add=()=>{let ok=0;for(const id of ["accounts","dues"]){const m=J.MODS?.find(x=>x.id===id);if(m){ok++;if(!m.tabs.some(t=>t[0]==="remap"))m.tabs.push(["remap","Reconcile & map",vMap])}}if(ok<2&&k++<60)setTimeout(add,200)};add();
})();
