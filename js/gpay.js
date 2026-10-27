/* Google Pay Business collections ↔ Petpooja UPI bills ↔ bank credits.
   Upload the "GPay Business Transactions" CSV (Google Pay for Business → Transactions → Export).
   1. Every UPI payment on a Petpooja bill is matched one-to-one with a Google Pay collection (same amount, same day, closest time / name).
   2. Bills still unmatched are carried forward as dues and matched later against other unmatched collections (other days, or one
      collection paying two bills / two collections paying one bill).
   3. Each Google Pay settlement batch (the day's collections less any SoundPod fee) is matched with the credit in the bank.
   4. A day is TALLIED only when all its bills and collections are matched and its settlement is seen in the bank — otherwise it is
      PENDING and shows in Reminders until the file / statement is uploaded. The uploaded CSV is kept in Drive (J.fileSave).
   Matching is computed from the saved data each time (nothing is posted except ticking the UPI line of the day's sales entry as cleared). */
(()=>{
const J=window.J,{S,esc,inr,inr0,money0,r2,fmtDate,today,addDays,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const upiAcc=()=>J.all("accounts").find(a=>a.kind==="aggregator"&&/google pay|gpay|upi settlement/i.test(a.name));
const live=o=>!/cancel|saved|void|deleted/i.test(o.status||"");
const nrm=s=>String(s||"").toLowerCase().replace(/[^a-z ]+/g," ").replace(/\s+/g," ").trim();
const tmin=t=>{const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null};
const dayDiff=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
// ---------- CSV ----------
function csv(text){const rows=[];let r=[],f="",q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===","){r.push(f);f=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;r.push(f);f="";if(r.some(x=>x!==""))rows.push(r);r=[]}else f+=c}
  if(f!==""||r.length){r.push(f);rows.push(r)}return rows}
function parseCsv(text){const R=csv(text.replace(/^﻿/,""));const h=R[0].map(x=>x.replace(/ /g," ").trim().toLowerCase());const ix=k=>h.findIndex(x=>x.startsWith(k));
  const c={who:ix("payer"),via:ix("paid via"),ty:ix("type"),at:ix("creation"),id:ix("transaction id"),amt:ix("amount"),fee:ix("processing"),net:ix("net"),st:ix("status"),up:ix("update"),note:ix("notes")};
  if(c.at<0||c.id<0||c.amt<0)throw new Error("This does not look like a Google Pay Business transactions file (Creation time / Transaction ID / Amount columns not found).");
  const out=[];for(const r of R.slice(1)){const at=(r[c.at]||"").trim();const id=(r[c.id]||"").trim();if(!id||!/^\d{4}-\d{2}-\d{2}/.test(at))continue;
    out.push({id,n:(r[c.who]||"").trim(),via:(r[c.via]||"").replace(/ /g," ").trim(),ty:(r[c.ty]||"").trim(),d:at.slice(0,10),t:at.slice(11,16),a:r2(+String(r[c.amt]).replace(/,/g,"")||0),fee:r2(+r[c.fee]||0),net:r2(+String(r[c.net]).replace(/,/g,"")||0),st:(r[c.st]||"").trim(),u:(r[c.up]||"").trim().slice(0,16),note:(r[c.note]||"").trim().slice(0,80)})}
  return out}
// ---------- storage: meta/gpay-YYYY-MM (one document per month) + meta/gpayFiles ----------
const txns=()=>J.all("meta").filter(x=>/^gpay-\d{4}-\d{2}$/.test(x.id)).flatMap(x=>arr(x.txns));
const files=()=>arr(J.get("meta","gpayFiles")?.items);
async function saveTxns(list){const by={};for(const x of list)(by[x.d.slice(0,7)]??=[]).push(x);let added=0,changed=0;
  for(const [m,xs] of Object.entries(by)){const id="gpay-"+m;const old=arr(J.get("meta",id)?.txns);const map=new Map(old.map(x=>[x.id,x]));for(const x of xs){const o=map.get(x.id);if(!o)added++;else if(JSON.stringify(o)!==JSON.stringify(x))changed++;map.set(x.id,x)}
    const d={id,txns:[...map.values()].sort((a,b)=>(a.d+a.t).localeCompare(b.d+b.t)),at:Date.now()};await J.store.put("meta",d);J.S.c.meta.set(id,d)}
  return {added,changed}}
// ---------- matching ----------
const isColl=x=>!/cashback|reward/i.test(x.ty+" "+x.via)&&x.ty!=="Daily collections"&&x.a>0;
function simName(a,b){const A=nrm(a).split(" ").filter(w=>w.length>1),B=nrm(b).split(" ").filter(w=>w.length>1);if(!A.length||!B.length)return 0;let n=0;for(const w of A)if(B.some(v=>v===w||(w.length>2&&v.length>2&&(v.startsWith(w)||w.startsWith(v)))))n++;return n/Math.max(A.length,B.length)}
let cache=null;
function run(){const T=txns();const sig=T.length+"|"+J.all("ppday").map(d=>d.id+":"+(d.at||"")+":"+d.orders.length).join(",")+"|"+(J.get("meta","gpayMan")?.at||"")+"|"+arr(J.get("meta","kotPay")?.items).map(i=>i.id+arr(i.gp).length).join()+"|"+(upiAcc()?(J.D.post?.get(upiAcc().id)||[]).length:0);if(cache&&cache.sig===sig)return cache;
  const colls=T.filter(isColl).map(x=>({...x,k:x.id,used:null}));const fees=T.filter(x=>x.ty==="Daily collections"||(x.a<0));
  const O=[];for(const d of J.all("ppday"))for(const o of d.orders){if(!live(o))continue;for(const p of o.pays)if(p.m==="upi"&&p.amt>0)O.push({k:d.id+"#"+o.no+"#"+O.length,date:d.id,no:o.no,t:o.time||"",a:r2(p.amt),n:o.name||"",ph:o.phone||"",used:null})}
  const pairs=[];const link=(o,c,how)=>{o.used=c.k;c.used=o.k;pairs.push({o,c,how})};
  // manual links the user made
  for(const [ok,ck] of Object.entries(J.get("meta","gpayMan")?.links||{})){const o=O.find(x=>x.k.split("#").slice(0,2).join("#")===ok&&!x.used),c=colls.find(x=>x.k===ck&&!x.used);if(o&&c)link(o,c,"manual")}
  // collections already matched with staff KOT payments (Staff KOT → Match payments) are reserved first
  for(const it of arr(J.get("meta","kotPay")?.items))for(const id of arr(it.gp)){const c=colls.find(x=>x.k===id&&!x.used);if(c)c.used="kot:"+it.id}
  // pass 1: same day, same amount — best time / name first
  {const cand=[];for(const o of O){if(o.used)continue;for(const c of colls){if(c.used||c.d!==o.date||Math.abs(c.a-o.a)>0.5)continue;const dt=tmin(o.t)!=null?Math.abs(tmin(o.t)-tmin(c.t)):300;cand.push({o,c,s:dt-simName(o.n,c.n)*120})}}
    cand.sort((a,b)=>a.s-b.s);for(const x of cand)if(!x.o.used&&!x.c.used)link(x.o,x.c,"day")}
  // pass 2: dues carried forward — same amount on another day (collection from the day before to two weeks after the bill), nearest first
  {const cand=[];for(const o of O){if(o.used)continue;for(const c of colls){if(c.used||Math.abs(c.a-o.a)>0.5)continue;const dd=dayDiff(o.date,c.d);if(dd<-1||dd>14)continue;cand.push({o,c,s:Math.abs(dd)*100-simName(o.n,c.n)*150})}}
    cand.sort((a,b)=>a.s-b.s);for(const x of cand)if(!x.o.used&&!x.c.used)link(x.o,x.c,"later")}
  // pass 3: one collection pays two bills of the same day, or one bill paid by two collections
  for(const c of colls){if(c.used)continue;const os=O.filter(o=>!o.used&&Math.abs(dayDiff(o.date,c.d))<=1);let hit=null;for(let i=0;i<os.length&&!hit;i++)for(let j=i+1;j<os.length&&!hit;j++)if(Math.abs(os[i].a+os[j].a-c.a)<=0.5)hit=[os[i],os[j]];
    if(hit){c.used=hit.map(o=>o.k).join("+");for(const o of hit){o.used=c.k;pairs.push({o,c,how:"split",part:true})}}}
  for(const o of O){if(o.used)continue;const cs=colls.filter(c=>!c.used&&Math.abs(dayDiff(o.date,c.d))<=1);let hit=null;for(let i=0;i<cs.length&&!hit;i++)for(let j=i+1;j<cs.length&&!hit;j++)if(Math.abs(cs[i].a+cs[j].a-o.a)<=0.5)hit=[cs[i],cs[j]];
    if(hit){o.used=hit.map(c=>c.k).join("+");for(const c of hit){c.used=o.k;pairs.push({o,c,how:"split",part:true})}}}
  // settlement batches (update date) vs bank credits in the Google Pay ledger
  const bat={};for(const x of T){if(!x.u||/cashback|reward/i.test(x.ty+x.via))continue;const k=x.u.slice(0,10);(bat[k]??=[]).push(x)}
  const B=Object.entries(bat).sort().map(([d,xs])=>({d,xs,net:r2(xs.reduce((s,x)=>s+(x.net||x.a),0)),coll:r2(xs.filter(isColl).reduce((s,x)=>s+x.a,0)),fee:r2(xs.filter(x=>!isColl(x)).reduce((s,x)=>s+x.a,0)),bank:null}));
  const acc=upiAcc();const credits=acc?(J.D.post?.get(acc.id)||[]).filter(p=>p.cr>0&&p.v.lines.some(l=>l.dr>0&&J.MONEY.includes(J.get("accounts",l.a)?.kind))).map(p=>({date:p.date,amt:r2(p.cr),no:p.v.no,vid:p.v.id,used:false})):[];
  for(const b of B){const c=credits.filter(x=>!x.used&&Math.abs(x.amt-b.net)<=1&&x.date>=addDays(b.d,-1)&&x.date<=addDays(b.d,6)).sort((p,q)=>Math.abs(dayDiff(b.d,p.date))-Math.abs(dayDiff(b.d,q.date)))[0];if(c){c.used=true;b.bank=c}}
  // weekend / holiday: one bank credit for two consecutive batches
  for(let i=0;i<B.length-1;i++){const a=B[i],b=B[i+1];if(a.bank||b.bank)continue;const s=r2(a.net+b.net);const c=credits.find(x=>!x.used&&Math.abs(x.amt-s)<=1&&x.date>=a.d&&x.date<=addDays(b.d,6));if(c){c.used=true;a.bank=c;b.bank=c}}
  const bBy={};for(const b of B)for(const x of b.xs)bBy[x.id]=b;
  // per-day status
  const lo=colls.reduce((m,c)=>c.d<m?c.d:m,"9999"),hi=colls.reduce((m,c)=>c.d>m?c.d:m,"0000");const days={};
  const D=d=>days[d]??=({d,o:[],c:[],un:[],uc:[],po:0,pc:0,state:"",why:[]});
  for(const o of O)if(o.date>=lo&&o.date<=hi){const x=D(o.date);x.o.push(o);x.po=r2(x.po+o.a);if(!o.used)x.un.push(o)}
  for(const c of colls){const x=D(c.d);x.c.push(c);x.pc=r2(x.pc+c.a);if(!c.used)x.uc.push(c)}
  for(const x of Object.values(days)){const bs=[...new Set(x.c.map(c=>bBy[c.id]).filter(Boolean))];x.batches=bs;const noBank=bs.filter(b=>!b.bank);
    if(x.un.length)x.why.push(`${x.un.length} Petpooja UPI bill${x.un.length>1?"s":""} (${money0(x.un.reduce((s,o)=>s+o.a,0))}) with no Google Pay collection yet — carried forward as dues`);
    if(x.uc.length)x.why.push(`${x.uc.length} Google Pay collection${x.uc.length>1?"s":""} (${money0(x.uc.reduce((s,c)=>s+c.a,0))}) with no Petpooja UPI bill`);
    if(!acc)x.why.push("No Google Pay ledger found for bank credits");else if(noBank.length)x.why.push(`Settlement ${noBank.map(b=>fmtDate(b.d)+" "+money0(b.net)).join(", ")} not seen as a bank credit — upload the bank statement`);
    x.state=x.why.length?"pending":"tallied"}
  cache={sig,O,colls,pairs,B,credits,days,lo,hi,fees};return cache}
J.gpay={run,txns,files,parseCsv};
// state of one date: "tallied" | "pending" | "" (no Google Pay data covers that date)
J.gpayDay=d=>{const r=run();return r.days[d]?.state||(r.colls.length&&d>r.hi&&d<=today()?"nofile":"")};
// ---------- alerts ----------
J.gpayAlerts=()=>{const r=run();const out=[];if(!r.colls.length){if(J.all("ppday").some(d=>d.orders.some(o=>o.pays.some(p=>p.m==="upi"))))out.push({sev:"warn",title:"Google Pay collections not uploaded",reason:"No Google Pay Business transaction file has been uploaded, so no UPI bill can be matched with a real collection.",fix:"Sales & Cash → Google Pay & UPI → upload the CSV (Google Pay for Business → Transactions → Export).",key:"nofile"});return out}
  const stale=J.all("ppday").filter(d=>d.id>r.hi&&d.id<=addDays(today(),-1)&&d.orders.some(o=>live(o)&&o.pays.some(p=>p.m==="upi")));
  if(stale.length)out.push({sev:"bad",title:`Google Pay file is up to ${fmtDate(r.hi)} — ${stale.length} Petpooja UPI day${stale.length>1?"s":""} not yet tallied`,reason:`UPI bills from ${fmtDate(stale[0].id)} onward have no Google Pay collections to match, so ${money0(stale.reduce((s,d)=>s+d.orders.filter(live).flatMap(o=>o.pays).filter(p=>p.m==="upi").reduce((a,p)=>a+p.amt,0),0))} of UPI is unverified.`,fix:"Export the latest Google Pay Business transactions and upload it in Sales & Cash → Google Pay & UPI.",key:"stale",amt:0});
  const pend=Object.values(r.days).filter(x=>x.state==="pending"&&x.d>=addDays(today(),-60)).sort((a,b)=>b.d.localeCompare(a.d));
  for(const x of pend.slice(0,25))out.push({sev:"warn",title:`${fmtDate(x.d)}: Google Pay not tallied (Petpooja UPI ${money0(x.po)} · collections ${money0(x.pc)})`,reason:x.why.join(". ")+".",fix:x.un.length||x.uc.length?"Open the day in Sales & Cash → Google Pay & UPI: carried-forward bills are re-tried against later collections each time a file is uploaded; if a customer paid cash / another QR, change the payment mode in Petpooja; if a collection is not a restaurant sale, leave it as 'not billed'.":"Upload the bank statement for the settlement date so the credit can be matched.",key:"d"+x.d,amt:Math.abs(x.po-x.pc)});
  return out};
// ---------- tick tallied days on the sales entry ----------
async function markTallied(){const acc=upiAcc();if(!acc||J.readOnly?.())return 0;const r=run();let n=0;for(const x of Object.values(r.days)){if(x.state!=="tallied"||!x.o.length)continue;const d=J.get("ppday",x.d);const v=d?.vid&&J.get("vouchers",d.vid);if(!v||v.rec?.[acc.id])continue;const at=x.batches.map(b=>b.bank?.date).filter(Boolean).sort().at(-1)||x.d;await J.store.patch("vouchers",v.id,{rec:{...(v.rec||{}),[acc.id]:at}});n++}return n}
// ---------- UI ----------
const ui=()=>J.ui("gpay",{month:"",f:"all"});
const chip=s=>s==="nofile"?'<span class="chip warn">Upload newer file</span>':s==="tallied"?'<span class="chip ok">Tallied</span>':s==="pending"?'<span class="chip warn">Pending</span>':'<span class="chip plain">—</span>';
J.gpayView=()=>{const U=ui();const r=run();const F=files();const months=[...new Set([...Object.keys(r.days).map(d=>d.slice(0,7)),...J.all("ppday").filter(d=>d.id>r.hi).map(d=>d.id.slice(0,7))])].sort().reverse();if(!U.month)U.month=months[0]||today().slice(0,7);
  const head=`<div class="filters"><button class="btn primary w" data-a="gpUpload">Upload Google Pay transactions (CSV)</button><button class="btn w" data-a="gpRerun">Match again</button><span class="hint">${r.colls.length?`${r.colls.length} collections · ${fmtDate(r.lo)} – ${fmtDate(r.hi)} · ${F.length} file${F.length===1?"":"s"} kept in Drive`:"Google Pay for Business → Transactions → Export CSV, then upload it here."}</span></div>`;
  if(!r.colls.length)return head+`<div class="panel pb muted">No Google Pay file uploaded yet. Once uploaded, every Petpooja UPI bill is matched with its Google Pay collection, and each day is marked Tallied or Pending.</div>`;
  // Petpooja days after the last Google Pay collection in the file: shown as waiting for a newer file
  const ext=J.all("ppday").filter(d=>d.id>r.hi&&d.id<=today()).map(d=>({d:d.id,o:d.orders.flatMap(o=>live(o)?o.pays.filter(p=>p.m==="upi"&&p.amt>0).map(p=>({a:p.amt})):[]),c:[],un:[],uc:[],batches:[],state:"nofile",why:["Google Pay file ends on "+fmtDate(r.hi)+" — upload a newer one"]})).filter(x=>x.o.length).map(x=>({...x,po:r2(x.o.reduce((s,o)=>s+o.a,0)),pc:0}));
  for(const x of ext)r.days[x.d]=x;const all=Object.values(r.days);const tal=all.filter(x=>x.state==="tallied").length,pen=all.filter(x=>x.state==="pending").length;const unO=r.O.filter(o=>!o.used&&o.date>=r.lo&&o.date<=r.hi),unC=r.colls.filter(c=>!c.used);
  const rows=all.filter(x=>x.d.startsWith(U.month)).filter(x=>U.f==="all"||x.state===U.f).sort((a,b)=>b.d.localeCompare(a.d));
  const dues=unO.slice().sort((a,b)=>a.date.localeCompare(b.date));
  return `${head}
  <div class="kpis">${J.kpi("Days tallied",tal+" of "+all.length,"all bills & collections matched, bank credited","sales/upi")}${J.kpi("Days pending",String(pen),"need a file, a bill or a payment-mode fix","sales/upi")}${J.kpi("UPI bills carried forward",String(unO.length),money0(unO.reduce((s,o)=>s+o.a,0)),"sales/upi")}${J.kpi("Collections not billed",String(unC.length),money0(unC.reduce((s,c)=>s+c.a,0)),"sales/upi")}${J.kpi("Settlements in bank",r.B.filter(b=>b.bank).length+" of "+r.B.length,money0(r.B.filter(b=>b.bank).reduce((s,b)=>s+b.net,0)),"sales/upi")}</div>
  <div class="filters"><select data-ui="gpay.month" aria-label="Month">${months.map(m=>`<option value="${m}" ${m===U.month?"selected":""}>${esc(J.monthLabel(m))}</option>`).join("")}</select><select data-ui="gpay.f" aria-label="Show">${[["all","All days"],["pending","Pending"],["tallied","Tallied"]].map(([v,l])=>`<option value="${v}" ${U.f===v?"selected":""}>${l}</option>`).join("")}</select></div>
  <section class="panel"><h2>Day by day · ${esc(J.monthLabel(U.month))}</h2><div class="tbl-wrap"><table><thead><tr><th>Day</th><th class="num">Petpooja UPI</th><th class="num">Google Pay</th><th class="num">Matched</th><th class="num">Dues c/f</th><th class="num">Not billed</th><th>Bank credit</th><th></th></tr></thead><tbody>
  ${rows.map(x=>{const m=x.o.length-x.un.length;return `<tr><td><button class="linkbtn" data-a="gpDay" data-x="${x.d}">${fmtDate(x.d)}</button></td><td class="num">${inr0.format(x.po)}<div class="hint">${x.o.length} bills</div></td><td class="num">${inr0.format(x.pc)}<div class="hint">${x.c.length} payments</div></td><td class="num">${m}</td><td class="num ${x.un.length?"bad":""}">${x.un.length?inr0.format(x.un.reduce((s,o)=>s+o.a,0))+`<div class="hint">${x.un.length} bills</div>`:""}</td><td class="num ${x.uc.length?"bad":""}">${x.uc.length?inr0.format(x.uc.reduce((s,c)=>s+c.a,0))+`<div class="hint">${x.uc.length}</div>`:""}</td><td>${x.batches.length?x.batches.map(b=>b.bank?`<span class="hint">${fmtDate(b.bank.date)} · ${inr0.format(b.net)}</span>`:`<span class="chip warn">${fmtDate(b.d)} ${inr0.format(b.net)} not in bank</span>`).join("<br>"):""}</td><td>${chip(x.state)}</td></tr>`}).join("")||'<tr><td colspan="8" class="muted">No days.</td></tr>'}</tbody></table></div></section>
  ${dues.length?`<section class="panel"><h2>UPI bills carried forward · ${dues.length} · ${money0(dues.reduce((s,o)=>s+o.a,0))}</h2><p class="hint pb" style="margin:0">Petpooja shows these as UPI but no Google Pay payment of the same amount has arrived. They are tried again against every new file. If the customer actually paid cash or another QR, correct the payment mode in Petpooja.</p><div class="tbl-wrap"><table><thead><tr><th>Bill day</th><th>Time</th><th>Bill</th><th>Customer</th><th class="num">Amount</th><th>Age</th></tr></thead><tbody>${dues.slice(0,150).map(o=>`<tr><td>${fmtDate(o.date)}</td><td>${esc(o.t)}</td><td>#${esc(o.no)}</td><td>${esc(o.n)}</td><td class="num">${inr.format(o.a)}</td><td>${J.daysBetween(o.date,today())} days</td></tr>`).join("")}</tbody></table></div></section>`:""}
  <section class="panel"><h2>Files kept</h2><div class="tbl-wrap"><table><thead><tr><th>Uploaded</th><th>File</th><th>Covers</th><th class="num">Rows</th><th>New</th></tr></thead><tbody>${F.slice().reverse().map(f=>`<tr><td>${fmtDate(f.on)}</td><td>${f.doc?.url?`<a href="${esc(f.doc.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`:esc(f.name)}</td><td>${fmtDate(f.from)} – ${fmtDate(f.to)}</td><td class="num">${f.n}</td><td>${f.added} new${f.changed?` · ${f.changed} updated`:""}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">—</td></tr>'}</tbody></table></div></section>`};
const ingest=f=>J.safe(async()=>{const list=parseCsv(await f.text());if(!list.length)throw new Error("No transactions found in this file.");
  const keep=await J.fileSave(f,"files").catch(e=>{console.warn("gpay file save",e);return null});const {added,changed}=await saveTxns(list);const ds=list.map(x=>x.d).sort();
  const it={id:J.uid(),name:f.name,on:today(),from:ds[0],to:ds.at(-1),n:list.length,added,changed,doc:keep?{id:keep.id,url:keep.url,name:keep.name,type:keep.type,driveId:keep.driveId}:null};
  const fd={id:"gpayFiles",items:[...files(),it]};await J.store.put("meta",fd);J.S.c.meta.set("gpayFiles",fd);cache=null;J.ppLogAdd?.({kind:"gpay",note:f.name,detail:`${list.length} rows ${ds[0]} – ${ds.at(-1)}: ${added} new, ${changed} changed from earlier uploads`});const n=await markTallied();
  const r=run();toast(`${list.length} rows · ${added} new · ${Object.values(r.days).filter(x=>x.state==="tallied").length} days tallied${n?" · "+n+" sales entries ticked":""}`)},"Google Pay file saved");
J.gpay.ingest=ingest;J.act("gpUpload",()=>{const i=document.createElement("input");i.type="file";i.accept=".csv,text/csv";i.onchange=()=>{const f=i.files[0];if(f)ingest(f)};i.click()});
J.act("gpRerun",async()=>{cache=null;const n=await markTallied();toast(n?n+" more days tallied":"Matched again");J.render()});
J.act("gpDay",el=>{const r=run();const x=r.days[el.dataset.x];if(!x)return;const pr=r.pairs.filter(p=>p.o.date===x.d||p.c.d===x.d);
  J.drawer({title:"Google Pay · "+fmtDate(x.d),wide:true,submit:"Close",onSubmit:()=>{},body:`<p>${chip(x.state)} Petpooja UPI <b>${inr.format(x.po)}</b> (${x.o.length} bills) · Google Pay <b>${inr.format(x.pc)}</b> (${x.c.length} payments)</p>${x.why.map(w=>`<div class="note">${esc(w)}</div>`).join("")}
  <h3>Matched bill ↔ payment</h3><div class="tbl-wrap"><table><thead><tr><th>Bill</th><th>Time</th><th>Customer</th><th class="num">Amount</th><th>Google Pay payer</th><th>Time</th><th>How</th></tr></thead><tbody>${pr.map(p=>`<tr><td>${fmtDate(p.o.date)} #${esc(p.o.no)}</td><td>${esc(p.o.t)}</td><td>${esc(p.o.n)}</td><td class="num">${inr.format(p.o.a)}</td><td>${esc(p.c.n)}${p.c.note?`<div class="hint">${esc(p.c.note)}</div>`:""}</td><td>${fmtDate(p.c.d)} ${esc(p.c.t)}</td><td>${p.how==="day"?"same day":p.how==="later"?"carried forward":p.how==="split"?"split / combined":"manual"}</td></tr>`).join("")||'<tr><td colspan="7" class="muted">None</td></tr>'}</tbody></table></div>
  ${x.un.length?`<h3>Bills with no collection (carried forward)</h3><div class="tbl-wrap"><table><tbody>${x.un.map(o=>`<tr><td>#${esc(o.no)}</td><td>${esc(o.t)}</td><td>${esc(o.n)}</td><td class="num">${inr.format(o.a)}</td></tr>`).join("")}</tbody></table></div>`:""}
  ${x.uc.length?`<h3>Collections with no Petpooja UPI bill</h3><div class="tbl-wrap"><table><tbody>${x.uc.map(c=>{const alt=arr(J.get("ppday",x.d)?.orders).filter(o=>live(o)&&o.pays.some(p=>p.m!=="upi"&&Math.abs(p.amt-c.a)<=0.5)).map(o=>`#${o.no} (${o.pays.find(p=>p.m!=="upi"&&Math.abs(p.amt-c.a)<=0.5).m}) <button class="btn small" data-a="ppEdit" data-x="${x.d}|${o.no}">Edit</button>`);return `<tr><td>${esc(c.t)}</td><td>${esc(c.n)}</td><td>${esc(c.ty)}</td><td class="num">${inr.format(c.a)}</td><td>${esc(c.note)}${alt.length?`<div class="hint">Same amount on bill ${alt.join(", ")} — probably entered with the wrong payment mode in Petpooja</div>`:""}<div style="margin-top:4px">${J.readOnly?.()?"":`<button class="btn small" data-a="ppAddBill" data-x="${x.d}|${c.a}|upi">Make a bill for this</button>`}</div></td></tr>`}).join("")}</tbody></table></div>`:""}
  ${x.batches.length?`<h3>Settlement to bank</h3><div class="tbl-wrap"><table><tbody>${x.batches.map(b=>`<tr><td>${fmtDate(b.d)}</td><td class="num">${inr.format(b.coll)} collected${b.fee?` · ${inr.format(Math.abs(b.fee))} fee`:""} = ${inr.format(b.net)}</td><td>${b.bank?`Bank ${fmtDate(b.bank.date)} ${esc(b.bank.no)}`:'<span class="chip warn">not in bank</span>'}</td></tr>`).join("")}</tbody></table></div>`:""}`})});
})();
