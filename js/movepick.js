/* Move an entry out of Suspense (or any ledger) with a two-step picker: Category → Sub-category (→ Connection),
   plus the narration, in one small form that fits any screen. */
(()=>{
const J=window.J,{S,esc,inr,money,fmtDate,toast,r2}=J;
const arr=x=>Array.isArray(x)?x:[];
const KG=[["Vendors / suppliers",["vendor"]],["Staff — salary",["staff"]],["Staff advances, loans & held salary",["staffadv","staffloan","escrow"]],["Customers & clients",["customer"]],["Income / sales",["income"]],["Owner's capital",["capital"]],["Bank, card, wallet & cash (transfer)",["bank","card","wallet","cash"]],["Settlements & UPI apps",["aggregator"]],["Loans & deposits",["loan","deprec","deppaid"]],["Assets & investments",["asset","invest","stock"]],["Duties & taxes",["tax"]]];
const cats=()=>[...J.expCats().map(c=>["x:"+c,"Expense · "+c]),...KG.map((g,i)=>["k:"+i,g[0]]),["newcat","＋ New expense category…"]];
const subsOf=cv=>{if(!cv||cv==="newcat")return [];if(cv.startsWith("x:")){const c=cv.slice(2);return J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===c).sort((a,b)=>a.name.localeCompare(b.name))}
  const g=KG[+cv.slice(2)];return J.all("accounts").filter(a=>g[1].includes(a.kind)&&a.active!==false).sort((a,b)=>a.name.localeCompare(b.name))};
const catOf=a=>{if(!a)return "";if(a.kind==="expense")return "x:"+J.expCatOf(a);const i=KG.findIndex(g=>g[1].includes(a.kind));return i<0?"":"k:"+i};
const subOpts=(cv,sel)=>cv==="newcat"?`<option value="new">＋ New sub-category (in the new category)</option>`:`<option value="">Choose…</option>${subsOf(cv).map(a=>`<option value="${a.id}" ${a.id===sel?"selected":""}>${esc(a.name)}</option>`).join("")}${cv.startsWith("x:")?`<option value="new">＋ New sub-category…</option>`:cv?`<option value="new">＋ New ledger here…</option>`:""}`;
const svcOpts=(led,sel)=>{const l=arr(J.get("accounts",led)?.svc).filter(c=>c.active!==false);return l.length?`<option value="">— none —</option>${l.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""}>${esc(c.name)}${c.no?" · "+esc(c.no):""}</option>`).join("")}`:""};
document.addEventListener("change",e=>{const t=e.target;if(t.id==="mv-cat"){const s=document.getElementById("mv-sub");if(s)s.innerHTML=subOpts(t.value,"");upd()}else if(t.id==="mv-sub")upd()});
function upd(){const cat=document.getElementById("mv-cat")?.value||"";const sub=document.getElementById("mv-sub")?.value||"";const nb=document.getElementById("mv-newbox");if(nb)nb.style.display=sub==="new"?"":"none";
  const nc=document.getElementById("mv-newcatbox");if(nc)nc.style.display=cat==="newcat"?"":"none";
  const rc=document.getElementById("mv-rencatbox"),ri=document.getElementById("f-rencat");if(rc){const x=cat.startsWith("x:");rc.style.display=x?"":"none";if(ri&&x&&ri.dataset.for!==cat){ri.value=cat.slice(2);ri.dataset.for=cat}}
  const rs=document.getElementById("mv-rensubbox"),rsi=document.getElementById("f-rensub"),acc=sub&&sub!=="new"?J.get("accounts",sub):null;if(rs){rs.style.display=acc?"":"none";if(rsi&&acc&&rsi.dataset.for!==sub){rsi.value=acc.name;rsi.dataset.for=sub}}
  const pb=document.getElementById("f-pers");if(pb&&acc&&pb.dataset.for!==sub){pb.checked=!!J.isPersonalAcc(acc);pb.dataset.for=sub}const sv=document.getElementById("mv-svc"),sb=document.getElementById("mv-svcbox");if(sv&&sb){const o=sub&&sub!=="new"?svcOpts(sub,sv.value):"";sv.innerHTML=o;sb.style.display=o?"":"none"}}
J.act("susMoveDlg",el=>{const [vid,from]=el.dataset.x.split("|");const src=J.get("accounts",from);const all=vid==="all";const posts=(J.D.post?.get(from)||[]).filter(p=>all||p.v.id===vid);if(!posts.length)return;
  const v0=posts[0].v;const txt=posts.map(p=>(p.v.narr||"")+" "+(p.n||"")).join(" ");const guess=J.svcMatch?.(txt);const gAcc=guess?J.get("accounts",guess.a):null;const cv=catOf(gAcc);
  const tot=r2(posts.reduce((s,p)=>s+p.dr-p.cr,0));
  J.drawer({title:all?`Move ${posts.length} entries · ${src?.name||""}`:`Move ${v0.no}`,submit:all?`Move ${posts.length} entries`:"Move entry",body:`
   <div class="sus-sum">${all?`<b>${esc(src?.name||"")}</b> · ${posts.length} entries · ${money(Math.abs(tot))} ${tot>=0?"Dr":"Cr"}`:`<b>${fmtDate(v0.date)}</b> · ${esc(v0.no)} · ${money(Math.abs(posts[0].dr-posts[0].cr))} ${posts[0].dr?"Dr":"Cr"}`}</div>
   <div class="form">${J.fld("Category",`<select id="mv-cat" name="cat"><option value="">Choose…</option>${cats().map(([v,l])=>`<option value="${esc(v)}" ${v===cv?"selected":""}>${esc(l)}</option>`).join("")}</select>`)}
    ${J.fld("Sub-category / ledger",`<select id="mv-sub" name="sub">${subOpts(cv,gAcc?.id||"")}</select>`)}</div>
   <div id="mv-newcatbox" style="display:none">${J.fld("New category name",J.txt("newcat","","e.g. Owner's personal"))}</div>
   <div id="mv-rencatbox" style="display:none">${J.fld("Correct the category name (optional)",J.txt("rencat",""))}</div>
   <div id="mv-newbox" style="display:none">${J.fld("New sub-category / ledger name",J.txt("newsub","","e.g. Mobile recharge — Owner"))}</div>
   <div id="mv-rensubbox" style="display:none">${J.fld("Correct the sub-category / ledger name (optional)",J.txt("rensub",""))}</div>
   <label class="row" style="gap:6px"><input type="checkbox" name="pers" id="f-pers"> Personal — hide from every JCGG login (only the Super Admin sees it)</label>
   <div id="mv-svcbox" style="${gAcc&&svcOpts(gAcc.id,"")?"":"display:none"}">${J.fld("Connection (meter / number / building)",`<select id="mv-svc" name="svc">${gAcc?svcOpts(gAcc.id,guess?.svc||""):""}</select>`)}</div>
   ${all?J.fld("Add a note to every narration (optional)",J.txt("note","")):J.fld("Narration",`<textarea name="narr" id="f-narr" rows="3">${esc(v0.narr||"")}</textarea>`)}
   ${src&&!src.sys?`<label class="row" style="gap:6px"><input type="checkbox" name="remember" checked> Remember: map ${esc(src.name)} here in future statements</label>`:""}`,
   onSubmit:async fd=>{let to=fd.sub;let cat=fd.cat;if(!cat)return "Choose the category.";if(!to)return "Choose the sub-category / ledger.";
     const taken=n=>J.allRaw("accounts").some(a=>a.name.toLowerCase()===n.toLowerCase()&&a.id!==to);
     if(cat==="newcat"){const n=String(fd.newcat||"").trim();if(!n)return "Type the new category name.";if(J.expCatsAll().some(c=>c.toLowerCase()===n.toLowerCase()))return "That category already exists.";if(!String(fd.newsub||"").trim())return "Type the first sub-category name for the new category.";
       const pc=J.personalCats();await J.saveCats({exp:[...J.expCatsAll(),n],personal:fd.pers?[...new Set([...pc,n])]:pc});cat="x:"+n}
     else if(cat.startsWith("x:")){const c=cat.slice(2),n=String(fd.rencat||"").trim();if(n&&n!==c){if(J.expCatsAll().some(x=>x.toLowerCase()===n.toLowerCase()))return "A category called “"+n+"” already exists.";
       await J.saveCats({exp:J.expCatsAll().map(x=>x===c?n:x),personal:J.personalCats().map(x=>x===c?n:x)});for(const a of J.allRaw("accounts"))if(a.kind==="expense"&&J.expCatOf(a)===c)await J.store.patch("accounts",a.id,{cat:n});cat="x:"+n}}
     if(to==="new"){const n=String(fd.newsub||"").trim();if(!n)return "Type the new sub-category / ledger name.";if(J.allRaw("accounts").some(a=>a.name.toLowerCase()===n.toLowerCase()))return "A ledger called “"+n+"” already exists — pick it from the list instead.";
       if(cat.startsWith("x:")){to=await J.ensureAcc(n,"expense");await J.store.patch("accounts",to,{cat:cat.slice(2),...(fd.pers?{personal:true}:{})})}
       else{const g=KG[+cat.slice(2)];to=await J.ensureAcc(n,g[1][0]);if(fd.pers)await J.store.patch("accounts",to,{personal:true})}}
     else{const cur=J.get("accounts",to);const rn=String(fd.rensub||"").trim();if(cur&&rn&&rn!==cur.name){if(taken(rn))return "A ledger called “"+rn+"” already exists.";await J.store.patch("accounts",to,{name:rn})}
       if(cur&&!!fd.pers!==!!cur.personal&&!(J.personalCats().includes(J.expCatOf(cur))))await J.store.patch("accounts",to,{personal:!!fd.pers})}
     if(to===from)return "That is the same ledger.";const svc=fd.svc||"";
     J.busy.start("Moving entries",posts.length,"entries");try{for(const p of posts){const v=J.get("vouchers",p.v.id);if(!v)continue;const lines=v.lines.map(l=>l.a===from?{...l,a:to,...(svc&&+l.dr>0?{s:svc}:{})}:l);const rec={...(v.rec||{})};if(rec[from]){rec[to]=rec[from];delete rec[from]}
       const narr=all?(fd.note?((v.narr||"")+" · "+fd.note).slice(0,240):v.narr):String(fd.narr??v.narr).trim();
       await J.postVoucher({...v,id:v.id,lines,party:v.party===from?to:v.party,narr,rec});J.busy.tick()}
     if(fd.remember&&src&&!src.sys)await J.rememberParty(from,to);
     if(src&&!src.sys&&!(J.D.post?.get(from)||[]).some(p=>!posts.find(x=>x.v.id===p.v.id)))await J.store.patch("accounts",from,{active:false,note:"Merged into "+J.accName(to)})}finally{J.busy.end()}
     toast((all?posts.length+" entries":"Entry")+" moved to "+J.accName(to))}});
  setTimeout(upd,30)});
})();
