/* Connections — the individual meters, phone numbers, broadband IDs, buildings… paid under one expense sub-category.
   Example: Electricity (CESC) → 5 consumer numbers; Mobile recharge → 6 phone numbers; Broadband → 3 account IDs;
   Building & society maintenance → 3 buildings.
   Each connection lives on its expense ledger (ledger.svc[]); every expense line can carry the connection (line.s).
   - Bank statement import recognises a connection from its number or keywords in the narration.
   - New entry → Expense has a "Connection" picker.
   - Reports → Bills by connection: 12 months per connection, missing months flagged.
   - Categories → Connections: add / edit / delete, and tag past entries from their narration. */
(()=>{
const J=window.J,{S,esc,inr,money0,r2,fmtDate,monthLabel,today,toast,fld,txt}=J;
const arr=x=>Array.isArray(x)?x:[];
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const digits=s=>String(s||"").replace(/\D/g,"");
const all=()=>J.all("accounts").filter(a=>a.kind==="expense").flatMap(a=>arr(a.svc).filter(c=>c.active!==false).map(c=>({...c,led:a.id,ledName:a.name})));
J.svcById=id=>{for(const a of J.all("accounts"))for(const c of arr(a.svc))if(c.id===id)return {...c,led:a.id,ledName:a.name};return null};
const keys=c=>[digits(c.no).length>=5?{d:digits(c.no)}:null,...String(c.words||"").split(",").map(w=>w.trim()).filter(w=>w.length>=3).map(w=>/^\d{5,}$/.test(w.replace(/\D/g,""))&&!/[a-z]/i.test(w)?{d:digits(w)}:{w:norm(w)})].filter(Boolean);
J.svcMatch=text=>{const t=norm(text),dg=digits(text);for(const c of all())for(const k of keys(c))if(k.d?dg.includes(k.d):(" "+t+" ").includes(" "+k.w+" ")||t.includes(k.w))return {a:c.led,by:"connection · "+c.name,svc:c.id};return null};
J.svcField=(sel,head)=>{const list=all();if(!list.length)return "";const by={};for(const c of list)(by[c.ledName]??=[]).push(c);
  return fld("Connection (meter / number / building)",`<select name="svc" id="f-svc"><option value="">— none —</option>${Object.entries(by).map(([n,cs])=>`<optgroup label="${esc(n)}">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""}>${esc(c.name)}${c.no?" · "+esc(c.no):""}</option>`).join("")}</optgroup>`).join("")}</select>`)};
// ---------- edit connections of a ledger ----------
J.act("svcEdit",el=>{const id=el.dataset.x;const a=J.get("accounts",id);if(!a)return;const list=arr(a.svc).map(c=>({...c}));const blank=()=>({id:"svc-"+J.uid(),name:"",no:"",provider:"",words:"",active:true});if(!list.length)list.push(blank(),blank());
  const rowH=(c,i)=>`<tr><td><input type="hidden" name="id${i}" value="${esc(c.id)}"><input name="n${i}" value="${esc(c.name)}" placeholder="e.g. Ground floor shop" aria-label="Name"></td><td><input name="no${i}" value="${esc(c.no)}" placeholder="consumer / phone / ID" aria-label="Number"></td><td><input name="p${i}" value="${esc(c.provider)}" placeholder="CESC, Jio, Airtel…" aria-label="Provider"></td><td><input name="w${i}" value="${esc(c.words)}" placeholder="words in bank narration" aria-label="Match words"></td><td style="text-align:center"><input type="checkbox" name="a${i}" ${c.active!==false?"checked":""} aria-label="Active"></td></tr>`;
  const draw=()=>J.drawer({title:"Connections · "+a.name,wide:true,submit:"Save connections",body:`<p class="hint" style="margin-top:0">One line per meter, phone number, broadband ID or building paid under <b>${esc(a.name)}</b>. The number (and any match words) is looked for in bank statement narrations so payments are tagged automatically. Clear the name to delete a line.</p>
    <div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Number / consumer no.</th><th>Provider</th><th>Match words (comma separated)</th><th>Active</th></tr></thead><tbody>${list.map(rowH).join("")}</tbody></table></div>
    <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn small" data-a="svcAddRow">+ Add line</button><button type="button" class="btn small" data-a="svcTagPast" data-x="${id}">Tag past entries from their narration</button></div>`,
    onSubmit:async fd=>{const out=[];for(let i=0;i<list.length;i++){const n=String(fd["n"+i]||"").trim();if(!n)continue;out.push({id:fd["id"+i]||"svc-"+J.uid(),name:n,no:String(fd["no"+i]||"").trim(),provider:String(fd["p"+i]||"").trim(),words:String(fd["w"+i]||"").trim(),active:!!fd["a"+i]})}
      const dupNo=out.filter(c=>digits(c.no).length>=5).map(c=>digits(c.no)).find((d,i,s)=>s.indexOf(d)!==i);if(dupNo)return "The number "+dupNo+" is entered twice.";
      await J.store.patch("accounts",id,{svc:out});toast(out.length+" connection"+(out.length===1?"":"s")+" saved for "+a.name)}});
  J._svcList=list;J._svcDraw=()=>{const fm=document.getElementById("drawerForm");if(fm)for(let i=0;i<list.length;i++){const g=k=>fm.elements[k+i];if(g("n")){list[i].name=g("n").value;list[i].no=g("no").value;list[i].provider=g("p").value;list[i].words=g("w").value;list[i].active=g("a").checked}}list.push(blank());draw()};draw()});
J.act("svcAddRow",()=>J._svcDraw?.());
J.act("svcTagPast",async el=>{const id=el.dataset.x;const a=J.get("accounts",id);const cs=arr(a?.svc).filter(c=>c.active!==false);if(!cs.length)return toast("Save the connections first");let n=0;
  J.busy.start("Tagging past entries · "+a.name);try{for(const p of (J.D.post?.get(id)||[])){const v=p.v;const ln=v.lines.find(l=>l.a===id&&!l.s&&+l.dr>0);if(!ln)continue;const txt=(v.narr||"")+" "+v.lines.map(l=>l.n||"").join(" ")+" "+(v.ref||"");
    const m=J.svcMatch(txt);if(!m||m.a!==id)continue;await J.postVoucher({...v,id:v.id,lines:v.lines.map(l=>l===ln?{...l,s:m.svc}:l)});n++}}finally{J.busy.end()}toast(n?n+" past entries tagged":"No untagged entries matched the numbers or words")});
// ---------- report: bills by connection ----------
J.svcReport=U=>{const fy=J.fyOf(today());const ms=J.monthsBetween(fy.start.slice(0,7),today().slice(0,7));const cs=all();
  if(!cs.length)return `<div class="panel pb"><p style="margin:0">No connections yet. Open <b>Accounts → Categories</b> and press <b>Connections</b> on a sub-category (e.g. Electricity, Mobile recharge, Broadband, Building maintenance) to list each meter, number or building.</p></div>`;
  const amt={};for(const v of J.D?.vs||[]){if(v.date<fy.start)continue;for(const l of v.lines){if(!l.s)continue;const k=l.s+"|"+v.date.slice(0,7);amt[k]=r2((amt[k]||0)+(+l.dr||0)-(+l.cr||0))}}
  const last={};for(const v of J.D?.vs||[])for(const l of v.lines)if(l.s&&+l.dr>0&&(!last[l.s]||v.date>last[l.s].d))last[l.s]={d:v.date,a:+l.dr};
  const untag={};for(const a of J.all("accounts").filter(a=>a.kind==="expense"&&arr(a.svc).length))for(const p of (J.D.post?.get(a.id)||[]))if(p.date>=fy.start&&p.dr>0&&!p.v.lines.find(l=>l.a===a.id&&l.s))untag[a.id]=(untag[a.id]||0)+1;
  const by={};for(const c of cs)(by[c.ledName]??=[]).push(c);const cur=today().slice(0,7);
  return `<p class="hint" style="margin-top:0">Each meter, number or building per month this financial year. A blank in an earlier month means no bill was paid for it then — check whether it is pending.</p>
  ${Object.entries(by).map(([ln,list])=>{const led=list[0].led;return `<section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px;flex-wrap:wrap;gap:6px"><h2 style="padding:0">${esc(ln)}</h2><div class="row" style="gap:6px">${untag[led]?`<span class="chip warn">${untag[led]} entries not tagged</span>`:""}<button class="btn small" data-a="svcEdit" data-x="${led}">Connections</button></div></div>
   <div class="tbl-wrap"><table><thead><tr><th>Connection</th>${ms.map(m=>`<th class="num">${esc(monthLabel(m))}</th>`).join("")}<th class="num">FY total</th><th>Last paid</th></tr></thead><tbody>${list.map(c=>{const tot=r2(ms.reduce((s,m)=>s+(amt[c.id+"|"+m]||0),0));return `<tr><td><b>${esc(c.name)}</b><div class="hint">${esc([c.provider,c.no].filter(Boolean).join(" · "))}</div></td>${ms.map(m=>{const v=amt[c.id+"|"+m];return `<td class="num" ${!v&&m<cur?'style="background:var(--bad-wash)" title="Nothing paid this month"':""}>${v?inr.format(v):m<cur?"—":""}</td>`}).join("")}<td class="num"><b>${inr.format(tot)}</b></td><td class="hint">${last[c.id]?fmtDate(last[c.id].d)+" · "+money0(last[c.id].a):"never"}</td></tr>`}).join("")}</tbody></table></div></section>`}).join("")}`};
})();
