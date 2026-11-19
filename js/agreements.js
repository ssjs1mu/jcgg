/* Agreements — vendor, aggregator, landlord and other contracts in one place.
   • each agreement = one record (meta/agr-…): the signed PDF(s) go to Google Drive, folder JCGG Suite / Files / Agreements / <type> / <party>
   • a key-terms sheet with the same fixed rows for every agreement, so any two can be compared line by line
   • clauses listed as Binding · Tricky / hidden · Favourable · Info, with why it matters
   • “Read the PDF” scans the attached agreement and drafts the key terms and flags risky wording (auto-renewal, lock-in, penalties,
     one-sided change rights, indemnity, exclusivity, set-off, interest, jurisdiction…) — a first pass to verify against the signed copy
   • one-page PDF summary per agreement and a side-by-side comparison PDF */
(()=>{
const J=window.J,{S,esc,fmtDate,today,toast,fld,daysBetween}=J;
const arr=x=>Array.isArray(x)?x:[];
const TYPES=["Vendor / supplier","Aggregator (Swiggy, Zomato…)","Landlord / lease","Service / AMC","Payment / POS / software","Staff / employment","Franchise / brand","Loan / finance","Other"];
const STAT=["Active","Under negotiation","Expired","Terminated"];
const CLS=[["bind","Binding on us","#1d4ed8"],["trick","Tricky / hidden","#c92a2a"],["fav","In our favour","#1b8a5a"],["info","Info","#6b7280"]];
const clsOf=k=>CLS.find(c=>c[0]===k)||CLS[3];
const TERMS=[
 ["Term & exit",[["renew","Auto-renewal"],["lock","Lock-in / minimum period"],["notice","Termination notice & who can end it"],["penalty","Exit penalty / liquidated damages"]]],
 ["Money",[["fee","Commission / fee / rent"],["other","Other charges (payment, platform, ads, GST / TCS)"],["pay","Settlement / payment cycle"],["deposit","Security deposit / minimum guarantee"],["escal","Price / rent escalation"],["late","Late-payment interest"],["setoff","Set-off, deductions & chargebacks"]]],
 ["Risk & control",[["excl","Exclusivity / price parity"],["unil","Changes by the other side without our consent"],["liab","Liability cap"],["indem","Indemnity"],["nonc","Non-compete / non-solicit"],["ip","IP / brand / data rights"],["assign","Assignment / sub-contracting"],["audit","Audit & inspection rights"],["ins","Insurance we must keep"],["law","Governing law, courts / arbitration"]]]];
const ALLT=TERMS.flatMap(g=>g[1]);
const all=()=>J.all("meta").filter(m=>m.kind==="agr").sort((a,b)=>(a.party||"").localeCompare(b.party||""));
const get=id=>J.get("meta",id);
async function save(id,p){const d={...(get(id)||{}),...p,id,kind:"agr",at:Date.now()};await J.store.put("meta",d);try{J.S.c.meta.set(id,d)}catch(e){}return d}
const short=t=>String(t||"Other").replace(/\s*\(.*\)/,"").replace(/[\/]/g,"-");
J.docHosts=J.docHosts||{};
J.docHosts.agr={get:id=>get(id),patch:(id,p)=>save(id,p),folder:id=>{const a=get(id)||{};return ["Agreements",short(a.type),(a.party||"Unnamed").replace(/[\/\\]/g,"-")]}};
const U={open:"",sel:[]};
const tricky=a=>arr(a.clauses).filter(c=>c.k==="trick").length;
const exp=a=>{if(!a.till||a.status==="Terminated")return ["plain",""];const d=daysBetween(today(),a.till);return d<0?["bad","Expired "+(-d)+" d ago"]:d<=90?["warn","Ends in "+d+" d"]:["ok",""]};
const noticeBy=a=>{if(!a.till||!+a.noticeDays)return "";const d=new Date(a.till);d.setDate(d.getDate()-(+a.noticeDays));return d.toISOString().slice(0,10)};
J.agreementAlerts=()=>all().filter(a=>a.status==="Active"&&a.till).map(a=>{const nb=noticeBy(a),d=nb?daysBetween(today(),nb):null;const e=exp(a);
  if(d!==null&&d<=30&&d>=-30&&/yes|auto/i.test(a.t?.renew||""))return {lvl:d<0?"bad":"crit",text:a.party+" — auto-renews: give notice by "+fmtDate(nb)};
  if(e[0]==="bad"||e[0]==="warn")return {lvl:e[0]==="bad"?"bad":"warn",text:a.party+" agreement — "+e[1].toLowerCase()};return null}).filter(Boolean);
// ---------- list ----------
function vList(){if(U.open&&get(U.open))return vDetail(get(U.open));U.open="";
  const L=all();
  return `<div class="row" style="gap:8px;margin:0 0 10px;flex-wrap:wrap"><button class="btn primary w" data-a="agrNew">＋ New agreement</button>${L.length>1?`<button class="btn w" data-a="agrCmp">Compare agreements</button>`:""}<span class="hint">Upload the signed copy inside each agreement: it is filed to its own Google Drive folder, and its key terms, binding and tricky clauses stay here, ready to print or compare.</span></div>
  ${L.length?`<div class="tbl-wrap"><table class="sheet"><thead><tr><th>Party</th><th>Type</th><th>Status</th><th>Valid till</th><th class="num">Notice (days)</th><th>Auto-renew</th><th class="num">Files</th><th class="num">Tricky</th><th></th></tr></thead><tbody>${L.map(a=>{const e=exp(a),tr=tricky(a),nb=noticeBy(a);return `<tr><td><button class="linkbtn" data-a="agrOpen" data-x="${esc(a.id)}"><b>${esc(a.party||"(unnamed)")}</b></button><div class="hint">${esc(a.title||"")}</div></td><td>${esc(a.type||"")}</td><td>${esc(a.status||"")}</td>
   <td>${a.till?fmtDate(a.till)+(e[1]?` <span class="chip ${e[0]==="bad"?"bad":"warn"}">${esc(e[1])}</span>`:""):"—"}${nb&&a.status==="Active"?`<div class="hint">Notice by ${fmtDate(nb)}</div>`:""}</td><td class="num">${esc(a.noticeDays||"—")}</td><td>${esc(a.t?.renew?String(a.t.renew).slice(0,40):"—")}</td><td class="num">${arr(a.docs).length}</td><td class="num">${tr?`<span class="chip bad">${tr}</span>`:"—"}</td>
   <td style="white-space:nowrap"><button class="btn small" data-a="agrOpen" data-x="${esc(a.id)}">Open</button> <button class="btn small" data-a="agrPrint" data-x="${esc(a.id)}">PDF</button></td></tr>`}).join("")}</tbody></table></div>`
   :`<div class="panel"><div class="empty"><strong>No agreements yet</strong><span>Press “＋ New agreement”, choose the type and party, then attach the signed PDF.</span></div></div>`}`}
J.act("agrNew",()=>J.drawer({title:"New agreement",submit:"Create",body:`<div class="form">${fld("Party (vendor, aggregator, landlord…)",`<input name="party" placeholder="e.g. Zomato, ABC Traders" autocomplete="off">`)}${fld("Type",`<select name="type">${TYPES.map(t=>`<option>${esc(t)}</option>`).join("")}</select>`)}${fld("What it covers (optional)",`<input name="title" placeholder="e.g. Marketplace services agreement 2026">`)}</div>`,
  onSubmit:async fd=>{const p=(fd.party||"").trim();if(!p)return "Type the party name.";const id="agr-"+J.uid();await save(id,{party:p,type:fd.type,title:(fd.title||"").trim(),status:"Active",t:{},f:{},clauses:[],docs:[]});U.open=id;J.go("agreements","list");J.render()}}));
J.act("agrOpen",el=>{U.open=el.dataset.x;J.render()});
J.act("agrBack",()=>{U.open="";J.go("agreements","list")});
J.act("agrDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to delete";setTimeout(()=>{if(el.isConnected)delete el.dataset.armed},4000);return}const a=get(el.dataset.x);if(!a)return;for(const f of arr(a.docs))try{await J.fileDrop(f)}catch(e){}await J.store.del("meta",a.id);U.open="";J.render()});
// ---------- detail ----------
const ta=(k,v,rows)=>`<textarea data-ach="agrSet" data-k="${esc(k)}" rows="${rows||1}" style="width:100%;min-height:30px">${esc(v||"")}</textarea>`;
function vDetail(a){const id=a.id;
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn w" data-a="agrBack">← All agreements</button><button class="btn primary w" data-a="agrPrint" data-x="${esc(id)}">Print / PDF summary</button><button class="btn w" data-a="agrScan" data-x="${esc(id)}">Read the attached PDF</button><span id="agr-scan" class="hint"></span><span style="margin-left:auto"><button class="btn small danger" data-a="agrDel" data-x="${esc(id)}">Delete</button></span></div>
  <section class="panel pb"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">
   ${fld("Party",`<input data-ach="agrSet" data-k="party" value="${esc(a.party||"")}">`)}
   ${fld("Type",`<select data-ach="agrSet" data-k="type">${TYPES.map(t=>`<option ${t===a.type?"selected":""}>${esc(t)}</option>`).join("")}</select>`)}
   ${fld("Covers",`<input data-ach="agrSet" data-k="title" value="${esc(a.title||"")}">`)}
   ${fld("Status",`<select data-ach="agrSet" data-k="status">${STAT.map(t=>`<option ${t===a.status?"selected":""}>${t}</option>`).join("")}</select>`)}
   ${fld("Signed on",`<input type="date" data-ach="agrSet" data-k="signed" value="${esc(a.signed||"")}">`)}
   ${fld("Effective from",`<input type="date" data-ach="agrSet" data-k="from" value="${esc(a.from||"")}">`)}
   ${fld("Valid till",`<input type="date" data-ach="agrSet" data-k="till" value="${esc(a.till||"")}">`)}
   ${fld("Notice needed (days)",`<input type="number" data-ach="agrSet" data-k="noticeDays" value="${esc(a.noticeDays||"")}">`)}</div></section>
  ${J.docsPanel?J.docsPanel("agr",id,"Signed agreement, addenda, rate cards (saved to Google Drive)"):""}
  <section class="panel"><h3 class="ph">Key terms <span class="hint">same rows for every agreement · tick ⚑ to mark a term to watch · “auto” = read from the PDF, verify</span></h3><div class="tbl-wrap"><table class="sheet"><tbody>${TERMS.map(([g,rows])=>`<tr><th colspan="3">${esc(g)}</th></tr>`+rows.map(([k,l])=>`<tr><td style="width:24%"><b>${esc(l)}</b></td><td>${ta("t."+k,a.t?.[k],2)}</td><td style="width:34px;text-align:center"><input type="checkbox" title="Watch" data-ach="agrSet" data-k="f.${k}" ${a.f?.[k]?"checked":""}></td></tr>`).join("")).join("")}</tbody></table></div></section>
  <section class="panel"><h3 class="ph">Clauses <span class="hint">what binds us, and what is tricky or hidden</span> <button class="btn small w" data-a="agrClAdd" data-x="${esc(id)}">＋ Add clause</button></h3>
   ${arr(a.clauses).length?`<div class="tbl-wrap"><table class="sheet"><thead><tr><th style="width:130px">Kind</th><th style="width:90px">Clause no.</th><th>What it says</th><th>Why it matters / what to do</th><th></th></tr></thead><tbody>${arr(a.clauses).map((c,i)=>`<tr style="${c.k==="trick"?"background:rgba(201,42,42,.07)":""}"><td><select data-ach="agrSet" data-k="c.${i}.k" style="color:${clsOf(c.k)[2]};font-weight:600">${CLS.map(x=>`<option value="${x[0]}" ${x[0]===c.k?"selected":""}>${x[1]}</option>`).join("")}</select>${c.auto?`<div class="hint">auto</div>`:""}</td><td><input data-ach="agrSet" data-k="c.${i}.ref" value="${esc(c.ref||"")}"></td><td>${ta("c."+i+".text",c.text,3)}</td><td>${ta("c."+i+".why",c.why,3)}</td><td><button class="btn small danger" data-a="agrClDel" data-x="${esc(id)}|${i}">✕</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="hint pb">No clauses yet — press “Read the attached PDF” after attaching the signed copy, or add them by hand.</p>`}</section>`}
J.act("agrSet",async el=>{const a=get(U.open);if(!a)return;const k=el.dataset.k;const v=el.type==="checkbox"?el.checked:el.value;let p={};
  if(k.startsWith("t."))p={t:{...(a.t||{}),[k.slice(2)]:v}};else if(k.startsWith("f."))p={f:{...(a.f||{}),[k.slice(2)]:v}};
  else if(k.startsWith("c.")){const [,i,f]=k.split(".");const c=arr(a.clauses).map((x,j)=>j===+i?{...x,[f]:v,auto:f==="k"||f==="text"||f==="why"?false:x.auto}:x);p={clauses:c}}
  else p={[k]:v};await save(a.id,p);if(k==="party"||k==="type"||k.endsWith(".k"))J.render()});
J.act("agrClAdd",async el=>{const a=get(el.dataset.x);await save(a.id,{clauses:[...arr(a.clauses),{k:"bind",ref:"",text:"",why:""}]});J.render()});
J.act("agrClDel",async el=>{const [id,i]=el.dataset.x.split("|");const a=get(id);await save(id,{clauses:arr(a.clauses).filter((_,j)=>j!==+i)});J.render()});
// ---------- read the PDF ----------
const RULES=[
 {t:"renew",k:"trick",re:/auto(?:matically)?[\s-]*renew|renew(?:ed|s)?\s+automatically|deemed\s+(?:to\s+be\s+)?renewed|successive\s+(?:terms|periods)/i,why:"Rolls into another term unless notice is given in time — diarise the notice date."},
 {t:"lock",k:"trick",re:/lock[\s-]?in|minimum\s+(?:term|period|commitment|guarantee)/i,why:"We cannot exit before this period without paying."},
 {t:"notice",k:"bind",re:/terminat[^.]{0,160}(?:\d+\s*\(?\d*\)?\s*(?:days|months)|without\s+cause|for\s+convenience|sole\s+discretion|at\s+any\s+time)/i,why:"Check who can end the agreement, with how much notice, and whether it is the same for both sides."},
 {t:"penalty",k:"trick",re:/liquidated\s+damages|penalt(?:y|ies)|forfeit|early\s+termination\s+(?:fee|charge)|termination\s+(?:fee|charge)/i,why:"Money payable if we breach or leave early."},
 {t:"unil",k:"trick",re:/sole\s+(?:and\s+absolute\s+)?discretion|(?:modify|amend|revise|change|vary)[^.]{0,90}(?:at\s+any\s+time|without\s+(?:prior\s+)?(?:notice|consent))|unilateral/i,why:"One-sided right: terms, rates or policies can change without our consent."},
 {t:"indem",k:"trick",re:/indemnif|hold\s+harmless/i,why:"We may have to pay the other side's losses and claims."},
 {t:"liab",k:"trick",re:/limitation\s+of\s+liability|liability\s+shall\s+not\s+exceed|aggregate\s+liability|shall\s+not\s+be\s+liable|no\s+liability/i,why:"Check whose liability is capped — often only the other side's."},
 {t:"excl",k:"trick",re:/exclusiv|price\s+parity|most\s+favou?red|not\s+(?:to\s+)?(?:offer|list|sell)[^.]{0,80}(?:lower|other\s+(?:platform|channel)|competitor)/i,why:"Restricts where or at what price we can sell."},
 {t:"setoff",k:"trick",re:/set[\s-]?off|deduct[^.]{0,100}(?:payout|payment|settlement|amount)|withhold|hold\s+back|charge[\s-]?back/i,why:"Amounts can be deducted from what we are owed."},
 {t:"late",k:"bind",re:/interest\s+(?:at|@|of)[^.]{0,50}%|late\s+(?:payment\s+)?(?:fee|charge)/i,why:"Cost of paying late."},
 {t:"fee",k:"bind",re:/(?:commission|service\s+fee|platform\s+fee|convenience\s+fee|royalt\w+|revenue\s+share|licen[sc]e\s+fee|rent)[^.]{0,140}?\d+(?:\.\d+)?\s*%/i,why:"Headline rate — also check which amount it is charged on (with or without GST, before or after discounts)."},
 {t:"pay",k:"bind",re:/(?:settle|payout|payment)[^.]{0,100}(?:T\s*\+\s*\d+|within\s+\d+\s*(?:business\s+|working\s+)?days|weekly|fortnightly|monthly)/i,why:"When money reaches us."},
 {t:"deposit",k:"bind",re:/security\s+deposit|refundable\s+deposit|advance\s+deposit/i,why:"Money held by the other side — check when and how it is returned."},
 {t:"escal",k:"trick",re:/escalat\w+|increase[^.]{0,60}\d+(?:\.\d+)?\s*%|enhancement\s+of/i,why:"Rates or rent rise on their own."},
 {t:"nonc",k:"trick",re:/non[\s-]?compet|non[\s-]?solicit|restraint\s+of\s+trade/i,why:"Limits what we or our staff may do afterwards."},
 {t:"ip",k:"trick",re:/perpetual|irrevocabl|royalty[\s-]free|licen[sc]e\s+to\s+use\s+(?:your|the)\s+(?:brand|logo|name|content|data)/i,why:"Permanent or free rights over our brand, photos or data."},
 {t:"assign",k:"info",re:/assign(?:ment)?\s+(?:of|its|this)|sub[\s-]?contract|novat/i,why:"Whether either side can hand the agreement to someone else."},
 {t:"audit",k:"info",re:/audit|inspect(?:ion)?\s+rights|right\s+to\s+inspect/i,why:"Who may inspect books, premises or data."},
 {t:"ins",k:"bind",re:/(?:maintain|keep|obtain)[^.]{0,60}insurance|insurance\s+(?:cover|policy)/i,why:"Insurance we must keep in force."},
 {t:"law",k:"bind",re:/jurisdiction|governed\s+by[^.]{0,60}laws?|arbitrat\w+|seat\s+of|courts?\s+(?:at|in|of)\s+[A-Z]/i,why:"Where disputes are decided — a far-away court or arbitrator costs money."},
 {t:"",k:"trick",re:/deemed\s+(?:to\s+(?:be\s+)?)?(?:received|accepted|served|approved)|silence\s+shall|failure\s+to\s+(?:object|respond)[^.]{0,60}(?:accept|agree)/i,why:"Silence counts as acceptance — object in writing within the stated days."},
 {t:"",k:"trick",re:/surviv(?:e|al)[^.]{0,40}termination/i,why:"Duties continue after the agreement ends."}];
async function pdfPlain(blob){const lib=await J.loadPdfJs();const pdf=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false}).promise;let out="";
  for(let p=1;p<=pdf.numPages;p++){const tc=await (await pdf.getPage(p)).getTextContent();let y=null;for(const it of tc.items){if(!it.str)continue;const yy=Math.round(it.transform[5]);if(y!==null&&Math.abs(yy-y)>3)out+="\n";else if(out&&!/\s$/.test(out))out+=" ";out+=it.str;y=yy}out+="\n\n"}
  return out.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n")}
function sentenceAt(T,i){let s=i,e=i;const stop=/[.;]\s+(?=[A-Z(0-9])|\n\n/g;let m,last=0;while((m=stop.exec(T))){if(m.index+m[0].length<=i)last=m.index+m[0].length;else{e=m.index+1;break}}s=last;if(e<=i)e=Math.min(T.length,i+300);
  return T.slice(s,e).replace(/\s+/g," ").trim().slice(0,460)}
const refOf=(T,i)=>{const h=T.slice(Math.max(0,i-500),i);const m=[...h.matchAll(/(?:^|\n)\s*((?:clause\s+)?\d+(?:\.\d+)*\.?)\s+[A-Z]/gi)].pop();return m?m[1].replace(/^clause\s+/i,"").replace(/\.$/,""):""};
J.agreementAnalyze=T=>{const terms={},clauses=[],seen=new Set();
  for(const r of RULES){const re=new RegExp(r.re.source,r.re.flags.includes("g")?r.re.flags:r.re.flags+"g");let m,n=0;while((m=re.exec(T))&&n<3){const s=sentenceAt(T,m.index);const key=s.slice(0,60);if(seen.has(key)){continue}seen.add(key);n++;
    if(r.t&&!terms[r.t])terms[r.t]="(auto) "+s.slice(0,300);clauses.push({k:r.k,ref:refOf(T,m.index),text:s,why:r.why,auto:true})}}
  return {terms,clauses:clauses.slice(0,45)}};
J.act("agrScan",async el=>{const a=get(el.dataset.x);const st=document.getElementById("agr-scan");const say=t=>{if(st)st.textContent=t};
  const pdfs=arr(a.docs).filter(f=>/pdf/i.test(f.type||f.name));if(!pdfs.length)return say("Attach the signed PDF first.");say("Reading…");
  try{let T="";for(const f of pdfs){const b=await J.fileBlob(f);T+=await pdfPlain(b)+"\n\n"}
    if(T.replace(/\s/g,"").length<300)return say("This PDF is a scan (picture) — text can't be read here. Send it in chat and I'll read and fill the terms and clauses.");
    const r=J.agreementAnalyze(T);const t={...(a.t||{})};let nt=0;for(const k in r.terms)if(!String(t[k]||"").trim()){t[k]=r.terms[k];nt++}
    const have=new Set(arr(a.clauses).map(c=>String(c.text||"").slice(0,60)));const add=r.clauses.filter(c=>!have.has(c.text.slice(0,60)));
    await save(a.id,{t,clauses:[...arr(a.clauses),...add],scannedAt:Date.now()});say(nt+" terms and "+add.length+" clauses drafted from the PDF — verify them against the signed copy.");J.render()}
  catch(e){say(e.message||"Could not read the PDF")}});
// ---------- print ----------
const R="color:#c92a2a",tbl="width:100%;border-collapse:collapse";
const filled=a=>ALLT.filter(([k])=>String(a.t?.[k]||"").trim());
function sumHtml(a){const cl=k=>arr(a.clauses).filter(c=>c.k===k);const nb=noticeBy(a);
  const ct=(L,col)=>L.length?`<table><thead><tr><th style="width:60px">Clause</th><th>What it says</th><th>Why it matters</th></tr></thead><tbody>${L.map(c=>`<tr><td>${esc(c.ref||"")}</td><td>${esc(c.text||"")}</td><td style="${col==="r"?R:""}">${esc(c.why||"")}</td></tr>`).join("")}</tbody></table>`:`<p class="muted">None recorded.</p>`;
  return `<h1>${esc(a.party)} — agreement summary</h1><p class="sub">${esc(a.type||"")}${a.title?" · "+esc(a.title):""} · ${esc(a.status||"")}</p>
  <table><tbody><tr><th>Signed</th><td>${a.signed?fmtDate(a.signed):"—"}</td><th>Effective</th><td>${a.from?fmtDate(a.from):"—"}</td><th>Valid till</th><td>${a.till?fmtDate(a.till):"—"}</td><th>Notice</th><td>${esc(a.noticeDays?a.noticeDays+" days":"—")}${nb?" · by "+fmtDate(nb):""}</td></tr></tbody></table>
  <h2>Key terms</h2><table><tbody>${TERMS.map(([g,rows])=>{const L=rows.filter(([k])=>String(a.t?.[k]||"").trim());return L.length?`<tr><th colspan="2">${esc(g)}</th></tr>`+L.map(([k,l])=>`<tr><td style="width:27%"><b>${a.f?.[k]?"⚑ ":""}${esc(l)}</b></td><td style="${a.f?.[k]?R:""}">${esc(String(a.t[k]).replace(/^\(auto\)\s*/,""))}</td></tr>`).join(""):""}).join("")||`<tr><td class="muted">No terms recorded.</td></tr>`}</tbody></table>
  <h2 style="${R}">⚠ Tricky / hidden clauses (${cl("trick").length})</h2>${ct(cl("trick"),"r")}<h2>Binding on us (${cl("bind").length})</h2>${ct(cl("bind"))}${cl("fav").length?`<h2>In our favour</h2>${ct(cl("fav"))}`:""}${cl("info").length?`<h2>Other</h2>${ct(cl("info"))}`:""}
  <p class="muted">Summary prepared from ${arr(a.docs).map(d=>esc(d.name)).join(", ")||"the agreement"}${a.scannedAt?" (auto-read, then reviewed)":""}. It is a working aid, not legal advice — the signed agreement prevails.</p>`}
J.act("agrPrint",el=>{const a=get(el.dataset.x);if(a)J.printDoc("Agreement summary — "+a.party,sumHtml(a))});
// ---------- compare ----------
J.act("agrCmp",()=>{U.open="";J.go("agreements","cmp")});
J.act("agrPick",el=>{const id=el.dataset.x;U.sel=el.checked?[...new Set([...U.sel,id])].slice(0,4):U.sel.filter(x=>x!==id);J.render()});
const cmpRows=L=>{const rows=[["Type",a=>a.type],["Status",a=>a.status],["Valid till",a=>a.till?fmtDate(a.till):""],["Notice (days)",a=>a.noticeDays]];
  const t=ALLT.filter(([k])=>L.some(a=>String(a.t?.[k]||"").trim())).map(([k,l])=>[l,a=>String(a.t?.[k]||"").replace(/^\(auto\)\s*/,""),k]);return rows.concat(t)};
function cmpTable(L,print){const rows=cmpRows(L);
  const cell=(a,r,diff)=>{const v=r[1](a)||"";const fl=r[2]&&a.f?.[r[2]];return `<td style="${diff?"background:rgba(240,140,0,.13);":""}${fl?R:""}">${v?esc(v):`<span class="muted">—</span>`}</td>`};
  return `<table class="sheet"><thead><tr><th style="width:22%">Term</th>${L.map(a=>`<th>${esc(a.party)}<div class="muted" style="font-weight:400">${esc(short(a.type))}</div></th>`).join("")}</tr></thead><tbody>${rows.map(r=>{const vs=L.map(a=>String(r[1](a)||"").trim().toLowerCase());const diff=new Set(vs).size>1;return `<tr><td><b>${esc(r[0])}</b></td>${L.map(a=>cell(a,r,diff)).join("")}</tr>`}).join("")}
   <tr><td><b style="${R}">Tricky / hidden clauses</b></td>${L.map(a=>`<td>${arr(a.clauses).filter(c=>c.k==="trick").map(c=>`<div style="margin-bottom:4px"><b>${esc(c.ref||"")}</b> ${esc((c.text||"").slice(0,print?170:140))}${(c.text||"").length>(print?170:140)?"…":""}</div>`).join("")||`<span class="muted">—</span>`}</td>`).join("")}</tr></tbody></table>`}
function vCompare(){const L=all();const sel=L.filter(a=>U.sel.includes(a.id));
  return `<div class="row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap"><button class="btn w" data-a="agrBack">← All agreements</button>${sel.length>1?`<button class="btn primary w" data-a="agrCmpPrint">Print / PDF comparison</button>`:""}<span class="hint">Tick two to four agreements (best of the same type). Rows that differ are shaded; ⚑ = marked to watch.</span></div>
  <section class="panel pb"><div class="row" style="gap:14px;flex-wrap:wrap">${L.map(a=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-ach="agrPick" data-x="${esc(a.id)}" ${U.sel.includes(a.id)?"checked":""} style="width:auto"> ${esc(a.party)} <span class="hint">${esc(short(a.type))}</span></label>`).join("")}</div></section>
  ${sel.length>1?`<div class="tbl-wrap">${cmpTable(sel)}</div>`:`<p class="hint">Tick at least two agreements.</p>`}`}
J.act("agrCmpPrint",()=>{const sel=all().filter(a=>U.sel.includes(a.id));if(sel.length<2)return;J.printDoc("Agreement comparison",`<h1>Agreement comparison</h1><p class="sub">${sel.map(a=>esc(a.party)).join(" · ")}</p>${cmpTable(sel,true)}<p class="muted">Shaded rows differ between the agreements; ⚑ = term marked to watch. Working aid, not legal advice.</p>`,true)});
J.mod({id:"agreements",label:"Agreements",group:"Governance",icon:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',sub:"Vendor, aggregator and landlord agreements: signed copies on Drive, key terms, binding and tricky clauses, printable summaries and side-by-side comparison.",tabs:[["list","Agreements",vList],["cmp","Compare",vCompare]]});
})();
