/* Move an entry out of Suspense (or any ledger) with a two-step picker: Category → Sub-category (→ Connection),
   plus the narration, in one small form that fits any screen. */
(()=>{
const J=window.J,{S,esc,inr,money,fmtDate,toast,r2}=J;
const arr=x=>Array.isArray(x)?x:[];
const KG=[["Vendors / suppliers",["vendor"]],["Staff — salary",["staff"]],["Staff advances, loans & held salary",["staffadv","staffloan","escrow"]],["Customers & clients",["customer"]],["Income / sales",["income"]],["Owner's capital",["capital"]],["Bank, card, wallet & cash (transfer)",["bank","card","wallet","cash"]],["Settlements & UPI apps",["aggregator"]],["Loans & deposits",["loan","deprec","deppaid"]],["Assets & investments",["asset","invest","stock"]],["Duties & taxes",["tax"]]];
const cats=()=>[...J.expCats().map(c=>["x:"+c,"Expense · "+c]),...KG.map((g,i)=>["k:"+i,g[0]])];
const subsOf=cv=>{if(!cv)return [];if(cv.startsWith("x:")){const c=cv.slice(2);return J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===c).sort((a,b)=>a.name.localeCompare(b.name))}
  const g=KG[+cv.slice(2)];return J.all("accounts").filter(a=>g[1].includes(a.kind)&&a.active!==false).sort((a,b)=>a.name.localeCompare(b.name))};
const catOf=a=>{if(!a)return "";if(a.kind==="expense")return "x:"+J.expCatOf(a);const i=KG.findIndex(g=>g[1].includes(a.kind));return i<0?"":"k:"+i};
const subOpts=(cv,sel)=>`<option value="">Choose…</option>${subsOf(cv).map(a=>`<option value="${a.id}" ${a.id===sel?"selected":""}>${esc(a.name)}</option>`).join("")}${cv.startsWith("x:")?`<option value="new">＋ New sub-category…</option>`:""}`;
const svcOpts=(led,sel)=>{const l=arr(J.get("accounts",led)?.svc).filter(c=>c.active!==false);return l.length?`<option value="">— none —</option>${l.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""}>${esc(c.name)}${c.no?" · "+esc(c.no):""}</option>`).join("")}`:""};
document.addEventListener("change",e=>{const t=e.target;if(t.id==="mv-cat"){const s=document.getElementById("mv-sub");if(s)s.innerHTML=subOpts(t.value,"");upd()}else if(t.id==="mv-sub")upd()});
function upd(){const sub=document.getElementById("mv-sub")?.value||"";const nb=document.getElementById("mv-newbox");if(nb)nb.style.display=sub==="new"?"":"none";const sv=document.getElementById("mv-svc"),sb=document.getElementById("mv-svcbox");if(sv&&sb){const o=sub&&sub!=="new"?svcOpts(sub,sv.value):"";sv.innerHTML=o;sb.style.display=o?"":"none"}}
J.act("susMoveDlg",el=>{const [vid,from]=el.dataset.x.split("|");const src=J.get("accounts",from);const all=vid==="all";const posts=(J.D.post?.get(from)||[]).filter(p=>all||p.v.id===vid);if(!posts.length)return;
  const v0=posts[0].v;const txt=posts.map(p=>(p.v.narr||"")+" "+(p.n||"")).join(" ");const guess=J.svcMatch?.(txt);const gAcc=guess?J.get("accounts",guess.a):null;const cv=catOf(gAcc);
  const tot=r2(posts.reduce((s,p)=>s+p.dr-p.cr,0));
  J.drawer({title:all?`Move ${posts.length} entries · ${src?.name||""}`:`Move ${v0.no}`,submit:all?`Move ${posts.length} entries`:"Move entry",body:`
   <div class="sus-sum">${all?`<b>${esc(src?.name||"")}</b> · ${posts.length} entries · ${money(Math.abs(tot))} ${tot>=0?"Dr":"Cr"}`:`<b>${fmtDate(v0.date)}</b> · ${esc(v0.no)} · ${money(Math.abs(posts[0].dr-posts[0].cr))} ${posts[0].dr?"Dr":"Cr"}`}</div>
   <div class="form">${J.fld("Category",`<select id="mv-cat" name="cat"><option value="">Choose…</option>${cats().map(([v,l])=>`<option value="${esc(v)}" ${v===cv?"selected":""}>${esc(l)}</option>`).join("")}</select>`)}
    ${J.fld("Sub-category / ledger",`<select id="mv-sub" name="sub">${subOpts(cv,gAcc?.id||"")}</select>`)}</div>
   <div id="mv-newbox" style="display:none">${J.fld("New sub-category name",J.txt("newsub","","e.g. Mobile recharge — Owner"))}</div>
   <div id="mv-svcbox" style="${gAcc&&svcOpts(gAcc.id,"")?"":"display:none"}">${J.fld("Connection (meter / number / building)",`<select id="mv-svc" name="svc">${gAcc?svcOpts(gAcc.id,guess?.svc||""):""}</select>`)}</div>
   ${all?J.fld("Add a note to every narration (optional)",J.txt("note","")):J.fld("Narration",`<textarea name="narr" id="f-narr" rows="3">${esc(v0.narr||"")}</textarea>`)}
   ${src&&!src.sys?`<label class="row" style="gap:6px"><input type="checkbox" name="remember" checked> Remember: map ${esc(src.name)} here in future statements</label>`:""}`,
   onSubmit:async fd=>{let to=fd.sub;if(!fd.cat)return "Choose the category.";if(!to)return "Choose the sub-category / ledger.";
     if(to==="new"){const n=String(fd.newsub||"").trim();if(!n)return "Type the new sub-category name.";if(!fd.cat.startsWith("x:"))return "New sub-categories are for expense categories.";to=await J.ensureAcc(n,"expense");await J.store.patch("accounts",to,{cat:fd.cat.slice(2)})}
     if(to===from)return "That is the same ledger.";const svc=fd.svc||"";
     J.busy.start("Moving entries",posts.length,"entries");try{for(const p of posts){const v=J.get("vouchers",p.v.id);if(!v)continue;const lines=v.lines.map(l=>l.a===from?{...l,a:to,...(svc&&+l.dr>0?{s:svc}:{})}:l);const rec={...(v.rec||{})};if(rec[from]){rec[to]=rec[from];delete rec[from]}
       const narr=all?(fd.note?((v.narr||"")+" · "+fd.note).slice(0,240):v.narr):String(fd.narr??v.narr).trim();
       await J.postVoucher({...v,id:v.id,lines,party:v.party===from?to:v.party,narr,rec});J.busy.tick()}
     if(fd.remember&&src&&!src.sys)await J.rememberParty(from,to);
     if(src&&!src.sys&&!(J.D.post?.get(from)||[]).some(p=>!posts.find(x=>x.v.id===p.v.id)))await J.store.patch("accounts",from,{active:false,note:"Merged into "+J.accName(to)})}finally{J.busy.end()}
     toast((all?posts.length+" entries":"Entry")+" moved to "+J.accName(to))}});
  setTimeout(upd,30)});
})();
